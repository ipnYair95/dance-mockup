import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import type { Formation } from '../types';

const showSaveFilePickerMock = vi.hoisted(() => {
  const mock = vi.fn();
  window.showSaveFilePicker = mock;
  return mock;
});

import { useAutoSave } from './useAutoSave';

type LSMock = {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  clear: Mock;
  key: Mock;
  length: number;
};

const createLS = (): LSMock => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store.set(k, String(v));
    }),
    removeItem: vi.fn((k: string) => {
      store.delete(k);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn(() => null),
    length: 0,
  } as unknown as LSMock;
};

let ls: LSMock;

const data = (n: number) => ({
  dancers: [],
  formations: [
    {
      id: `f${n}`,
      name: `Formation ${n}`,
      duration: 5,
      transitionDuration: 1,
      positions: [],
    } as Formation,
  ],
  notes: [],
});

const fileHandle = {
  name: 'project.json',
  createWritable: vi.fn(async () => ({
    write: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  })),
};

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ls = createLS();
    Object.defineProperty(window, 'localStorage', { value: ls, configurable: true });
    showSaveFilePickerMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces writes to localStorage by 800ms and reports saved', () => {
    const { result } = renderHook(() => useAutoSave(data(0)));
    act(() => vi.advanceTimersByTime(799));
    expect(ls.setItem).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(ls.setItem).toHaveBeenCalledWith('danceform_autosave', JSON.stringify(data(0)));
    expect(result.current.saveStatus).toBe('saved');
  });

  it('resets the debounce on new data and writes the latest payload', () => {
    const { rerender } = renderHook(({ d }) => useAutoSave(d), { initialProps: { d: data(1) } });
    act(() => vi.advanceTimersByTime(800));
    act(() => rerender({ d: data(2) }));
    act(() => vi.advanceTimersByTime(799));
    expect(ls.setItem).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1));
    expect(ls.setItem).toHaveBeenLastCalledWith('danceform_autosave', JSON.stringify(data(2)));
  });

  it('loadFromLocalStorage reads the autosaved project', () => {
    ls.setItem('danceform_autosave', JSON.stringify(data(9)));
    const { result } = renderHook(() => useAutoSave(data(0)));
    expect(result.current.loadFromLocalStorage()).toEqual(data(9));
  });

  it('clearFileTarget removes the storage keys and resets the mode', () => {
    ls.setItem('danceform_autosave', JSON.stringify(data(9)));
    ls.setItem('danceform_project_name', 'My Project');
    const { result } = renderHook(() => useAutoSave(data(0)));
    act(() => result.current.clearFileTarget());
    expect(ls.removeItem).toHaveBeenCalledWith('danceform_autosave');
    expect(ls.removeItem).toHaveBeenCalledWith('danceform_project_name');
    expect(result.current.mode).toBe('local');
    expect(result.current.hasFileTarget).toBe(false);
  });

  it('pickSaveFile writes to the picked file and switches to file mode', async () => {
    showSaveFilePickerMock.mockResolvedValue(fileHandle);
    const { result } = renderHook(() => useAutoSave(data(0)));
    let name: string | null = null;
    await act(async () => {
      name = await result.current.pickSaveFile();
    });
    expect(name).toBe('project.json');
    expect(result.current.mode).toBe('file');
    expect(result.current.hasFileTarget).toBe(true);
    expect(fileHandle.createWritable).toHaveBeenCalled();
  });

  it('pickSaveFile returns null when the user aborts the picker', async () => {
    showSaveFilePickerMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    const { result } = renderHook(() => useAutoSave(data(0)));
    let name: string | null = 'not-null';
    await act(async () => {
      name = await result.current.pickSaveFile();
    });
    expect(name).toBeNull();
  });

  it('pickSaveFile returns null when the File System Access API is unavailable', async () => {
    delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    vi.resetModules();
    const mod = await import('./useAutoSave');
    const { result } = renderHook(() => mod.useAutoSave(data(0)));
    let name: string | null = 'not-null';
    await act(async () => {
      name = await result.current.pickSaveFile();
    });
    expect(name).toBeNull();
    expect(result.current.hasFileSystemAPI).toBe(false);
  });
});
