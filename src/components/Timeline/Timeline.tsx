import { Plus, Play, Pause, SkipBack, Music, ZoomIn, ZoomOut } from 'lucide-react';
import type { Formation } from '../../types';
import { FormationBlock } from '../FormationBlock/FormationBlock';
import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from './Timeline.module.scss';

interface TimelineProps {
  formations: Formation[];
  currentFormationIndex: number;
  onAddFormation: () => void;
  onSelectFormation: (index: number) => void;
  onDurationChange: (index: number, newDuration: number) => void;
  onTransitionChange: (index: number, newTransition: number) => void;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onAudioUpload: (file: File) => void;
  onDeleteFormation: (indices: number[]) => void;
  clearSignal?: number;
}

export function Timeline({
  formations,
  currentFormationIndex,
  onAddFormation,
  onSelectFormation,
  onDurationChange,
  onTransitionChange,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onAudioUpload,
  onDeleteFormation,
  clearSignal = 0
}: TimelineProps) {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(30);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set([currentFormationIndex]));
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(0);
  const scrollStartRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  // Total time needed for the timeline (either audio duration or sum of formations)
  const totalFormationsDuration = formations.reduce((acc, f) => acc + f.duration, 0);
  const timelineDuration = Math.max(duration || 0, totalFormationsDuration, 60); // min 60s

  useEffect(() => {
    if (waveformRef.current && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#7C3AED',
        progressColor: '#6D28D9',
        height: 40,
        barWidth: 2,
        barRadius: 2,
        cursorWidth: 0,
        interact: false,
        fillParent: true, // Always fill its container, never scroll internally
        autoScroll: false, // Disable any internal auto-scroll behavior
        autoCenter: false,
      });
    }
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for panning
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      // Delete key for formation deletion
      if ((e.code === 'Delete' || e.code === 'Backspace') && e.target === document.body) {
        if (formations.length > 1) {
          onDeleteFormation(Array.from(selectedIndices));
          setSelectedIndices(new Set([Math.max(0, currentFormationIndex - 1)]));
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentFormationIndex, formations.length, onDeleteFormation, selectedIndices]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAudioUpload(file);
      const url = URL.createObjectURL(file);
      if (wavesurfer.current) {
        wavesurfer.current.load(url);
      }
    }
  };

  // Sync wavesurfer width and zoom
  useEffect(() => {
    if (wavesurfer.current) {
      try {
        // wavesurfer might throw if no audio is loaded yet
        wavesurfer.current.zoom(pixelsPerSecond);
      } catch {
        console.warn("WaveSurfer zoom failed, audio might not be loaded yet.");
      }
    }
  }, [pixelsPerSecond]);

  // Clear the loaded audio wave when the app signals a project reset
  useEffect(() => {
    if (clearSignal > 0 && wavesurfer.current) {
      try {
        wavesurfer.current.empty();
      } catch {
        console.warn("WaveSurfer clear failed.");
      }
    }
  }, [clearSignal]);

  const clampZoom = (v: number) => Math.min(150, Math.max(5, v));

  // Shift+Scroll or Shift+=/- to zoom the timeline
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      // Browsers often convert Shift+Vertical Scroll into Horizontal Scroll (deltaX)
      const deltaVal = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      if (deltaVal === 0) return;

      const delta = deltaVal > 0 ? -5 : 5;
      setPixelsPerSecond(p => clampZoom(p + delta));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setPixelsPerSecond(p => clampZoom(p + 5)); }
      if (e.key === '-') { e.preventDefault(); setPixelsPerSecond(p => clampZoom(p - 5)); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isSpacePressed) return; // Ignore click seek if we are panning
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + trackRef.current.scrollLeft;
      const clickedTime = clickX / pixelsPerSecond;
      onSeek(Math.min(clickedTime, timelineDuration));
    }
  };

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = e.clientX;
      scrollStartRef.current = trackRef.current?.scrollLeft || 0;
    }
  };

  const handleTrackMouseMove = (e: React.MouseEvent) => {
    if (isPanning && trackRef.current) {
      const delta = e.clientX - panStartRef.current;
      trackRef.current.scrollLeft = scrollStartRef.current - delta;
    }
  };

  const handleTrackMouseUp = () => {
    setIsPanning(false);
  };

  // Generate Ruler (Segundero) tick marks
  const renderRuler = () => {
    const ticks = [];
    const numTicks = Math.ceil(timelineDuration);
    for (let i = 0; i <= numTicks; i++) {
      ticks.push(
        <div key={i} className={styles.rulerTick} style={{ left: `${i * pixelsPerSecond}px` }}>
          {i}s
        </div>
      );
    }
    return ticks;
  };

  const trackCursorClass = isSpacePressed
    ? (isPanning ? styles.grabbing : styles.grab)
    : '';

  return (
    <footer className={styles.timeline}>
      <div className={styles.timelineControls}>
        <button className={styles.iconBtn} onClick={() => onSeek(0)} title="Jump to start"><SkipBack size={20} /></button>
        <button className={styles.iconBtn} onClick={onTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <span className={styles.timeLabel}>
          {formatTime(currentTime)}
        </span>

        <div className={styles.actionBtns}>
          <button className={styles.addFormationBtn} onClick={onAddFormation}>
            <Plus size={16} /> New Formation
          </button>

          <button className={styles.addAudioBtn} onClick={() => fileInputRef.current?.click()}>
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

        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <button className={styles.iconBtn} onClick={() => setPixelsPerSecond(p => Math.max(10, p - 10))} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <button className={styles.iconBtn} onClick={() => setPixelsPerSecond(p => Math.min(100, p + 10))} title="Zoom In">
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div
        className={`${styles.timelineTrackContainer} ${trackCursorClass}`}
        ref={trackRef}
        onClick={handleTimelineClick}
        onMouseDown={handleTrackMouseDown}
        onMouseMove={handleTrackMouseMove}
        onMouseUp={handleTrackMouseUp}
        onMouseLeave={handleTrackMouseUp}
      >
        <div className={styles.timelineContent} style={{ width: `${timelineDuration * pixelsPerSecond}px` }}>

          {/* Ruler (Segundero) */}
          <div className={styles.ruler}>
            {renderRuler()}
          </div>

          {/* Audio Track */}
          <div className={styles.audioTrack}>
            <div id="waveform" ref={waveformRef} style={{ width: `${(duration || timelineDuration) * pixelsPerSecond}px` }} />
            {!duration && (
              <span className={styles.audioEmpty}>
                No Audio Track
              </span>
            )}
          </div>

          {/* Formations Track */}
          <div className={styles.formationsTrack}>
            {formations.map((form, index) => (
              <FormationBlock
                key={form.id}
                formation={form}
                index={index}
                isActive={selectedIndices.has(index) || index === currentFormationIndex}
                pixelsPerSecond={pixelsPerSecond}
                onSelect={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    const newSet = new Set(selectedIndices);
                    if (newSet.has(index)) newSet.delete(index);
                    else newSet.add(index);
                    setSelectedIndices(newSet);
                  } else {
                    setSelectedIndices(new Set([index]));
                    onSelectFormation(index);
                    const startTime = formations.slice(0, index).reduce((acc, f) => acc + f.duration, 0);
                    onSeek(startTime);
                  }
                }}
                onDurationChange={(newDuration) => onDurationChange(index, newDuration)}
                onTransitionChange={(newTransition) => onTransitionChange(index, newTransition)}
              />
            ))}
          </div>

          {/* Playhead indicator */}
          <div
            className={styles.playhead}
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          />
        </div>
      </div>
    </footer>
  );
}
