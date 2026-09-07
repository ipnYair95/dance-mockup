import type { Formation } from '../../types';
import styles from './FormationBlock.module.scss';
import { useFormationResize } from '../../hooks/useFormationResize';

interface FormationBlockProps {
  formation: Formation;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: (e: React.MouseEvent) => void;
  onDurationChange: (newDuration: number) => void;
  onTransitionChange: (newTransition: number) => void;
  onStartTimeChange?: (newStart: number) => void;
}

export function FormationBlock({
  formation,
  isActive,
  isSelected,
  pixelsPerSecond,
  onSelect,
  onDurationChange,
  onTransitionChange,
  onStartTimeChange
}: FormationBlockProps) {
  const {
    width,
    transitionWidth,
    durationHandlers,
    transitionHandlers,
  } = useFormationResize({
    duration: formation.duration,
    transitionDuration: formation.transitionDuration,
    pixelsPerSecond,
    onDurationChange,
    onTransitionChange,
  });

  const left = (formation.startTime ?? 0) * pixelsPerSecond;

  const handleMoveMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.resizeHandle}`) || (e.target as HTMLElement).closest(`.${styles.transitionResizeHandle}`) || !onStartTimeChange) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startStart = formation.startTime ?? 0;
    const change = onStartTimeChange;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      change(Math.max(0, startStart + dx / pixelsPerSecond));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={`${styles.formationBlock} ${isSelected ? styles.isSelected : isActive ? styles.isActive : ''} ${isSelected ? styles.isSelectedBorder : ''}`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={onSelect}
      onMouseDown={handleMoveMouseDown}
    >
      <span className={styles.blockLabel}>{formation.name}</span>

      {/* Visual representation of transition time */}
      <div
        className={styles.transitionOverlay}
        style={{ width: `${transitionWidth}px` }}
      >
        {isActive && (
          <div
            className={styles.transitionResizeHandle}
            onMouseDown={transitionHandlers.onMouseDown}
            title="Adjust transition time"
          />
        )}
      </div>

      <div
        className={styles.resizeHandle}
        onMouseDown={durationHandlers.onMouseDown}
        title="Adjust formation duration"
      />
    </div>
  );
}
