import { Settings, Download, Upload, HardDrive, Plus } from 'lucide-react';
import { useDanceState, DEFAULT_DANCERS, DEFAULT_FORMATIONS } from './hooks/useDanceState';
import { useAudio } from './hooks/useAudio';
import { useAutoSave, saveProjectName, loadProjectName } from './hooks/useAutoSave';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { Timeline } from './components/Timeline';
import { ConfirmModal } from './components/ConfirmModal';
import { useEffect, useRef, useMemo, useState } from 'react';
import './App.css';

const SAVE_STATUS_LABELS: Record<string, string> = {
  'idle': '',
  'saving': 'Saving…',
  'saved': 'Saved',
  'no-file': '',
  'unsupported': 'Not supported',
};

const SAVE_STATUS_COLORS: Record<string, string> = {
  'saving': 'var(--text-muted)',
  'saved': '#4CAF50',
  'unsupported': '#f44336',
};

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

  const saveColor = saveStatus === 'saved'
    ? '#4CAF50'
    : 'var(--text-secondary)';

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
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.dancers && data.formations) {
          danceState.loadProject(data.dancers, data.formations);
          const importedName = file.name.replace(/\.json$/i, '').trim();
          const name = importedName || 'Untitled Dance';
          setProjectName(name);
          saveProjectName(name);
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
        alert('Invalid project file');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
            DanceForm
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              autoFocus
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                background: 'var(--bg-hover)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '5px',
                padding: '3px 8px',
                minWidth: '160px',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                cursor: 'text',
                padding: '3px 6px',
                borderRadius: '5px',
                border: '1px solid transparent',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--border-color)';
                (e.target as HTMLElement).style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'transparent';
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              {projectName}
            </span>
          )}
          {SAVE_STATUS_LABELS[saveStatus] && (
            <span style={{
              fontSize: '11px',
              color: SAVE_STATUS_COLORS[saveStatus] || 'var(--text-muted)',
              transition: 'color 0.3s'
            }}>
              · {SAVE_STATUS_LABELS[saveStatus]}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Auto-Save button — always visible */}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: saveColor,
              border: `1px solid ${saveStatus === 'saved' ? 'rgba(76,175,80,0.4)' : 'var(--border-color)'}`,
              borderRadius: '6px', padding: '5px 10px', fontSize: '13px',
              backgroundColor: saveStatus === 'saved' ? 'rgba(76,175,80,0.1)' : 'transparent',
              transition: 'all 0.3s',
              cursor: hasFileSystemAPI ? 'pointer' : 'default',
            }}
            onClick={hasFileSystemAPI ? () => pickSaveFile() : undefined}
            title={hasFileSystemAPI ? 'Click to set a local file target' : 'Auto-saving to browser storage'}
          >
            <HardDrive size={16} />
            {saveLabel}
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => projectInputRef.current?.click()} title="Import Project">
            <Upload size={18} /> Import
          </button>
          <input type="file" ref={projectInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />

          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={handleExport} title="Export snapshot">
            <Download size={18} /> Export
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setIsConfirmOpen(true)} title="Start a new project">
            <Plus size={18} /> New
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Settings size={18} /> Settings
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
