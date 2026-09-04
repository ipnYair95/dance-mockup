import { Plus, Play, Pause, SkipBack, StickyNote } from 'lucide-react';
import type { Formation, Note } from '../../types';
import { FormationBlock } from '../FormationBlock/FormationBlock';
import { NoteBlock } from '../NoteBlock/NoteBlock';
import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from './Timeline.module.scss';
import { useTimeline } from '../../hooks/useTimeline';

interface TimelineProps {
  formations: Formation[];
  currentFormationIndex: number;
  onAddFormation: () => void;
  onSelectFormation: (index: number) => void;
  onDurationChange: (index: number, newDuration: number) => void;
  onTransitionChange: (index: number, newTransition: number) => void;
  notes: Note[];
  onAddNote: (startTime?: number) => void;
  onUpdateNoteDuration: (index: number, newDuration: number) => void;
  onUpdateNoteStartTime: (index: number, newStart: number) => void;
  onUpdateNoteText: (id: string, text: string) => void;
  onDeleteNotes: (indices: number[]) => void;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onAudioUpload: (file: File) => void;
  onDeleteFormation: (indices: number[]) => void;
  clearSignal?: number;
}

export function Timeline({
  formations,
  currentFormationIndex,
  onAddFormation,
  onSelectFormation,
  onDurationChange,
  onTransitionChange,
  notes,
  onAddNote,
  onUpdateNoteDuration,
  onUpdateNoteStartTime,
  onUpdateNoteText,
  onDeleteNotes,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onAudioUpload,
  onDeleteFormation,
  clearSignal = 0
}: TimelineProps) {
  const totalFormationsDuration = formations.reduce((acc, f) => acc + f.duration, 0);
  const maxNoteEnd = notes.reduce((acc, n) => Math.max(acc, n.startTime + n.duration), 0);
  const timelineDuration = Math.max(duration || 0, totalFormationsDuration, maxNoteEnd, 60);

  const [selectedNoteIndices, setSelectedNoteIndices] = useState<Set<number>>(new Set());

  const {
    pixelsPerSecond,
    selectedIndices,
    isSpacePressed,
    isPanning,
    trackRef,
    zoomIn,
    zoomOut,
    handleTimelineClick,
    handleTrackMouseDown,
    handleTrackMouseMove,
    handleTrackMouseUp,
    selectFormation,
    formatTime,
  } = useTimeline({
    formationsLength: formations.length,
    currentFormationIndex,
    timelineDuration,
    onSeek,
    onDeleteFormation,
  });

  // Delete seleccionado de notas (cuando no hay formación seleccionada o con foco en notas)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.code === 'Delete' || e.code === 'Backspace') && e.target === document.body) {
        if (selectedNoteIndices.size > 0) {
          e.preventDefault();
          onDeleteNotes(Array.from(selectedNoteIndices));
          setSelectedNoteIndices(new Set());
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNoteIndices, onDeleteNotes]);

  const selectNote = (index: number, e?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
    if (e?.shiftKey || e?.metaKey || e?.ctrlKey) {
      setSelectedNoteIndices(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    } else {
      setSelectedNoteIndices(new Set([index]));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#A78BFA',
        progressColor: '#22d3ee',
        height: 40,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
        interact: false,
        fillParent: true,
        autoScroll: false,
        autoCenter: false,
      });
    }
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAudioUpload(file);
      const url = URL.createObjectURL(file);
      if (wavesurfer.current) {
        wavesurfer.current.load(url);
      }
    }
  };

  useEffect(() => {
    if (wavesurfer.current) {
      try {
        wavesurfer.current.zoom(pixelsPerSecond);
      } catch {
        console.warn("WaveSurfer zoom failed, audio might not be loaded yet.");
      }
    }
  }, [pixelsPerSecond]);

  useEffect(() => {
    if (clearSignal > 0 && wavesurfer.current) {
      try {
        wavesurfer.current.empty();
      } catch {
        console.warn("WaveSurfer clear failed.");
      }
    }
  }, [clearSignal]);

  const renderRuler = () => {
    const ticks: React.ReactNode[] = [];
    // Audacity-like: elige paso para que cada label ocupe ~90-140px
    const candidates = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300];
    const targetPx = 110;
    let major = 20;
    for (const c of candidates) {
      if (c * pixelsPerSecond >= targetPx) { major = c; break; }
      major = c;
    }
    // si zoom muy bajo, asegura 60s mínimo
    if (pixelsPerSecond <= 8) major = 60;
    const minor = major >= 10 ? major / 5 : major >= 5 ? 1 : 0;
    const num = Math.ceil(timelineDuration / major);
    for (let i = 0; i <= num; i++) {
      const sec = i * major;
      const mm = String(Math.floor(sec / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      // sub-ticks intermedios (más tenues)
      if (minor > 0 && i < num) {
        for (let m = 1; m < major / minor; m++) {
          const subSec = sec + m * minor;
          if (subSec >= timelineDuration) break;
          ticks.push(
            <div key={`m-${subSec}`} className={styles.rulerTickMinor} style={{ left: `${subSec * pixelsPerSecond}px` }} />
          );
        }
      }
      ticks.push(
        <div key={sec} className={styles.rulerTick} style={{ left: `${sec * pixelsPerSecond}px` }}>
          {mm}:{ss}
        </div>
      );
    }
    return ticks;
  };

  const trackCursorClass = isSpacePressed
    ? (isPanning ? styles.grabbing : styles.grab)
    : '';

  const zoomPercent = Math.round((pixelsPerSecond / 40) * 100);

  return (
    <footer className={styles.timeline}>
      <div className={styles.timelineControls}>
        <button className={styles.iconBtn} onClick={() => onSeek(0)} title="Jump to start"><SkipBack size={16} /></button>
        <button className={isPlaying ? styles.pauseBtn : styles.playBtn} onClick={onTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="white" style={{ marginLeft: 1 }} />}
        </button>
        <span className={styles.timeLabel}>
          {formatTime(currentTime)} <span className={styles.timeTotal}>/ {formatTime(duration || timelineDuration)}</span>
        </span>

        <div className={styles.actionBtns}>
          <button className={styles.addFormationBtn} onClick={onAddFormation} aria-label="New Formation">
            <Plus size={10} /> Formación
          </button>

          <button className={styles.addFormationBtn} onClick={() => onAddNote(currentTime)} title="Añadir nota en el playhead" aria-label="Add Note">
            <StickyNote size={10} /> Nota
          </button>

          <button className={styles.addAudioBtn} onClick={() => fileInputRef.current?.click()} aria-label="Add Audio">
            <Plus size={10} /> Audio
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAudioUpload}
            accept="audio/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.zoomControls}>
          <button className={styles.iconBtn} onClick={zoomOut} title="Zoom Out">—</button>
          <span className={styles.zoomLabel}>{zoomPercent}%</span>
          <button className={styles.iconBtn} onClick={zoomIn} title="Zoom In">+</button>
        </div>
      </div>

      <div
        className={`${styles.timelineTrackContainer} ${trackCursorClass}`}
        ref={trackRef}
        onClick={handleTimelineClick}
        onMouseDown={handleTrackMouseDown}
        onMouseMove={handleTrackMouseMove}
        onMouseUp={handleTrackMouseUp}
        onMouseLeave={handleTrackMouseUp}
      >
        <div className={styles.timelineContent} style={{ width: `${timelineDuration * pixelsPerSecond}px` }}>
          <div className={styles.ruler}>
            {renderRuler()}
          </div>

          <div className={styles.audioTrack}>
            <div id="waveform" ref={waveformRef} style={{ width: `${(duration || timelineDuration) * pixelsPerSecond}px` }} />
            {!duration && (
              <span className={styles.audioEmpty}>
                No Audio Track
              </span>
            )}
          </div>

          <div className={styles.formationsTrack}>
            {formations.map((form, index) => (
              <FormationBlock
                key={form.id}
                formation={form}
                index={index}
                isActive={selectedIndices.has(index) || index === currentFormationIndex}
                pixelsPerSecond={pixelsPerSecond}
                onSelect={(e) => {
                  selectFormation(index, e);
                  if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
                    onSelectFormation(index);
                    const startTime = formations.slice(0, index).reduce((acc, f) => acc + f.duration, 0);
                    onSeek(startTime);
                  }
                }}
                onDurationChange={(newDuration) => onDurationChange(index, newDuration)}
                onTransitionChange={(newTransition) => onTransitionChange(index, newTransition)}
              />
            ))}
          </div>

          {/* Notas: pista debajo de formaciones, bloques redimensionables */}
          <div className={styles.notesTrack}>
            {notes.map((note, index) => (
              <NoteBlock
                key={note.id}
                note={note}
                index={index}
                isActive={selectedNoteIndices.has(index)}
                pixelsPerSecond={pixelsPerSecond}
                onSelect={(e) => selectNote(index, e)}
                onDurationChange={(d) => onUpdateNoteDuration(index, d)}
                onStartTimeChange={(s) => onUpdateNoteStartTime(index, s)}
                onTextChange={(t) => onUpdateNoteText(note.id, t)}
              />
            ))}
            {notes.length === 0 && (
              <span className={styles.notesEmpty}>Notas — añade con “Add Note”</span>
            )}
          </div>

          <div
            className={styles.playhead}
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <span className={styles.playheadBadge}>{currentTime.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
