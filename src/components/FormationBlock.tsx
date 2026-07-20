import { useRef, useEffect, useState } from 'react';
import type { Formation } from '../types';

interface FormationBlockProps {
  formation: Formation;
  index: number;
  isActive: boolean;
  pixelsPerSecond: number;
  onSelect: () => void;
  onDurationChange: (newDuration: number) => void;
}

export function FormationBlock({
  formation,
  isActive,
  pixelsPerSecond,
  onSelect,
  onDurationChange
}: FormationBlockProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(formation.duration * pixelsPerSecond);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (!isResizing) {
      setCurrentWidth(formation.duration * pixelsPerSecond);
    }
  }, [formation.duration, pixelsPerSecond, isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(20, startWidthRef.current + deltaX); // min 20px
    setCurrentWidth(newWidth);
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Calculate new duration
    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.max(20, startWidthRef.current + deltaX);
    const newDuration = finalWidth / pixelsPerSecond;
    onDurationChange(newDuration);
  };

  return (
    <div
      className={`formation-block ${isActive ? 'active' : ''}`}
      style={{ width: `${currentWidth}px`, flexShrink: 0 }}
      onClick={onSelect}
    >
      <span style={{ pointerEvents: 'none' }}>{formation.name}</span>
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
