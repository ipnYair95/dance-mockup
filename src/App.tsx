import { Settings } from 'lucide-react';
import { useDanceState } from './hooks/useDanceState';
import { useAudio } from './hooks/useAudio';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { Timeline } from './components/Timeline';
import { useEffect } from 'react';
import './App.css';

function App() {
  const danceState = useDanceState();
  const audio = useAudio();

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
        <div>
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
