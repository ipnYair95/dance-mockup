import type { Dancer, Formation, Note } from '../types';

export interface Snapshot {
  dancers: Dancer[];
  formations: Formation[];
  notes: Note[];
}

export interface UndoStack {
  past: Snapshot[];
  future: Snapshot[];
}

const MAX_HISTORY = 50;

export function createUndoStack(s: Snapshot): UndoStack {
  return { past: [s], future: [] };
}

export function pushUndo(stack: UndoStack, s: Snapshot): UndoStack {
  return {
    past: [...stack.past.slice(-MAX_HISTORY + 1), s],
    future: [],
  };
}

export function undoStack(stack: UndoStack): { stack: UndoStack; snapshot: Snapshot | null } {
  if (stack.past.length < 2) return { stack, snapshot: null };
  const current = stack.past[stack.past.length - 1];
  const previous = stack.past[stack.past.length - 2];
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [current, ...stack.future],
    },
    snapshot: previous,
  };
}

export function redoStack(stack: UndoStack): { stack: UndoStack; snapshot: Snapshot | null } {
  if (stack.future.length === 0) return { stack, snapshot: null };
  const next = stack.future[0];
  return {
    stack: {
      past: [...stack.past, next],
      future: stack.future.slice(1),
    },
    snapshot: next,
  };
}

export function resetStack(_stack: UndoStack, s: Snapshot): UndoStack {
  return { past: [s], future: [] };
}

export function canUndo(stack: UndoStack): boolean {
  return stack.past.length >= 2;
}

export function canRedo(stack: UndoStack): boolean {
  return stack.future.length > 0;
}
