import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStageZoom } from './useStageZoom';

const container = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const setup = () => {
  const ref = { current: container as unknown as HTMLElement } as React.RefObject<HTMLElement | null>;
  return renderHook(() => useStageZoom(ref));
};

const wheel = (overrides: Partial<WheelEvent>) =>
  ({ ctrlKey: false, metaKey: false, deltaY: 0, deltaX: 0, preventDefault: vi.fn(), ...overrides }) as unknown as WheelEvent;

describe('useStageZoom', () => {
  beforeEach(() => {
    container.addEventListener.mockClear();
    container.removeEventListener.mockClear();
  });

  it('starts at zoom 1', () => {
    const { result } = setup();
    expect(result.current.zoom).toBe(1);
  });

  it('zoomIn and zoomOut clamp between 0.25 and 3', () => {
    const { result } = setup();
    for (let i = 0; i < 30; i++) act(() => result.current.zoomIn());
    expect(result.current.zoom).toBe(3);
    for (let i = 0; i < 40; i++) act(() => result.current.zoomOut());
    expect(result.current.zoom).toBe(0.25);
  });

  it('resetZoom restores zoom to 1', () => {
    const { result } = setup();
    act(() => result.current.zoomIn());
    act(() => result.current.resetZoom());
    expect(result.current.zoom).toBe(1);
  });

  it('zooms with ctrl/cmd + wheel and ignores plain wheel', () => {
    const { result } = setup();
    const wheelHandler = container.addEventListener.mock.calls[0][1] as (e: WheelEvent) => void;
    act(() => wheelHandler(wheel({ ctrlKey: true, deltaY: -100 })));
    expect(result.current.zoom).toBe(1.1);
    act(() => wheelHandler(wheel({ ctrlKey: true, deltaY: 100 })));
    expect(result.current.zoom).toBe(1);
    act(() => wheelHandler(wheel({ deltaY: -100 })));
    expect(result.current.zoom).toBe(1);
  });

  it('supports ctrl/cmd + =, - and 0 shortcuts', () => {
    const { result } = setup();
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '=', ctrlKey: true })));
    expect(result.current.zoom).toBe(1.1);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', ctrlKey: true })));
    expect(result.current.zoom).toBe(1);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '+', metaKey: true })));
    expect(result.current.zoom).toBe(1.1);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', ctrlKey: true })));
    expect(result.current.zoom).toBe(1);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '=' })));
    expect(result.current.zoom).toBe(1);
  });
});
