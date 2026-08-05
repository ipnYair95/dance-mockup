import { useState, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface UseFormationResizeParams {
  duration: number;
  transitionDuration: number;
  pixelsPerSecond: number;
  onDurationChange: (newDuration: number) => void;
  onTransitionChange: (newTransition: number) => void;
}

const MIN_DURATION_WIDTH = 20;
const MIN_TRANSITION_WIDTH = 5;

export function useFormationResize({
  duration,
  transitionDuration,
  pixelsPerSecond,
  onDurationChange,
  onTransitionChange,
}: UseFormationResizeParams) {
  const [isResizingDuration, setIsResizingDuration] = useState(false);
  const [isResizingTransition, setIsResizingTransition] = useState(false);

  const [currentWidth, setCurrentWidth] = useState(duration * pixelsPerSecond);
  const [currentTransitionWidth, setCurrentTransitionWidth] = useState(transitionDuration * pixelsPerSecond);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const durationWidthRef = useRef(duration * pixelsPerSecond);
  const durationMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const durationMouseUpRef = useRef<((e: MouseEvent) => void) | null>(null);
  const transitionMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const transitionMouseUpRef = useRef<((e: MouseEvent) => void) | null>(null);

  const width = isResizingDuration ? currentWidth : duration * pixelsPerSecond;
  const transitionWidth = isResizingTransition ? currentTransitionWidth : transitionDuration * pixelsPerSecond;

  // Duration Resize
  const handleDurationMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_DURATION_WIDTH, startWidthRef.current + deltaX);
    setCurrentWidth(newWidth);
  }, []);

  const handleDurationMouseUp = useCallback((e: MouseEvent) => {
    setIsResizingDuration(false);
    if (durationMouseMoveRef.current) document.removeEventListener('mousemove', durationMouseMoveRef.current);
    if (durationMouseUpRef.current) document.removeEventListener('mouseup', durationMouseUpRef.current);

    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.max(MIN_DURATION_WIDTH, startWidthRef.current + deltaX);
    onDurationChange(finalWidth / pixelsPerSecond);
  }, [onDurationChange, pixelsPerSecond]);

  const handleDurationMouseDown = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    const startWidth = width;
    setCurrentWidth(startWidth);
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
    durationWidthRef.current = width;
    setIsResizingDuration(true);

    durationMouseMoveRef.current = handleDurationMouseMove;
    durationMouseUpRef.current = handleDurationMouseUp;
    document.addEventListener('mousemove', handleDurationMouseMove);
    document.addEventListener('mouseup', handleDurationMouseUp);
  }, [width, handleDurationMouseMove, handleDurationMouseUp]);

  // Transition Resize
  const handleTransitionMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    // Transition cannot exceed duration width
    const newWidth = Math.min(durationWidthRef.current, Math.max(MIN_TRANSITION_WIDTH, startWidthRef.current + deltaX));
    setCurrentTransitionWidth(newWidth);
  }, []);

  const handleTransitionMouseUp = useCallback((e: MouseEvent) => {
    setIsResizingTransition(false);
    if (transitionMouseMoveRef.current) document.removeEventListener('mousemove', transitionMouseMoveRef.current);
    if (transitionMouseUpRef.current) document.removeEventListener('mouseup', transitionMouseUpRef.current);

    const deltaX = e.clientX - startXRef.current;
    const finalWidth = Math.min(durationWidthRef.current, Math.max(MIN_TRANSITION_WIDTH, startWidthRef.current + deltaX));
    onTransitionChange(finalWidth / pixelsPerSecond);
  }, [onTransitionChange, pixelsPerSecond]);

  const handleTransitionMouseDown = useCallback((e: ReactMouseEvent) => {
    e.stopPropagation();
    const startWidth = transitionWidth;
    setCurrentTransitionWidth(startWidth);
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
    durationWidthRef.current = width;
    setIsResizingTransition(true);

    transitionMouseMoveRef.current = handleTransitionMouseMove;
    transitionMouseUpRef.current = handleTransitionMouseUp;
    document.addEventListener('mousemove', handleTransitionMouseMove);
    document.addEventListener('mouseup', handleTransitionMouseUp);
  }, [width, transitionWidth, handleTransitionMouseMove, handleTransitionMouseUp]);

  return {
    width,
    transitionWidth,
    isResizingDuration,
    isResizingTransition,
    durationHandlers: { onMouseDown: handleDurationMouseDown },
    transitionHandlers: { onMouseDown: handleTransitionMouseDown },
  };
}
