import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Snapshot } from '../utils/undoHistory';

const mocks = vi.hoisted(() => ({
  createUndoStack: vi.fn(),
  pushUndo: vi.fn(),
  undoStack: vi.fn(),
  redoStack: vi.fn(),
  resetStack: vi.fn(),
  canUndo: vi.fn(() => false),
  canRedo: vi.fn(() => false),
}));

vi.mock('../utils/undoHistory', () => mocks);

import { useUndoHistory } from './useUndoHistory';

const snapshot: Snapshot = { dancers: [], formations: [], notes: [] };

describe('useUndoHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates push to pushUndo with the current stack', () => {
    const { result } = renderHook(() => useUndoHistory());
    act(() => {
      result.current.push(snapshot);
    });
    expect(mocks.pushUndo).toHaveBeenCalledTimes(1);
    expect(mocks.pushUndo).toHaveBeenCalledWith({ past: [], future: [] }, snapshot);
  });

  it('delegates reset to resetStack', () => {
    const { result } = renderHook(() => useUndoHistory());
    act(() => {
      result.current.reset(snapshot);
    });
    expect(mocks.resetStack).toHaveBeenCalledTimes(1);
    expect(mocks.resetStack).toHaveBeenCalledWith({ past: [], future: [] }, snapshot);
  });

  it('delegates undo to undoStack and returns its snapshot', () => {
    mocks.undoStack.mockReturnValue({ stack: { past: [], future: [] }, snapshot });
    const { result } = renderHook(() => useUndoHistory());
    let snap: Snapshot | null | undefined;
    act(() => {
      snap = result.current.undo();
    });
    expect(mocks.undoStack).toHaveBeenCalledTimes(1);
    expect(snap).toBe(snapshot);
  });

  it('delegates redo to redoStack and returns its snapshot', () => {
    mocks.redoStack.mockReturnValue({ stack: { past: [], future: [] }, snapshot });
    const { result } = renderHook(() => useUndoHistory());
    let snap: Snapshot | null | undefined;
    act(() => {
      snap = result.current.redo();
    });
    expect(mocks.redoStack).toHaveBeenCalledTimes(1);
    expect(snap).toBe(snapshot);
  });

  it('delegates canUndo and canRedo', () => {
    const { result } = renderHook(() => useUndoHistory());
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
    expect(mocks.canUndo).toHaveBeenCalledTimes(1);
    expect(mocks.canRedo).toHaveBeenCalledTimes(1);
  });
});
