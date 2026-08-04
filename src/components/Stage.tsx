import { useRef, useState, useCallback } from 'react';
import type { Dancer, DancerPosition, Formation } from '../types';
import { DancerOnStage } from './DancerOnStage';
import { useStageZoom } from '../hooks/useStageZoom';

interface StageProps {
  dancers: Dancer[];
  activeFormation: Formation;
  onUpdateDancerPosition: (dancerId: string, x: number, y: number) => void;
  onUpdateMultiplePositions?: (positions: { dancerId: string; x: number; y: number }[]) => void;
}

export function Stage({ dancers, activeFormation, onUpdateDancerPosition, onUpdateMultiplePositions }: StageProps) {
  const stageAreaRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { zoom, zoomIn, zoomOut, resetZoom } = useStageZoom(stageAreaRef);

  // ── Selection ────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


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
    const target = e.target as HTMLElement;
    // If clicking on a dancer or a button/interactive element, don't pan
    if (target.closest('.dancer-on-stage') || target.closest('button') || target.closest('.zoom-controls')) return;
    
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
    // Update co-move offset so all other selected dancers follow in real-time
    setCoMoveOffset({ x: offsetX, y: offsetY });
  }, [selectedIds]);

  const handleDancerDragEnd = useCallback((dancerId: string, offsetX: number, offsetY: number) => {
    setIsDraggingDancer(false);
    setDraggingDancerId(null);
    setCoMoveOffset({ x: 0, y: 0 });

    if (selectedIds.has(dancerId) && selectedIds.size > 1 && onUpdateMultiplePositions) {
      const updates = activeFormation.positions
        .filter(p => selectedIds.has(p.dancerId))
        .map(p => {
          const start = dragStartPositions.get(p.dancerId);
          if (!start) return p;
          return { dancerId: p.dancerId, x: start.x + offsetX, y: start.y + offsetY };
        });
      onUpdateMultiplePositions(updates);
    } else {
      const pos = activeFormation.positions.find(p => p.dancerId === dancerId);
      if (pos) onUpdateDancerPosition(dancerId, pos.x + offsetX, pos.y + offsetY);
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

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section
      className="stage-area"
      ref={stageAreaRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
      onPointerDown={handleAreaPointerDown}
      onPointerMove={handleAreaPointerMove}
      onPointerUp={handleAreaPointerUp}
    >
      {/* Zoom indicator + controls */}
      <div className="zoom-controls" style={{
        position: 'absolute', bottom: '10px', right: '10px', zIndex: 50,
        display: 'flex', gap: '4px', alignItems: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        borderRadius: '8px', padding: '4px 8px', border: '1px solid var(--border-color)',
        pointerEvents: 'auto',
      }}>
        <button onClick={zoomOut} style={{ fontSize: '16px', lineHeight: 1, padding: '2px 6px', borderRadius: '4px' }}>−</button>
        <span onClick={resetZoom} title="Click to reset" style={{ fontSize: '12px', minWidth: '42px', textAlign: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          {zoomPercent}%
        </span>
        <button onClick={zoomIn} style={{ fontSize: '16px', lineHeight: 1, padding: '2px 6px', borderRadius: '4px' }}>+</button>
      </div>

      {/* Selection count badge */}
      {selectedIds.size > 1 && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 50,
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#C4B5FD',
        }}>
          {selectedIds.size} selected · drag any to move all
        </div>
      )}



      {/* Zoomed + panned stage wrapper */}
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            position: 'relative',
          }}
        >
          <div
            className="stage"
            ref={stageRef}
            style={{ position: 'relative' }}
            onClick={() => setSelectedIds(new Set())}
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
        </div>
      </div>
    </section>
  );
}
