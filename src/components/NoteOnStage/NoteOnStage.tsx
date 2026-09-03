import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { Note } from '../../types';
import styles from './NoteOnStage.module.scss';

interface NoteOnStageProps {
  note: Note;
  isVisible: boolean;
  isSelected: boolean;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onTextChange: (text: string) => void;
}

export function NoteOnStage({ note, isVisible, isSelected, isDragging = false, dragOffset = { x: 0, y: 0 }, onPointerDown, onClick, onTextChange }: NoteOnStageProps) {
  const x = note.x + (isDragging ? dragOffset.x : 0);
  const y = note.y + (isDragging ? dragOffset.y : 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`${styles.noteOnStage} ${isSelected ? styles.isSelected : ''} ${isDragging ? styles.isDragging : ''}`}
          data-note
          initial={{ opacity: 0, scale: 0.85, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 6 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ left: x, top: y, zIndex: isDragging ? 30 : 15 }}
          onClick={onClick}
        >
          <button
            type="button"
            className={styles.dragHandle}
            data-drag-handle
            onPointerDown={onPointerDown}
            onClick={e => e.stopPropagation()}
            title="Arrastrar nota"
            aria-label="Arrastrar nota"
          >
            <GripVertical size={14} />
          </button>
          <input
            className={styles.noteInput}
            value={note.text}
            onChange={e => onTextChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            placeholder="Nota…"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
