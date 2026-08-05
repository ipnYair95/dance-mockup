import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudio } from './useAudio';

class AudioMock {
  static instances: AudioMock[] = [];
  currentTime = 0;
  duration = 0;
  src = '';
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  load = vi.fn();
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor() {
    AudioMock.instances.push(this);
  }
}

const handlerOf = (audio: AudioMock, type: string) =>
  audio.addEventListener.mock.calls.find(([eventType]) => eventType === type)?.[1] as () => void;

describe('useAudio', () => {
  beforeEach(() => {
    AudioMock.instances = [];
    vi.stubGlobal('Audio', AudioMock);
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an HTMLAudioElement and registers its events', () => {
    renderHook(() => useAudio());
    expect(AudioMock.instances).toHaveLength(1);
    const audio = AudioMock.instances[0];
    for (const type of ['timeupdate', 'loadedmetadata', 'ended']) {
      expect(audio.addEventListener).toHaveBeenCalledWith(type, expect.any(Function));
    }
  });

  it('togglePlay plays and pauses the audio', () => {
    const { result } = renderHook(() => useAudio());
    const audio = AudioMock.instances[0];
    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(true);
    expect(audio.play).toHaveBeenCalled();
    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(false);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('loadAudio creates an object URL and resets playback state', () => {
    const { result } = renderHook(() => useAudio());
    const audio = AudioMock.instances[0];
    const file = new File(['x'], 'a.mp3');
    act(() => result.current.loadAudio(file));
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(audio.src).toBe('blob:mock');
    expect(audio.load).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
  });

  it('seek updates the audio and the current time', () => {
    const { result } = renderHook(() => useAudio());
    const audio = AudioMock.instances[0];
    act(() => result.current.seek(12.5));
    expect(audio.currentTime).toBe(12.5);
    expect(result.current.currentTime).toBe(12.5);
  });

  it('clearAudio pauses, clears the source and resets state', () => {
    const { result } = renderHook(() => useAudio());
    const audio = AudioMock.instances[0];
    act(() => result.current.togglePlay());
    act(() => result.current.clearAudio());
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe('');
    expect(audio.load).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it('reflects timeupdate, loadedmetadata and ended events', () => {
    const { result } = renderHook(() => useAudio());
    const audio = AudioMock.instances[0];
    audio.currentTime = 42;
    act(() => handlerOf(audio, 'timeupdate')());
    expect(result.current.currentTime).toBe(42);
    audio.duration = 90;
    act(() => handlerOf(audio, 'loadedmetadata')());
    expect(result.current.duration).toBe(90);
    act(() => result.current.togglePlay());
    act(() => handlerOf(audio, 'ended')());
    expect(result.current.isPlaying).toBe(false);
  });
});
