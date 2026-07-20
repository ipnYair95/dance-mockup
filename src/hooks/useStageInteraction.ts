import { useState, useCallback } from 'react';
import type { DancerPosition } from '../types';

/**
 * Hook for stage multi-select:
 * - Drag on empty stage to draw selection rectangle
 * - Shift+click a dancer to add/remove from selection
 * - Moving a selected dancer moves all selected dancers together
 */
export function useStageInteraction() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear all selections
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Toggle a single dancer in/out of selection (Shift+click)
  const toggleDancer = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  // Calculate multi-drag offset: when one dancer moves, offset all others the same delta
  const computeMultiDragPositions = useCallback((
    movedId: string,
    newX: number,
    newY: number,
    positions: DancerPosition[],
    prevX: number,
    prevY: number,
  ): DancerPosition[] => {
    if (!selectedIds.has(movedId) || selectedIds.size <= 1) return positions;

    const dx = newX - prevX;
    const dy = newY - prevY;

    return positions.map(p => {
      if (p.dancerId === movedId) return { ...p, x: newX, y: newY };
      if (selectedIds.has(p.dancerId)) return { ...p, x: p.x + dx, y: p.y + dy };
      return p;
    });
  }, [selectedIds]);

  return {
    selectedIds,
    clearSelection,
    toggleDancer,
    computeMultiDragPositions,
  };
}
