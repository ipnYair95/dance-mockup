import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => {
  const history = {
    push: vi.fn(),
    undo: vi.fn(() => null),
    redo: vi.fn(() => null),
    reset: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
  };
  return {
    useUndoHistory: vi.fn(() => history),
    history,
  };
});

vi.mock('./useUndoHistory', () => ({ useUndoHistory: mocks.useUndoHistory }));

import { useDanceState, DEFAULT_DANCERS, DEFAULT_FORMATIONS } from './useDanceState';
import type { Dancer, Formation } from '../types';

const customDancer: Dancer = { id: 'x', name: 'X', color: '#000', shape: 'circle' };
const customFormation: Formation = {
  id: 'form-x',
  name: 'Formation X',
  duration: 4,
  transitionDuration: 2,
  positions: [{ dancerId: 'x', x: 1, y: 2 }],
};

describe('useDanceState', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with the default project', () => {
    const { result } = renderHook(() => useDanceState());
    expect(result.current.dancers).toEqual(DEFAULT_DANCERS);
    expect(result.current.formations).toEqual(DEFAULT_FORMATIONS);
    expect(result.current.currentFormationIndex).toBe(0);
  });

  it('addDancer appends a dancer with a timestamp id and registers the snapshot in undo history', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.addDancer());
    expect(result.current.dancers).toHaveLength(4);
    expect(result.current.dancers[3].id).toBe('1700000000000');
    expect(result.current.formations[0].positions).toHaveLength(4);
    const snapshot = mocks.history.push.mock.calls[mocks.history.push.mock.calls.length - 1][0];
    expect(snapshot.dancers).toHaveLength(4);
    expect(snapshot.formations[0].positions).toHaveLength(4);
  });

  it('updateDancer applies partial updates', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.updateDancer('1', { name: 'Renamed', color: '#fff', shape: 'triangle' }));
    expect(result.current.dancers[0]).toMatchObject({ name: 'Renamed', color: '#fff', shape: 'triangle' });
  });

  it('deleteDancer removes the dancer and its positions', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.deleteDancer('1'));
    expect(result.current.dancers).toHaveLength(2);
    expect(result.current.formations[0].positions).toHaveLength(2);
  });

  it('addFormation clones the active formation positions and moves selection', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.addFormation());
    expect(result.current.formations).toHaveLength(2);
    expect(result.current.formations[1].id).toBe('form-1700000000000');
    expect(result.current.formations[1].positions).toEqual(DEFAULT_FORMATIONS[0].positions);
    expect(result.current.currentFormationIndex).toBe(1);
  });

  it('deleteFormation removes the given indices', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.addFormation());
    act(() => result.current.deleteFormation([0]));
    expect(result.current.formations).toHaveLength(1);
    expect(result.current.formations[0].id).toBe('form-1700000000000');
  });

  it('deleteFormation keeps at least one formation', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.deleteFormation([0]));
    expect(result.current.formations).toHaveLength(1);
  });

  it('updateDancerPosition moves a single dancer in the active formation', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.updateDancerPosition('1', 100, 200));
    expect(result.current.activeFormation.positions[0]).toEqual({ dancerId: '1', x: 100, y: 200 });
  });

  it('updateMultipleDancerPositions moves several dancers at once', () => {
    const { result } = renderHook(() => useDanceState());
    act(() =>
      result.current.updateMultipleDancerPositions([
        { dancerId: '1', x: 10, y: 20 },
        { dancerId: '2', x: 30, y: 40 },
      ])
    );
    expect(result.current.activeFormation.positions[0]).toEqual({ dancerId: '1', x: 10, y: 20 });
    expect(result.current.activeFormation.positions[1]).toEqual({ dancerId: '2', x: 30, y: 40 });
  });

  it('updateFormationDuration clamps to a minimum of 1 second', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.updateFormationDuration(0, 0));
    expect(result.current.formations[0].duration).toBe(1);
    act(() => result.current.updateFormationDuration(0, 10));
    expect(result.current.formations[0].duration).toBe(10);
  });

  it('updateTransitionDuration clamps to the formation duration', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.updateTransitionDuration(0, 100));
    expect(result.current.formations[0].transitionDuration).toBe(5);
    act(() => result.current.updateTransitionDuration(0, 2));
    expect(result.current.formations[0].transitionDuration).toBe(2);
  });

  it('loadProject replaces the project and resets the selection', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.loadProject([customDancer], [customFormation]));
    expect(result.current.dancers).toEqual([customDancer]);
    expect(result.current.formations).toEqual([customFormation]);
    expect(result.current.currentFormationIndex).toBe(0);
  });

  it('clearProject restores defaults and resets undo history', () => {
    const { result } = renderHook(() => useDanceState());
    act(() => result.current.addDancer());
    act(() => result.current.clearProject());
    expect(result.current.dancers).toEqual(DEFAULT_DANCERS);
    expect(result.current.formations).toEqual(DEFAULT_FORMATIONS);
    expect(mocks.history.reset).toHaveBeenCalled();
  });
});
