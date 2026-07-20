import { Settings, Download, Upload } from 'lucide-react';
import { useDanceState } from './hooks/useDanceState';
import { useAudio } from './hooks/useAudio';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { Timeline } from './components/Timeline';
import { useEffect, useRef } from 'react';
import './App.css';

function App() {
  const danceState = useDanceState();
  const audio = useAudio();
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      dancers: danceState.dancers,
      formations: danceState.formations,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dance-project.json';
    a.click();
    URL.revokeObjectURL(url);
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
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
    if (projectInputRef.current) {
      projectInputRef.current.value = '';
    }
  };

  // Sync timeline blocks to audio playback
  useEffect(() => {
    if (audio.isPlaying) {
      let timeSum = 0;
      for (let i = 0; i < danceState.formations.length; i++) {
        timeSum += danceState.formations[i].duration;
        if (audio.currentTime < timeSum) {
          if (danceState.currentFormationIndex !== i) {
            danceState.setCurrentFormationIndex(i);
          }
          break;
        }
      }
    }
  }, [audio.currentTime, audio.isPlaying, danceState.formations, danceState.currentFormationIndex, danceState.setCurrentFormationIndex]);

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
            DanceForm
          </div>
        </div>
        <div>
          Untitled Dance
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => projectInputRef.current?.click()} title="Import Project">
            <Upload size={18} /> Import
          </button>
          <input type="file" ref={projectInputRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />
          
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={handleExport} title="Export Project">
            <Download size={18} /> Export
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
        />

        <Stage 
          dancers={danceState.dancers}
          activeFormation={danceState.activeFormation}
          onUpdateDancerPosition={danceState.updateDancerPosition}
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
      />
    </div>
  );
}

export default App;
