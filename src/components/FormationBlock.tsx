import { useRef, useEffect, useState } from 'react';
import type { Formation } from '../types';

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

  useEffect(() => {
    if (!isResizingDuration) {
      setCurrentWidth(formation.duration * pixelsPerSecond);
    }
    if (!isResizingTransition) {
      setCurrentTransitionWidth(formation.transitionDuration * pixelsPerSecond);
    }
  }, [formation.duration, formation.transitionDuration, pixelsPerSecond, isResizingDuration, isResizingTransition]);

  // Duration Resize
  const handleDurationMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizingDuration(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    
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
    setIsResizingTransition(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentTransitionWidth;
    
    document.addEventListener('mousemove', handleTransitionMouseMove);
    document.addEventListener('mouseup', handleTransitionMouseUp);
  };

  const handleTransitionMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    // Transition cannot exceed duration width
    const newWidth = Math.min(currentWidth, Math.max(5, startWidthRef.current + deltaX)); 
    setCurrentTransitionWidth(newWidth);
  };

  const handleTransitionMouseUp = (e: MouseEvent) => {
    setIsResizingTransition(false);
    document.removeEventListener('mousemove', handleTransitionMouseMove);
    document.removeEventListener('mouseup', handleTransitionMouseUp);
    
    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.min(currentWidth, Math.max(5, startWidthRef.current + deltaX));
    const newTransition = finalWidth / pixelsPerSecond;
    onTransitionChange(newTransition);
  };

  return (
    <div
      className={`formation-block ${isActive ? 'active' : ''}`}
      style={{ width: `${currentWidth}px`, flexShrink: 0 }}
      onClick={onSelect}
    >
      <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>{formation.name}</span>
      
      {/* Visual representation of transition time */}
      <div 
        className="transition-overlay"
        style={{ width: `${currentTransitionWidth}px` }}
      >
        {isActive && (
          <div 
            className="transition-resize-handle"
            onMouseDown={handleTransitionMouseDown}
            title="Adjust transition time"
          />
        )}
      </div>

      <div 
        className="resize-handle"
        onMouseDown={handleDurationMouseDown}
        title="Adjust formation duration"
      />
    </div>
  );
}
