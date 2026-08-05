import type { Formation } from '../../types';
import styles from './FormationBlock.module.scss';
import { useFormationResize } from '../../hooks/useFormationResize';

interface FormationBlockProps {
  formation: Formation;
  index: number;
  isActive: boolean;
  pixelsPerSecond: number;
  onSelect: (e: React.MouseEvent) => void;
  onDurationChange: (newDuration: number) => void;
  onTransitionChange: (newTransition: number) => void;
}

export function FormationBlock({
  formation,
  isActive,
  pixelsPerSecond,
  onSelect,
  onDurationChange,
  onTransitionChange
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

  return (
    <div
      className={`${styles.formationBlock} ${isActive ? styles.isActive : ''}`}
      style={{ width: `${width}px` }}
      onClick={onSelect}
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
