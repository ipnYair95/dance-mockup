import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useFormationResize } from './useFormationResize';

const setup = (overrides: Partial<Parameters<typeof useFormationResize>[0]> = {}) =>
  renderHook(() =>
    useFormationResize({
      duration: 5,
      transitionDuration: 1,
      pixelsPerSecond: 30,
      onDurationChange: vi.fn(),
      onTransitionChange: vi.fn(),
      ...overrides,
    })
  );

const reactMouseDown = (clientX: number): ReactMouseEvent =>
  ({ clientX, stopPropagation: vi.fn() }) as unknown as ReactMouseEvent;

const dispatchDoc = (type: string, clientX: number) =>
  document.dispatchEvent(new MouseEvent(type, { clientX }));

describe('useFormationResize', () => {
  it('computes width and transitionWidth from props', () => {
    const { result } = setup();
    expect(result.current.width).toBe(150);
    expect(result.current.transitionWidth).toBe(30);
  });

  it('resizes duration on drag and commits on mouseup', () => {
    const onDurationChange = vi.fn();
    const { result } = setup({ onDurationChange });
    act(() => result.current.durationHandlers.onMouseDown(reactMouseDown(100)));
    expect(result.current.isResizingDuration).toBe(true);
    act(() => dispatchDoc('mousemove', 150));
    expect(result.current.width).toBe(200);
    act(() => dispatchDoc('mouseup', 150));
    expect(result.current.isResizingDuration).toBe(false);
    expect(onDurationChange).toHaveBeenCalledWith(200 / 30);
  });

  it('clamps duration width to a 20px minimum', () => {
    const { result } = setup();
    act(() => result.current.durationHandlers.onMouseDown(reactMouseDown(200)));
    act(() => dispatchDoc('mousemove', 30));
    expect(result.current.width).toBe(20);
    act(() => dispatchDoc('mouseup', 30));
  });

  it('clamps transition width to the duration width', () => {
    const onTransitionChange = vi.fn();
    const { result } = setup({ onTransitionChange });
    act(() => result.current.transitionHandlers.onMouseDown(reactMouseDown(100)));
    expect(result.current.isResizingTransition).toBe(true);
    act(() => dispatchDoc('mousemove', 600));
    expect(result.current.transitionWidth).toBe(150);
    act(() => dispatchDoc('mouseup', 600));
    expect(result.current.isResizingTransition).toBe(false);
    expect(onTransitionChange).toHaveBeenCalledWith(5);
  });

  it('clamps transition width to a 5px minimum', () => {
    const { result } = setup();
    act(() => result.current.transitionHandlers.onMouseDown(reactMouseDown(100)));
    act(() => dispatchDoc('mousemove', -300));
    expect(result.current.transitionWidth).toBe(5);
    act(() => dispatchDoc('mouseup', -300));
  });
});
