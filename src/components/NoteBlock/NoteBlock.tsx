import { useState, useRef, useCallback } from 'react';
import type { Note } from '../../types';
import styles from './NoteBlock.module.scss';

interface NoteBlockProps {
  note: Note;
  index: number;
  isActive: boolean;
  pixelsPerSecond: number;
  onSelect: (e: React.MouseEvent) => void;
  onDurationChange: (newDuration: number) => void;
  onStartTimeChange: (newStart: number) => void;
  onTextChange: (text: string) => void;
}

export function NoteBlock({
  note,
  isActive,
  pixelsPerSecond,
  onSelect,
  onDurationChange,
  onStartTimeChange,
  onTextChange,
}: NoteBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const dragRef = useRef<{ startX: number; startStart: number; startDuration: number; mode: 'move' | 'resize' } | null>(null);

  const width = note.duration * pixelsPerSecond;
  const left = note.startTime * pixelsPerSecond;

  const handleSave = useCallback(() => {
    const t = editText.trim() || 'Nota';
    if (t !== note.text) onTextChange(t);
    setIsEditing(false);
  }, [editText, note.text, onTextChange]);

  const handleMoveMouseDown = useCallback((e: React.MouseEvent) => {
    // No iniciar drag si se hace click en el handle de resize
    if ((e.target as HTMLElement).closest(`.${styles.resizeHandle}`)) return;
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startStart: note.startTime, startDuration: note.duration, mode: 'move' };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const newStart = Math.max(0, dragRef.current.startStart + dx / pixelsPerSecond);
      onStartTimeChange(newStart);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      dragRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [note.startTime, note.duration, pixelsPerSecond, onStartTimeChange]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startStart: note.startTime, startDuration: note.duration, mode: 'resize' };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const newDuration = Math.max(0.5, dragRef.current.startDuration + dx / pixelsPerSecond);
      onDurationChange(newDuration);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      dragRef.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [note.duration, note.startTime, pixelsPerSecond, onDurationChange]);

  return (
    <div
      className={`${styles.noteBlock} ${isActive ? styles.isActive : ''}`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={onSelect}
      onMouseDown={handleMoveMouseDown}
      onDoubleClick={() => {
        setEditText(note.text);
        setIsEditing(true);
      }}
      title={`${note.text} — ${note.startTime.toFixed(1)}s → ${(note.startTime + note.duration).toFixed(1)}s (doble click para editar, arrastra para mover)`}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          className={styles.noteEditInput}
        />
      ) : (
        <span className={styles.noteLabel}>{note.text}</span>
      )}
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeMouseDown}
        title="Arrastra para cambiar duración"
      />
    </div>
  );
}
