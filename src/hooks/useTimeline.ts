import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface UseTimelineParams {
  formationsLength: number;
  currentFormationIndex: number;
  timelineDuration: number;
  onSeek: (t: number) => void;
  onDeleteFormation: (indices: number[]) => void;
}

const MIN_ZOOM = 5;
const MAX_ZOOM = 150;

export function useTimeline({
  formationsLength,
  currentFormationIndex,
  timelineDuration,
  onSeek,
  onDeleteFormation,
}: UseTimelineParams) {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(30);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => new Set([currentFormationIndex]));
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef(0);
  const scrollStartRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const clampZoom = useCallback((v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v)), []);

  const zoomIn = useCallback(() => {
    setPixelsPerSecond(p => clampZoom(p + 10));
  }, [clampZoom]);

  const zoomOut = useCallback(() => {
    setPixelsPerSecond(p => clampZoom(p - 10));
  }, [clampZoom]);

  // Shift+scroll to zoom the timeline
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      // Browsers often convert Shift+Vertical Scroll into Horizontal Scroll (deltaX)
      const deltaVal = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      if (deltaVal === 0) return;
      const delta = deltaVal > 0 ? -5 : 5;
      setPixelsPerSecond(p => clampZoom(p + delta));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [clampZoom]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Shift+= / Shift+- to zoom the timeline
    if (e.shiftKey && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      setPixelsPerSecond(p => clampZoom(p + 5));
      return;
    }
    if (e.shiftKey && e.key === '-') {
      e.preventDefault();
      setPixelsPerSecond(p => clampZoom(p - 5));
      return;
    }
    // Space for panning
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      setIsSpacePressed(true);
    }
    // Delete/Backspace for formation deletion
    if ((e.code === 'Delete' || e.code === 'Backspace') && e.target === document.body) {
      if (formationsLength > 1) {
        onDeleteFormation(Array.from(selectedIndices));
        setSelectedIndices(new Set([Math.max(0, currentFormationIndex - 1)]));
      }
    }
  }, [clampZoom, formationsLength, currentFormationIndex, onDeleteFormation, selectedIndices]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsSpacePressed(false);
      setIsPanning(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const formatTime = useCallback((time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }, []);

  const timeFromClick = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const clickX = clientX - rect.left + el.scrollLeft;
    return Math.min(clickX / pixelsPerSecond, timelineDuration);
  }, [pixelsPerSecond, timelineDuration]);

  const handleTimelineClick = useCallback((e: ReactMouseEvent) => {
    if (isSpacePressed) return; // Ignore click seek if we are panning
    onSeek(timeFromClick(e.clientX));
  }, [isSpacePressed, onSeek, timeFromClick]);

  const handleTrackMouseDown = useCallback((e: ReactMouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = e.clientX;
      scrollStartRef.current = trackRef.current?.scrollLeft || 0;
    }
  }, [isSpacePressed]);

  const handleTrackMouseMove = useCallback((e: ReactMouseEvent) => {
    if (isPanning && trackRef.current) {
      const delta = e.clientX - panStartRef.current;
      trackRef.current.scrollLeft = scrollStartRef.current - delta;
    }
  }, [isPanning]);

  const handleTrackMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const selectFormation = useCallback((index: number, event?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
    if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
      setSelectedIndices(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        return newSet;
      });
    } else {
      setSelectedIndices(new Set([index]));
    }
  }, []);

  return {
    pixelsPerSecond,
    selectedIndices,
    isSpacePressed,
    isPanning,
    trackRef,
    zoomIn,
    zoomOut,
    handleTimelineClick,
    handleKeyDown,
    handleKeyUp,
    handleTrackMouseDown,
    handleTrackMouseMove,
    handleTrackMouseUp,
    selectFormation,
    formatTime,
    timeFromClick,
  };
}
