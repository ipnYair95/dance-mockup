import { useRef, useEffect, useCallback, useState } from 'react';
import type { Dancer, Formation } from '../types';

interface ProjectData {
  dancers: Dancer[];
  formations: Formation[];
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

const LS_KEY = 'danceform_autosave';
const hasFileSystemAPI = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

/**
 * Universal auto-save hook.
 * - If File System Access API is available: writes to a user-picked local file.
 * - Otherwise: saves to localStorage automatically (no setup needed).
 */
export function useAutoSave(data: ProjectData) {
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle');
  const [mode, setMode] = useState<'file' | 'local'>('local');
  const [hasFileTarget, setHasFileTarget] = useState(false);

  const writeToFile = useCallback(async (handle: FileSystemFileHandle, projectData: ProjectData) => {
    try {
      setSaveStatus('saving');
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(projectData, null, 2));
      await writable.close();
      setSaveStatus('saved');
    } catch (e) {
      console.error('File auto-save failed:', e);
    }
  }, []);

  // ---- localStorage auto-save (always runs as fallback) ----
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // 1. Write to file if we have a handle
      if (fileHandleRef.current) {
        writeToFile(fileHandleRef.current, data);
      } else {
        // 2. Fallback to localStorage
        try {
          setSaveStatus('saving');
          localStorage.setItem(LS_KEY, JSON.stringify(data));
          setSaveStatus('saved');
        } catch (e) {
          console.error('localStorage save failed:', e);
          setSaveStatus('idle');
        }
      }
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, writeToFile]);

  /** Ask the user to pick/create a target file (only when API is available). */
  const pickSaveFile = useCallback(async (suggestedName = 'dance-project.json') => {
    if (!hasFileSystemAPI) return;
    const picker = window.showSaveFilePicker;
    if (!picker) return;
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: 'DanceForm Project', accept: { 'application/json': ['.json'] } }],
      });
      fileHandleRef.current = handle;
      setMode('file');
      setHasFileTarget(true);
      await writeToFile(handle, data);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        if (fileHandleRef.current) {
          await writeToFile(fileHandleRef.current, data);
        } else {
          console.error(e);
        }
      }
    }
  }, [data, writeToFile]);

  /** Load the last auto-saved project from localStorage. */
  const loadFromLocalStorage = useCallback((): ProjectData | null => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  /** Clear the file target and localStorage entry (e.g. after "New project"). */
  const clearFileTarget = useCallback(() => {
    fileHandleRef.current = null;
    setMode('local');
    setHasFileTarget(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    localStorage.removeItem(LS_KEY);
  }, []);

  return {
    pickSaveFile,
    loadFromLocalStorage,
    clearFileTarget,
    saveStatus,
    mode,
    hasFileTarget,
    hasFileSystemAPI,
  };
}
