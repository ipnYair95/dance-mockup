import { Diamond, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { useDanceState, DEFAULT_DANCERS, DEFAULT_FORMATIONS, DEFAULT_NOTES } from './hooks/useDanceState';
import { useAudio } from './hooks/useAudio';
import { useAutoSave, saveProjectName, loadProjectName } from './hooks/useAutoSave';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Stage } from './components/Stage/Stage';
import { Timeline } from './components/Timeline/Timeline';
import { ConfirmModal } from './components/ConfirmModal/ConfirmModal';
import { validateProject } from './utils/validateProject';
import { useEffect, useRef, useMemo, useState } from 'react';
import './App.css';

function App() {
  const danceState = useDanceState();
  const audio = useAudio();
  const { formations, currentFormationIndex, setCurrentFormationIndex } = danceState;
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState(() => loadProjectName() || 'Untitled Dance');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [audioClearSignal, setAudioClearSignal] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Memoize data so useAutoSave can do a stable reference comparison
  const projectData = useMemo(() => ({
    dancers: danceState.dancers,
    formations: danceState.formations,
    notes: danceState.notes,
  }), [danceState.dancers, danceState.formations, danceState.notes]);

  const { pickSaveFile, loadFromLocalStorage, clearFileTarget, saveStatus, hasFileSystemAPI } = useAutoSave(projectData);

  // On first load, restore from localStorage if it differs from the defaults
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      const isDefault = JSON.stringify(saved) === JSON.stringify({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS, notes: DEFAULT_NOTES });
      // compat: proyectos viejos sin notes
      const savedNotes = (saved as unknown as { notes?: unknown[] }).notes as never[] | undefined;
      const notesForLoad = savedNotes ?? DEFAULT_NOTES;
      const savedWithNotes = { ...saved, notes: notesForLoad };
      const isDefaultLegacy = JSON.stringify(saved) === JSON.stringify({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS });
      if (!isDefault && !isDefaultLegacy) {
        danceState.loadProject(saved.dancers, saved.formations, savedWithNotes.notes ?? []);
      } else if (!isDefaultLegacy && isDefault) {
        // ya es default completo
      } else if (savedWithNotes.notes.length) {
        danceState.loadProject(saved.dancers, saved.formations, savedWithNotes.notes);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveLabel = saveStatus === 'saving' ? 'Guardando…'
    : saveStatus === 'saved' ? 'Guardado automático'
    : 'Guardado automático';

  const handleExport = async () => {
    const safeName = projectName.trim().replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'dance-project';
    if (hasFileSystemAPI) {
      const chosenName = await pickSaveFile(`${safeName}.json`);
      if (chosenName) {
        const base = chosenName.replace(/\.json$/i, '').trim() || 'Untitled Dance';
        setProjectName(base);
        saveProjectName(base);
      }
      return;
    }
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleNameBlur = () => {
    const name = projectName.trim() || 'Untitled Dance';
    setProjectName(name);
    saveProjectName(name);
    setIsEditingName(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const project = validateProject(data);
        if (project) {
          danceState.loadProject(project.dancers, project.formations, project.notes);
          const importedName = file.name.replace(/\.json$/i, '').trim();
          const name = importedName || 'Untitled Dance';
          setProjectName(name);
          saveProjectName(name);
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
        alert('Invalid project file');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    if (projectInputRef.current) projectInputRef.current.value = '';
  };

  const handleNewProject = () => {
    setIsConfirmOpen(false);
    setProjectName('Untitled Dance');
    danceState.clearProject();
    clearFileTarget();
    audio.clearAudio();
    setAudioClearSignal(s => s + 1);
  };

  // Sync timeline playback to formations
  useEffect(() => {
    if (audio.isPlaying) {
      let timeSum = 0;
      for (let i = 0; i < formations.length; i++) {
        timeSum += formations[i].duration;
        if (audio.currentTime < timeSum) {
          if (currentFormationIndex !== i) {
            setCurrentFormationIndex(i);
          }
          break;
        }
      }
    }
  }, [audio.currentTime, audio.isPlaying, formations, currentFormationIndex, setCurrentFormationIndex]);

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)' }}>
            <Diamond size={13} color="#A78BFA" fill="rgba(124,58,237,0.3)" />
          </span>
          <div className="top-bar-title">DanceForm</div>
          <span className="separator">/</span>
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="project-name-input"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
              className="breadcrumb-pill"
            >
              Entrada <span style={{ color: 'var(--text-muted)' }}>—</span> <strong>{projectName}</strong>
            </button>
          )}
        </div>

        <div className="top-bar-right">
          <button
            className={`autosave-btn ${saveStatus === 'saved' ? 'is-saved' : ''} ${!hasFileSystemAPI ? 'is-static' : ''}`}
            onClick={hasFileSystemAPI ? () => pickSaveFile() : undefined}
            title={hasFileSystemAPI ? 'Click to set a local file target' : 'Auto-saving to browser storage'}
          >
            {saveStatus === 'saving' || isImporting ? (
              <Loader2 size={12} className="spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle2 size={12} />
            ) : (
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent-cyan)', display: 'inline-block' }} />
            )}
            {isImporting ? 'Loading…' : saveLabel}
          </button>

          <button className="icon-btn" onClick={() => projectInputRef.current?.click()} title="Import Project">
            Importar
          </button>
          <input type="file" ref={projectInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />

          <button className="icon-btn" onClick={handleExport} title="Export snapshot">
            Exportar
          </button>

          <button className="icon-btn primary" onClick={() => setIsConfirmOpen(true)} title="Start a new project">
            Nuevo
          </button>

          <div className="help-wrapper" title="Shortcuts">
            <button className="help-btn" aria-label="Shortcuts help">
              <HelpCircle size={18} />
            </button>
            <div className="help-tooltip">
              <div className="help-title">Atajos</div>

              <div className="help-group">Stage</div>
              <div className="help-row"><span>Zoom</span><span>Ctrl/Cmd + rueda  •  Ctrl/Cmd + +/-/0</span></div>
              <div className="help-row"><span>Pan</span><span>Arrastrar área vacía</span></div>
              <div className="help-row"><span>Seleccionar</span><span>Click  •  Shift/Ctrl/Cmd + click (multi)</span></div>
              <div className="help-row"><span>Mover selección</span><span>Arrastrar cualquiera</span></div>
              <div className="help-row"><span>Snap grid</span><span>Automático al soltar</span></div>

              <div className="help-group">Timeline</div>
              <div className="help-row"><span>Zoom</span><span>Shift + rueda  •  Shift + +/-</span></div>
              <div className="help-row"><span>Pan</span><span>Space + arrastrar</span></div>
              <div className="help-row"><span>Seek</span><span>Click en la pista</span></div>
              <div className="help-row"><span>Seleccionar formación</span><span>Click  •  Shift/Ctrl/Cmd + click (multi)</span></div>
              <div className="help-row"><span>Borrar</span><span>Supr / Retroceso</span></div>

              <div className="help-group">General</div>
              <div className="help-row"><span>Deshacer / Rehacer</span><span>Ctrl/Cmd+Z  •  Ctrl+Shift+Z / Ctrl+Y</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-content">
        <Sidebar
          dancers={danceState.dancers}
          onAddDancer={danceState.addDancer}
          onUpdateDancer={danceState.updateDancer}
          onDeleteDancer={danceState.deleteDancer}
        />

        <Stage
          dancers={danceState.dancers}
          activeFormation={danceState.activeFormation}
          onUpdateDancerPosition={danceState.updateDancerPosition}
          onUpdateMultiplePositions={danceState.updateMultipleDancerPositions}
          notes={danceState.notes}
          currentTime={audio.currentTime}
          isPlaying={audio.isPlaying}
          onUpdateNotePosition={danceState.updateNotePosition}
          onUpdateNoteText={(id, text) => danceState.updateNote(id, { text })}
        />
      </main>

      <Timeline
        formations={danceState.formations}
        currentFormationIndex={danceState.currentFormationIndex}
        onAddFormation={danceState.addFormation}
        onSelectFormation={danceState.setCurrentFormationIndex}
        onDurationChange={danceState.updateFormationDuration}
        onTransitionChange={danceState.updateTransitionDuration}
        onDeleteFormation={danceState.deleteFormation}
        notes={danceState.notes}
        onAddNote={(start) => danceState.addNote(start ?? audio.currentTime)}
        onUpdateNoteDuration={danceState.updateNoteDuration}
        onUpdateNoteStartTime={danceState.updateNoteStartTime}
        onUpdateNoteText={(id, text) => danceState.updateNote(id, { text })}
        onDeleteNotes={danceState.deleteNotes}

        isPlaying={audio.isPlaying}
        currentTime={audio.currentTime}
        duration={audio.duration}
        onTogglePlay={audio.togglePlay}
        onSeek={audio.seek}
        onAudioUpload={audio.loadAudio}
        clearSignal={audioClearSignal}
      />

      {isConfirmOpen && (
        <ConfirmModal
          title="Start a new project?"
          message="This will clear the stage, reset the project name, stop the audio and disconnect the auto-save file. This action cannot be undone."
          confirmLabel="Start New"
          onConfirm={handleNewProject}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
