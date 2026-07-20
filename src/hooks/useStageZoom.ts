import { useState, useEffect, useCallback } from 'react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

/**
 * Hook for managing stage zoom level.
 * - Ctrl/Cmd + Scroll → zoom in/out at cursor position
 * - Ctrl/Cmd + = → zoom in
 * - Ctrl/Cmd + - → zoom out
 * - Ctrl/Cmd + 0 → reset zoom to 100%
 */
export function useStageZoom(containerRef: React.RefObject<HTMLElement | null>) {
  const [zoom, setZoom] = useState(1);

  const clamp = (val: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val));

  const zoomIn = useCallback(() => setZoom(z => clamp(parseFloat((z + ZOOM_STEP).toFixed(2)))), []);
  const zoomOut = useCallback(() => setZoom(z => clamp(parseFloat((z - ZOOM_STEP).toFixed(2)))), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      
      const deltaVal = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      if (deltaVal === 0) return;

      const delta = deltaVal > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(z => clamp(parseFloat((z + delta).toFixed(2))));
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
      if (e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomIn, zoomOut, resetZoom]);

  return { zoom, zoomIn, zoomOut, resetZoom };
}
