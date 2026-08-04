import { Footprints, Download, Upload, HardDrive, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { useDanceState, DEFAULT_DANCERS, DEFAULT_FORMATIONS } from './hooks/useDanceState';
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
  }), [danceState.dancers, danceState.formations]);

  const { pickSaveFile, loadFromLocalStorage, clearFileTarget, saveStatus, mode, hasFileSystemAPI } = useAutoSave(projectData);

  // On first load, restore from localStorage if it differs from the defaults
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      const isDefault = JSON.stringify(saved) === JSON.stringify({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS });
      if (!isDefault) {
        danceState.loadProject(saved.dancers, saved.formations);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveLabel = saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved' ? (mode === 'file' ? 'File Sync' : 'Auto-Saved')
    : (mode === 'file' ? 'File Sync' : 'Auto-Save');

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
          danceState.loadProject(project.dancers, project.formations);
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
          <Footprints size={22} color="var(--accent-primary)" />
          <div className="top-bar-title">
            DanceForm
          </div>
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
            <span
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
              className="project-name-span"
            >
              {projectName}
            </span>
          )}
        </div>

        <div className="top-bar-right">
          {/* Auto-Save button — always visible */}
          <button
            className={`autosave-btn ${saveStatus === 'saved' ? 'is-saved' : ''} ${!hasFileSystemAPI ? 'is-static' : ''}`}
            onClick={hasFileSystemAPI ? () => pickSaveFile() : undefined}
            title={hasFileSystemAPI ? 'Click to set a local file target' : 'Auto-saving to browser storage'}
          >
            {saveStatus === 'saving' || isImporting ? (
              <Loader2 size={16} className="spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle2 size={16} />
            ) : (
              <HardDrive size={16} />
            )}
            {isImporting ? 'Loading…' : saveLabel}
          </button>

          <button className="icon-btn" onClick={() => projectInputRef.current?.click()} title="Import Project">
            <Upload size={18} /> Import
          </button>
          <input type="file" ref={projectInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />

          <button className="icon-btn" onClick={handleExport} title="Export snapshot">
            <Download size={18} /> Export
          </button>

          <button className="icon-btn" onClick={() => setIsConfirmOpen(true)} title="Start a new project">
            <Plus size={18} /> New
          </button>
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
