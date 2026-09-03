import { useRef, useState, useCallback } from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { Dancer, DancerPosition, Formation, Note } from '../../types';
import { DancerOnStage } from '../DancerOnStage/DancerOnStage';
import { NoteOnStage } from '../NoteOnStage/NoteOnStage';
import { useStageZoom } from '../../hooks/useStageZoom';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../../hooks/useDanceState';
import styles from './Stage.module.scss';

const GRID_SIZE = 50;
const DANCER_HALF = 15;

// Snap para que el centro de la figura caiga en la intersección del grid
function snapToGrid(value: number): number {
  return Math.round((value + DANCER_HALF) / GRID_SIZE) * GRID_SIZE - DANCER_HALF;
}

function clampToStage(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function snapPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: clampToStage(snapToGrid(x), STAGE_WIDTH - 30),
    y: clampToStage(snapToGrid(y), STAGE_HEIGHT - 30),
  };
}

interface StageProps {
  dancers: Dancer[];
  activeFormation: Formation;
  onUpdateDancerPosition: (dancerId: string, x: number, y: number) => void;
  onUpdateMultiplePositions?: (positions: { dancerId: string; x: number; y: number }[]) => void;
  notes?: Note[];
  currentTime?: number;
  isPlaying?: boolean;
  onUpdateNotePosition?: (id: string, x: number, y: number) => void;
  onUpdateNoteText?: (id: string, text: string) => void;
}

