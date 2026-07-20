import { Plus, Play, Pause, SkipBack, Music } from 'lucide-react';
import type { Formation } from '../types';
import { FormationBlock } from './FormationBlock';
import { useRef } from 'react';

interface TimelineProps {
  formations: Formation[];
  currentFormationIndex: number;
  onAddFormation: () => void;
  onSelectFormation: (index: number) => void;
  onDurationChange: (index: number, newDuration: number) => void;
  
  // Audio props
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onAudioUpload: (file: File) => void;
}

const PIXELS_PER_SECOND = 20; // 20px per second on the timeline

export function Timeline({
  formations,
  currentFormationIndex,
  onAddFormation,
  onSelectFormation,
  onDurationChange,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onAudioUpload
}: TimelineProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAudioUpload(file);
    }
  };
  
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickedTime = clickX / PIXELS_PER_SECOND;
      onSeek(Math.min(clickedTime, duration || 100)); // allow seeking even without audio
    }
  };

  return (
    <footer className="timeline">
      <div className="timeline-controls">
        <button onClick={() => onSeek(0)}><SkipBack size={20} /></button>
        <button onClick={onTogglePlay}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <span style={{ fontSize: '14px', fontFamily: 'monospace', minWidth: '70px' }}>
          {formatTime(currentTime)}
        </span>
        
        <div style={{ marginLeft: '10px', display: 'flex', gap: '10px' }}>
          <button className="add-formation-btn" onClick={onAddFormation}>
            <Plus size={16} /> New Formation
          </button>
          
          <button className="add-formation-btn" onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: 'var(--bg-card)' }}>
            <Music size={16} /> Add Audio
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAudioUpload} 
            accept="audio/*" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
      
      <div className="timeline-track-container" ref={trackRef} onClick={handleTimelineClick}>
        {/* Playhead indicator */}
        <div 
          className="playhead" 
          style={{ 
            position: 'absolute', 
            left: `${currentTime * PIXELS_PER_SECOND}px`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--accent-primary)',
            zIndex: 10,
            pointerEvents: 'none'
          }} 
        />
        
        <div className="timeline-track">
          {formations.map((form, index) => (
            <FormationBlock
              key={form.id}
              formation={form}
              index={index}
              isActive={index === currentFormationIndex}
              pixelsPerSecond={PIXELS_PER_SECOND}
              onSelect={() => {
                onSelectFormation(index);
                // Seek to the start of this formation (sum of previous durations)
                const startTime = formations.slice(0, index).reduce((acc, f) => acc + f.duration, 0);
                onSeek(startTime);
              }}
              onDurationChange={(newDuration) => onDurationChange(index, newDuration)}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
