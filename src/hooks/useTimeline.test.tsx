import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useTimeline } from './useTimeline';

const keyEvent = (overrides: Partial<KeyboardEvent> = {}): KeyboardEvent =>
  ({
    shiftKey: false,
    key: '',
    code: '',
    target: document.body,
    preventDefault: vi.fn(),
    ...overrides,
  }) as unknown as KeyboardEvent;

const mouseEvent = (clientX: number): ReactMouseEvent =>
  ({ clientX }) as unknown as ReactMouseEvent;

const stubTrack = (left: number, scrollLeft = 0) =>
  ({ getBoundingClientRect: () => ({ left }), scrollLeft }) as unknown as HTMLDivElement;

const setup = (overrides: Partial<Parameters<typeof useTimeline>[0]> = {}) =>
  renderHook(() =>
    useTimeline({
      formationsLength: 3,
      currentFormationIndex: 1,
      timelineDuration: 60,
      onSeek: vi.fn(),
      onDeleteFormation: vi.fn(),
      ...overrides,
    })
  );

describe('useTimeline', () => {
  describe('formatTime', () => {
    it('formats time as mm:ss.t', () => {
      const { result } = setup();
      expect(result.current.formatTime(0)).toBe('00:00.0');
      expect(result.current.formatTime(65.5)).toBe('01:05.5');
      expect(result.current.formatTime(59.99)).toBe('00:59.9');
    });
  });

  describe('initial state', () => {
    it('starts with default zoom, selection and no panning', () => {
      const { result } = setup();
      expect(result.current.pixelsPerSecond).toBe(30);
      expect(result.current.selectedIndices).toEqual(new Set([1]));
      expect(result.current.isSpacePressed).toBe(false);
      expect(result.current.isPanning).toBe(false);
    });
  });

  describe('zoomIn / zoomOut', () => {
    it('clamps zoom between 5 and 150', () => {
      const { result } = setup();
      for (let i = 0; i < 20; i++) act(() => result.current.zoomIn());
      expect(result.current.pixelsPerSecond).toBe(150);
      for (let i = 0; i < 40; i++) act(() => result.current.zoomOut());
      expect(result.current.pixelsPerSecond).toBe(5);
    });
  });

  describe('handleKeyDown', () => {
    it('zooms with Shift+= and Shift+-', () => {
      const { result } = setup();
      act(() => result.current.handleKeyDown(keyEvent({ shiftKey: true, key: '=' })));
      expect(result.current.pixelsPerSecond).toBe(35);
      act(() => result.current.handleKeyDown(keyEvent({ shiftKey: true, key: '-' })));
      expect(result.current.pixelsPerSecond).toBe(30);
    });

    it('sets isSpacePressed on Space over body', () => {
      const { result } = setup();
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Space' })));
      expect(result.current.isSpacePressed).toBe(true);
    });

    it('deletes selected formations and resets selection', () => {
      const onDeleteFormation = vi.fn();
      const { result } = setup({ onDeleteFormation });
      act(() => result.current.selectFormation(2));
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Delete' })));
      expect(onDeleteFormation).toHaveBeenCalledWith([2]);
      expect(result.current.selectedIndices).toEqual(new Set([0]));
    });

    it('does not delete when only one formation remains', () => {
      const onDeleteFormation = vi.fn();
      const { result } = setup({ formationsLength: 1, onDeleteFormation });
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Backspace' })));
      expect(onDeleteFormation).not.toHaveBeenCalled();
    });
  });

  describe('handleKeyUp', () => {
    it('clears space press and panning', () => {
      const { result } = setup();
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Space' })));
      act(() => result.current.handleKeyUp(keyEvent({ code: 'Space' })));
      expect(result.current.isSpacePressed).toBe(false);
      expect(result.current.isPanning).toBe(false);
    });
  });

  describe('timeFromClick', () => {
    it('converts clientX to seconds and clamps to timelineDuration', () => {
      const { result } = setup({ timelineDuration: 60 });
      result.current.trackRef.current = stubTrack(10);
      expect(result.current.timeFromClick(110)).toBeCloseTo(100 / 30);
      expect(result.current.timeFromClick(9999)).toBe(60);
    });

    it('returns 0 when track has no element', () => {
      const { result } = setup();
      expect(result.current.timeFromClick(110)).toBe(0);
    });
  });

  describe('handleTimelineClick', () => {
    it('seeks to the clicked time', () => {
      const onSeek = vi.fn();
      const { result } = setup({ onSeek });
      result.current.trackRef.current = stubTrack(10);
      act(() => result.current.handleTimelineClick(mouseEvent(70)));
      expect(onSeek).toHaveBeenCalledWith(2);
    });

    it('ignores seek while space is pressed', () => {
      const onSeek = vi.fn();
      const { result } = setup({ onSeek });
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Space' })));
      result.current.trackRef.current = stubTrack(10);
      act(() => result.current.handleTimelineClick(mouseEvent(70)));
      expect(onSeek).not.toHaveBeenCalled();
    });
  });

  describe('selectFormation', () => {
    it('single-selects without modifiers', () => {
      const { result } = setup();
      act(() => result.current.selectFormation(2));
      expect(result.current.selectedIndices).toEqual(new Set([2]));
    });

    it('toggles multi-selection with shift', () => {
      const { result } = setup();
      act(() => result.current.selectFormation(2, { shiftKey: true }));
      expect(result.current.selectedIndices).toEqual(new Set([1, 2]));
      act(() => result.current.selectFormation(2, { shiftKey: true }));
      expect(result.current.selectedIndices).toEqual(new Set([1]));
    });
  });

  describe('panning', () => {
    it('starts panning on mouse down with space, moves and stops on up', () => {
      const { result } = setup();
      result.current.trackRef.current = stubTrack(0, 100);
      act(() => result.current.handleKeyDown(keyEvent({ code: 'Space' })));
      act(() => result.current.handleTrackMouseDown(mouseEvent(200)));
      expect(result.current.isPanning).toBe(true);
      act(() => result.current.handleTrackMouseMove(mouseEvent(180)));
      expect(result.current.trackRef.current?.scrollLeft).toBe(120);
      act(() => result.current.handleTrackMouseUp());
      expect(result.current.isPanning).toBe(false);
    });
  });
});
