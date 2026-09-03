import { describe, it, expect } from 'vitest';
import type { Snapshot } from './undoHistory';
import { createUndoStack, pushUndo, undoStack, redoStack, resetStack, canUndo, canRedo } from './undoHistory';

const snap = (n: number): Snapshot => ({
  dancers: [],
  formations: [{ id: `f${n}`, name: `Formation ${n}`, duration: 5, transitionDuration: 1, positions: [] }],
  notes: [],
});

describe('undoHistory', () => {
  describe('createUndoStack', () => {
    it('seeds past with the snapshot and empty future', () => {
      const stack = createUndoStack(snap(1));
      expect(stack.past).toEqual([snap(1)]);
      expect(stack.future).toEqual([]);
    });
  });

  describe('pushUndo', () => {
    it('appends the snapshot to past and clears future', () => {
      const stack = createUndoStack(snap(1));
      stack.future = [snap(9)];
      const next = pushUndo(stack, snap(2));
      expect(next.past.map(s => s.formations[0].id)).toEqual(['f1', 'f2']);
      expect(next.future).toEqual([]);
    });

    it('caps past at 50 snapshots', () => {
      let stack = createUndoStack(snap(0));
      for (let i = 1; i <= 60; i++) {
        stack = pushUndo(stack, snap(i));
      }
      expect(stack.past.length).toBe(50);
      expect(stack.past[0].formations[0].id).toBe('f11');
      expect(stack.past[stack.past.length - 1].formations[0].id).toBe('f60');
    });
  });

  describe('undoStack', () => {
    it('returns the previous snapshot and moves current to future', () => {
      let stack = createUndoStack(snap(1));
      stack = pushUndo(stack, snap(2));
      const { stack: next, snapshot } = undoStack(stack);
      expect(snapshot).toEqual(snap(1));
      expect(next.past.map(s => s.formations[0].id)).toEqual(['f1']);
      expect(next.future.map(s => s.formations[0].id)).toEqual(['f2']);
    });

    it('returns null snapshot and unchanged stack when there is no history', () => {
      const stack = createUndoStack(snap(1));
      expect(undoStack(stack)).toEqual({ stack, snapshot: null });
    });
  });

  describe('redoStack', () => {
    it('returns the next snapshot and restores it to past', () => {
      let stack = createUndoStack(snap(1));
      stack = pushUndo(stack, snap(2));
      stack = undoStack(stack).stack;
      const { stack: next, snapshot } = redoStack(stack);
      expect(snapshot).toEqual(snap(2));
      expect(next.past.map(s => s.formations[0].id)).toEqual(['f1', 'f2']);
      expect(next.future).toEqual([]);
    });

    it('returns null snapshot when future is empty', () => {
      const stack = createUndoStack(snap(1));
      expect(redoStack(stack)).toEqual({ stack, snapshot: null });
    });
  });

  describe('resetStack', () => {
    it('resets to a single snapshot and clears future', () => {
      let stack = createUndoStack(snap(1));
      stack = pushUndo(stack, snap(2));
      stack = pushUndo(stack, snap(3));
      const next = resetStack(stack, snap(9));
      expect(next.past).toEqual([snap(9)]);
      expect(next.future).toEqual([]);
    });
  });

  describe('canUndo / canRedo', () => {
    it('reports undo availability based on past length', () => {
      expect(canUndo(createUndoStack(snap(1)))).toBe(false);
      const stacked = pushUndo(createUndoStack(snap(1)), snap(2));
      expect(canUndo(stacked)).toBe(true);
    });

    it('reports redo availability based on future length', () => {
      expect(canRedo(createUndoStack(snap(1)))).toBe(false);
      let stacked = pushUndo(createUndoStack(snap(1)), snap(2));
      stacked = undoStack(stacked).stack;
      expect(canRedo(stacked)).toBe(true);
    });
  });
});
