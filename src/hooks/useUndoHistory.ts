import { useRef, useCallback } from 'react';
import type { Snapshot, UndoStack } from '../utils/undoHistory';
import { pushUndo, undoStack, redoStack, resetStack, canUndo as canUndoStack, canRedo as canRedoStack } from '../utils/undoHistory';

/**
 * Provides undo/redo for dancers and formations state.
 * Call `push(snapshot)` after every meaningful mutation.
 * Call `undo()` / `redo()` to travel through history.
 * Delegates all state transitions to the pure functions in `../utils/undoHistory`.
 */
export function useUndoHistory() {
  const stackRef = useRef<UndoStack>({ past: [], future: [] });

  const push = useCallback((snapshot: Snapshot) => {
    stackRef.current = pushUndo(stackRef.current, snapshot);
  }, []);

  const reset = useCallback((snapshot: Snapshot) => {
    stackRef.current = resetStack(stackRef.current, snapshot);
  }, []);

  const undo = useCallback((): Snapshot | null => {
    const { stack, snapshot } = undoStack(stackRef.current);
    stackRef.current = stack;
    return snapshot;
  }, []);

  const redo = useCallback((): Snapshot | null => {
    const { stack, snapshot } = redoStack(stackRef.current);
    stackRef.current = stack;
    return snapshot;
  }, []);

  const canUndo = useCallback(() => canUndoStack(stackRef.current), []);
  const canRedo = useCallback(() => canRedoStack(stackRef.current), []);

  return { push, reset, undo, redo, canUndo, canRedo };
}
