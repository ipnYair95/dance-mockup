import { useRef, useState } from 'react';
import type { Formation } from '../../types';
import styles from './FormationBlock.module.scss';

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
  const [isResizingDuration, setIsResizingDuration] = useState(false);
  const [isResizingTransition, setIsResizingTransition] = useState(false);
  
  const [currentWidth, setCurrentWidth] = useState(formation.duration * pixelsPerSecond);
  const [currentTransitionWidth, setCurrentTransitionWidth] = useState(formation.transitionDuration * pixelsPerSecond);
  
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const width = isResizingDuration ? currentWidth : formation.duration * pixelsPerSecond;
  const transitionWidth = isResizingTransition ? currentTransitionWidth : formation.transitionDuration * pixelsPerSecond;

  // Duration Resize
  const handleDurationMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startWidth = width;
    setCurrentWidth(startWidth);
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
    setIsResizingDuration(true);
    
    document.addEventListener('mousemove', handleDurationMouseMove);
    document.addEventListener('mouseup', handleDurationMouseUp);
  };

  const handleDurationMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(20, startWidthRef.current + deltaX); // min 20px
    setCurrentWidth(newWidth);
  };

  const handleDurationMouseUp = (e: MouseEvent) => {
    setIsResizingDuration(false);
    document.removeEventListener('mousemove', handleDurationMouseMove);
    document.removeEventListener('mouseup', handleDurationMouseUp);
    
    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.max(20, startWidthRef.current + deltaX);
    const newDuration = finalWidth / pixelsPerSecond;
    onDurationChange(newDuration);
  };

  // Transition Resize
  const handleTransitionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startWidth = transitionWidth;
    setCurrentTransitionWidth(startWidth);
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
    setIsResizingTransition(true);
    
    document.addEventListener('mousemove', handleTransitionMouseMove);
    document.addEventListener('mouseup', handleTransitionMouseUp);
  };

  const handleTransitionMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    // Transition cannot exceed duration width
    const newWidth = Math.min(width, Math.max(5, startWidthRef.current + deltaX)); 
    setCurrentTransitionWidth(newWidth);
  };

  const handleTransitionMouseUp = (e: MouseEvent) => {
    setIsResizingTransition(false);
    document.removeEventListener('mousemove', handleTransitionMouseMove);
    document.removeEventListener('mouseup', handleTransitionMouseUp);
    
    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.min(width, Math.max(5, startWidthRef.current + deltaX));
    const newTransition = finalWidth / pixelsPerSecond;
    onTransitionChange(newTransition);
  };

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
            onMouseDown={handleTransitionMouseDown}
            title="Adjust transition time"
          />
        )}
      </div>

      <div
        className={styles.resizeHandle}
        onMouseDown={handleDurationMouseDown}
        title="Adjust formation duration"
      />
    </div>
  );
}
