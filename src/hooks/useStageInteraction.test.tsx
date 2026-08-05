import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useStageInteraction } from './useStageInteraction';
import type { DancerPosition } from '../types';

const click = (mods: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {}): ReactMouseEvent =>
  ({ shiftKey: false, metaKey: false, ctrlKey: false, ...mods }) as unknown as ReactMouseEvent;

const positions: DancerPosition[] = [
  { dancerId: 'a', x: 100, y: 200 },
  { dancerId: 'b', x: 50, y: 60 },
  { dancerId: 'c', x: 0, y: 0 },
];

describe('useStageInteraction', () => {
  it('starts with an empty selection', () => {
    const { result } = renderHook(() => useStageInteraction());
    expect(result.current.selectedIds).toEqual(new Set());
  });

  it('toggleDancer single-selects without modifiers', () => {
    const { result } = renderHook(() => useStageInteraction());
    act(() => result.current.toggleDancer('a', click()));
    expect(result.current.selectedIds).toEqual(new Set(['a']));
  });

  it('toggleDancer adds/removes with shift', () => {
    const { result } = renderHook(() => useStageInteraction());
    act(() => result.current.toggleDancer('a', click({ shiftKey: true })));
    expect(result.current.selectedIds).toEqual(new Set(['a']));
    act(() => result.current.toggleDancer('b', click({ shiftKey: true })));
    expect(result.current.selectedIds).toEqual(new Set(['a', 'b']));
    act(() => result.current.toggleDancer('a', click({ shiftKey: true })));
    expect(result.current.selectedIds).toEqual(new Set(['b']));
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useStageInteraction());
    act(() => result.current.toggleDancer('a', click()));
    act(() => result.current.clearSelection());
    expect(result.current.selectedIds).toEqual(new Set());
  });

  it('computeMultiDragPositions offsets every selected dancer by the same delta', () => {
    const { result } = renderHook(() => useStageInteraction());
    act(() => result.current.toggleDancer('a', click()));
    act(() => result.current.toggleDancer('b', click({ shiftKey: true })));
    const next = result.current.computeMultiDragPositions('a', 110, 220, positions, 100, 200);
    expect(next).toEqual([
      { dancerId: 'a', x: 110, y: 220 },
      { dancerId: 'b', x: 60, y: 80 },
      { dancerId: 'c', x: 0, y: 0 },
    ]);
  });

  it('computeMultiDragPositions returns positions unchanged when the moved dancer is not selected', () => {
    const { result } = renderHook(() => useStageInteraction());
    act(() => result.current.toggleDancer('a', click()));
    const next = result.current.computeMultiDragPositions('c', 999, 999, positions, 1, 1);
    expect(next).toEqual(positions);
  });

  it('computeMultiDragPositions returns positions unchanged for a single selection', () => {
    const { result } = renderHook(() => useStageInteraction());
    const next = result.current.computeMultiDragPositions('a', 999, 999, positions, 1, 1);
    expect(next).toEqual(positions);
  });
});
