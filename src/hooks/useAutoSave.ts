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
const NAME_KEY = 'danceform_project_name';
const SAVE_DEBOUNCE_MS = 800;
const SAVE_INTERVAL_MS = 5000;
const hasFileSystemAPI = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

/** Persist the project name so it survives a reload. */
export function saveProjectName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch (e) {
    console.error('Failed to save project name:', e);
  }
}

/** Load the persisted project name. */
export function loadProjectName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Universal auto-save hook.
 * - Always mirrors the project to localStorage so a reload restores the latest state.
 * - If File System Access API is available: also writes to a user-picked local file.
 * - Writes debounced (800ms) plus a periodic fallback (5s) to cover quick reloads.
 */
export function useAutoSave(data: ProjectData) {
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
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

  /** Write the latest project to localStorage (always) and to the file (if linked). */
  const flush = useCallback(async () => {
    try {
      setSaveStatus('saving');
      if (fileHandleRef.current) {
        await writeToFile(fileHandleRef.current, data);
      }
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setSaveStatus('saved');
      dirtyRef.current = false;
    } catch (e) {
      console.error('Autosave failed:', e);
      setSaveStatus('idle');
    }
  }, [data, writeToFile]);

  // ---- Debounced auto-save whenever the project data changes ----
  useEffect(() => {
    dirtyRef.current = true;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      flush();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, flush]);

  // ---- Periodic fallback: flush pending changes every N seconds ----
  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current) flush();
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [flush]);

  /** Ask the user to pick/create a target file (only when API is available). */
  const pickSaveFile = useCallback(async (suggestedName = 'dance-project.json'): Promise<string | null> => {
    if (!hasFileSystemAPI) return null;
    const picker = window.showSaveFilePicker;
    if (!picker) return null;
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: 'DanceForm Project', accept: { 'application/json': ['.json'] } }],
      });
      fileHandleRef.current = handle;
      setMode('file');
      setHasFileTarget(true);
      await writeToFile(handle, data);
      return handle.name;
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        if (fileHandleRef.current) {
          await writeToFile(fileHandleRef.current, data);
          return fileHandleRef.current.name;
        } else {
          console.error(e);
        }
      }
      return null;
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

  /** Clear the file target and localStorage entries (e.g. after "New project"). */
  const clearFileTarget = useCallback(() => {
    fileHandleRef.current = null;
    setMode('local');
    setHasFileTarget(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dirtyRef.current = false;
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(NAME_KEY);
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