export function Stage({ dancers, activeFormation, onUpdateDancerPosition, onUpdateMultiplePositions, notes = [], currentTime = 0, isPlaying = false, onUpdateNotePosition, onUpdateNoteText }: StageProps) {
  const stageAreaRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { zoom, zoomIn, zoomOut, resetZoom } = useStageZoom(stageAreaRef);
  const [isLocked, setIsLocked] = useState(false);

  // ── Selection ────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // ── Note drag (libre: dentro o fuera del canvas, compensa zoom) ─────────────
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [noteDragOffset, setNoteDragOffset] = useState({ x: 0, y: 0 });
  const noteDragStartRef = useRef<{ x: number; y: number; noteX: number; noteY: number } | null>(null);


  // ── Panning ──────────────────────────────────────────────────────────────────
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });

  // ── Multi-drag ───────────────────────────────────────────────────────────────
  // Stores live delta applied to co-selected dancers during a multi-drag
  const [coMoveOffset, setCoMoveOffset] = useState({ x: 0, y: 0 });
  const [isDraggingDancer, setIsDraggingDancer] = useState(false);
  const [draggingDancerId, setDraggingDancerId] = useState<string | null>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());


  // ── Pan pointer handlers ─────────────────────────────────────────────────────
  const handleAreaPointerDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    const target = e.target as HTMLElement;
    // Si el click es en dancer/nota (o su handle/input/button), no hacer pan
    if (target.closest('[data-dancer]') || target.closest('[data-note]') || target.closest('[data-drag-handle]') || target.closest('button') || target.closest('[data-zoom-controls]') || target.closest('input')) return;

    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOffsetStartRef.current = { ...panOffset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleAreaPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPanOffset({ x: panOffsetStartRef.current.x + dx, y: panOffsetStartRef.current.y + dy });
  };

  const handleAreaPointerUp = () => setIsPanning(false);

  // ── Dancer drag callbacks ────────────────────────────────────────────────────
  const handleDancerDragStart = useCallback((dancerId: string) => {
    setIsDraggingDancer(true);
    setDraggingDancerId(dancerId);

    // Record start positions of all selected dancers for co-movement
    const startMap = new Map<string, { x: number; y: number }>();
    activeFormation.positions.forEach(p => {
      if (selectedIds.has(p.dancerId)) {
        startMap.set(p.dancerId, { x: p.x, y: p.y });
      }
    });
    setDragStartPositions(startMap);
    setCoMoveOffset({ x: 0, y: 0 });
  }, [selectedIds, activeFormation.positions]);

  const handleDancerDrag = useCallback((dancerId: string, offsetX: number, offsetY: number) => {
    if (!selectedIds.has(dancerId) || selectedIds.size <= 1) return;
    // Snap en vivo: calcula delta snapeado para que el preview coincida con intersecciones
    const start = dragStartPositions.get(dancerId);
    if (start) {
      const raw = { x: start.x + offsetX, y: start.y + offsetY };
      const snapped = snapPosition(raw.x, raw.y);
      setCoMoveOffset({ x: snapped.x - start.x, y: snapped.y - start.y });
      return;
    }
    setCoMoveOffset({ x: offsetX, y: offsetY });
  }, [selectedIds, dragStartPositions]);

  const handleDancerDragEnd = useCallback((dancerId: string, offsetX: number, offsetY: number) => {
    setIsDraggingDancer(false);
    setDraggingDancerId(null);
    setCoMoveOffset({ x: 0, y: 0 });

    // Snap final al grid: el centro queda en la intersección
    if (selectedIds.has(dancerId) && selectedIds.size > 1 && onUpdateMultiplePositions) {
      const draggedStart = dragStartPositions.get(dancerId);
      let deltaX = offsetX;
      let deltaY = offsetY;
      if (draggedStart) {
        const rawDragged = { x: draggedStart.x + offsetX, y: draggedStart.y + offsetY };
        const snappedDragged = snapPosition(rawDragged.x, rawDragged.y);
        deltaX = snappedDragged.x - draggedStart.x;
        deltaY = snappedDragged.y - draggedStart.y;
      }
      const updates = activeFormation.positions
        .filter(p => selectedIds.has(p.dancerId))
        .map(p => {
          const start = dragStartPositions.get(p.dancerId);
          if (!start) return p;
          // Preserva formación relativa aplicando mismo delta snapeado
          const raw = { x: start.x + deltaX, y: start.y + deltaY };
          const snapped = snapPosition(raw.x, raw.y);
          return { dancerId: p.dancerId, x: snapped.x, y: snapped.y };
        });
      onUpdateMultiplePositions(updates);
    } else {
      const pos = activeFormation.positions.find(p => p.dancerId === dancerId);
      if (pos) {
        const raw = { x: pos.x + offsetX, y: pos.y + offsetY };
        const snapped = snapPosition(raw.x, raw.y);
        onUpdateDancerPosition(dancerId, snapped.x, snapped.y);
      }
    }
  }, [selectedIds, activeFormation.positions, dragStartPositions, onUpdateDancerPosition, onUpdateMultiplePositions]);

  // ── Dancer click (selection) ─────────────────────────────────────────────────
  const handleDancerClick = useCallback((dancerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(dancerId)) next.delete(dancerId);
        else next.add(dancerId);
        return next;
      });
    } else {
      setSelectedIds(new Set([dancerId]));
    }
  }, []);

  // ── Note drag handlers (sin constraints, corrige zoom) ───────────────────────
  const handleNotePointerDown = useCallback((e: React.PointerEvent, note: Note) => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedNoteId(note.id);
    setDraggingNoteId(note.id);
    setNoteDragOffset({ x: 0, y: 0 });
    noteDragStartRef.current = { x: e.clientX, y: e.clientY, noteX: note.x, noteY: note.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isLocked]);

  const handleNotePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingNoteId || !noteDragStartRef.current) return;
    const dx = (e.clientX - noteDragStartRef.current.x) / zoom;
    const dy = (e.clientY - noteDragStartRef.current.y) / zoom;
    setNoteDragOffset({ x: dx, y: dy });
  }, [draggingNoteId, zoom]);

  const handleNotePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingNoteId || !noteDragStartRef.current) return;
    const dx = (e.clientX - noteDragStartRef.current.x) / zoom;
    const dy = (e.clientY - noteDragStartRef.current.y) / zoom;
    const start = noteDragStartRef.current;
    // Solo commitea si hubo movimiento significativo
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      onUpdateNotePosition?.(draggingNoteId, start.noteX + dx, start.noteY + dy);
    }
    setDraggingNoteId(null);
    setNoteDragOffset({ x: 0, y: 0 });
    noteDragStartRef.current = null;
  }, [draggingNoteId, zoom, onUpdateNotePosition]);

  const zoomLabel = `×${zoom.toFixed(1)}`;

  return (
    <section
      className={`${styles.stageArea} ${isPanning ? styles.panning : ''} ${isLocked ? styles.locked : ''}`}
      ref={stageAreaRef}
      onPointerDown={handleAreaPointerDown}
      onPointerMove={(e) => { handleAreaPointerMove(e); handleNotePointerMove(e); }}
      onPointerUp={(e) => { handleAreaPointerUp(); handleNotePointerUp(e); }}
    >
      {/* Zoom indicator + controls */}
      <div className={styles.zoomControls} data-zoom-controls>
        <button
          onClick={() => setIsLocked(v => !v)}
          className={`${styles.zoomBtn} ${isLocked ? styles.activeLock : ''}`}
          title={isLocked ? 'Desbloquear canvas' : 'Bloquear canvas'}
          aria-label={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          aria-pressed={isLocked}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
        <span style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 2px' }} />
        <button onClick={zoomOut} className={styles.zoomBtn}>−</button>
        <span onClick={resetZoom} title="Click to reset" className={styles.zoomPercent}>
          {zoomLabel}
        </span>
        <button onClick={zoomIn} className={styles.zoomBtn}>+</button>
      </div>

      <div className={styles.formationBadge}>
        F-{String(activeFormation.name.replace(/\D/g, '') || '01').padStart(2, '0')} — {activeFormation.name}
      </div>

      {/* Selection count badge */}
      {selectedIds.size > 1 && (
        <div className={styles.selectionBadge}>
          {selectedIds.size} selected · drag any to move all
        </div>
      )}

      {/* Zoomed + panned stage wrapper */}
      <div className={styles.stageCentered}>
        <div
          className={styles.stageTransform}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Rulers X/Y por fuera del canvas — 0 al centro, -1 0 1 */}
          <div className={styles.rulerX} aria-hidden>
            {Array.from({ length: STAGE_WIDTH / GRID_SIZE + 1 }, (_, i) => {
              const pos = i * GRID_SIZE;
              const label = i - STAGE_WIDTH / GRID_SIZE / 2;
              return (
                <span key={pos} className={styles.rulerTickX} style={{ left: pos }}>
                  {label}
                </span>
              );
            })}
          </div>
          <div className={styles.rulerY} aria-hidden>
            {Array.from({ length: STAGE_HEIGHT / GRID_SIZE + 1 }, (_, i) => {
              const pos = i * GRID_SIZE;
              const label = i - STAGE_HEIGHT / GRID_SIZE / 2;
              return (
                <span key={pos} className={styles.rulerTickY} style={{ top: pos }}>
                  {label}
                </span>
              );
            })}
          </div>

          <div
            className={styles.stage}
            ref={stageRef}
            onClick={() => { setSelectedIds(new Set()); setSelectedNoteId(null); }}
          >
            {activeFormation.positions.map(pos => {
              const { dancerId } = pos;
              const dancer = dancers.find(d => d.id === dancerId);
              if (!dancer) return null;

              // Compute effective position for co-moved dancers
              const isDragged = draggingDancerId === dancer.id;
              const isCoMoved = selectedIds.has(dancer.id) && !isDragged && isDraggingDancer;
              const start = dragStartPositions.get(dancer.id);
              const effectivePos: DancerPosition = isCoMoved && start
                ? { dancerId, x: start.x + coMoveOffset.x, y: start.y + coMoveOffset.y }
                : pos;

              return (
                <DancerOnStage
                  key={dancer.id}
                  dancer={dancer}
                  position={effectivePos}
                  stageRef={stageRef}
                  isSelected={selectedIds.has(dancer.id)}
                  transitionDuration={isCoMoved ? 0 : activeFormation.transitionDuration}
                  onDragStart={() => handleDancerDragStart(dancer.id)}
                  onDrag={(ox, oy) => handleDancerDrag(dancer.id, ox, oy)}
                  onDragEnd={(ox, oy) => handleDancerDragEnd(dancer.id, ox, oy)}
                  onClick={(e) => handleDancerClick(dancer.id, e)}
                />
              );
            })}
          </div>

          {/* Notas: posicionamiento libre dentro o fuera del canvas */}
          {notes.map(note => {
            const inRange = currentTime >= note.startTime && currentTime < note.startTime + note.duration;
            const isVisible = isPlaying ? inRange : true;
            const isDimmed = !inRange && !isPlaying;
            const isDragging = draggingNoteId === note.id;
            return (
              <div key={note.id} style={{ opacity: isDimmed ? 0.45 : 1, pointerEvents: isVisible ? 'auto' : 'none' }}>
                <NoteOnStage
                  note={note}
                  isVisible={isVisible}
                  isSelected={selectedNoteId === note.id}
                  isDragging={isDragging}
                  dragOffset={isDragging ? noteDragOffset : { x: 0, y: 0 }}
                  onPointerDown={(e) => handleNotePointerDown(e, note)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNoteId(note.id);
                  }}
                  onTextChange={(text) => onUpdateNoteText?.(note.id, text)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
