import { useRef, useCallback } from 'react';
import type { Dancer, Formation } from '../types';

interface Snapshot {
  dancers: Dancer[];
  formations: Formation[];
}

const MAX_HISTORY = 50;

/**
 * Provides undo/redo for dancers and formations state.
 * Call `push(snapshot)` after every meaningful mutation.
 * Call `undo()` / `redo()` to travel through history.
 */
export function useUndoHistory() {
  // past[past.length - 1] is the most recent "before" snapshot
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  const push = useCallback((snapshot: Snapshot) => {
    past.current = [...past.current.slice(-MAX_HISTORY + 1), snapshot];
    future.current = []; // Any new action clears the redo stack
  }, []);

  const reset = useCallback((snapshot: Snapshot) => {
    past.current = [snapshot];
    future.current = [];
  }, []);

  const undo = useCallback((): Snapshot | null => {
    if (past.current.length < 2) return null; // Need at least 2: current + previous
    const current = past.current[past.current.length - 1];
    const previous = past.current[past.current.length - 2];
    // Move current to future, remove it from past
    future.current = [current, ...future.current];
    past.current = past.current.slice(0, -1);
    return previous;
  }, []);

  const redo = useCallback((): Snapshot | null => {
    if (future.current.length === 0) return null;
    const next = future.current[0];
    past.current = [...past.current, next];
    future.current = future.current.slice(1);
    return next;
  }, []);

  const canUndo = () => past.current.length >= 2;
  const canRedo = () => future.current.length > 0;

  return { push, reset, undo, redo, canUndo, canRedo };
}
