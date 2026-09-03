import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Formation } from '../../types';

const mocks = vi.hoisted(() => {
  const timeline = {
    pixelsPerSecond: 30,
    selectedIndices: new Set<number>([0]),
    isSpacePressed: false,
    isPanning: false,
    trackRef: { current: null },
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    handleTimelineClick: vi.fn(),
    handleTrackMouseDown: vi.fn(),
    handleTrackMouseMove: vi.fn(),
    handleTrackMouseUp: vi.fn(),
    selectFormation: vi.fn(),
    formatTime: vi.fn((t: number) => `t:${t.toFixed(1)}`),
  };
  return {
    useTimeline: vi.fn(() => timeline),
    timeline,
  };
});

vi.mock('../../hooks/useTimeline', () => ({ useTimeline: mocks.useTimeline }));
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({ zoom: vi.fn(), destroy: vi.fn(), empty: vi.fn(), load: vi.fn() })),
  },
}));
vi.mock('../FormationBlock/FormationBlock', () => ({
  FormationBlock: ({ formation, index, onSelect }: {
    formation: { name: string };
    index: number;
    onSelect: (e: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => void;
  }) => (
    <div data-testid="formation-block">
      <span>{formation.name}</span>
      <button onClick={() => onSelect({})}>select</button>
      <span>{index}</span>
    </div>
  ),
}));
vi.mock('../NoteBlock/NoteBlock', () => ({
  NoteBlock: ({ note }: { note: { text: string } }) => <div data-testid="note-block">{note.text}</div>,
}));

import { Timeline } from './Timeline';

const formations: Formation[] = [
  { id: 'f1', name: 'Formation 1', duration: 5, transitionDuration: 1, positions: [] },
];

const setup = (overrides: Partial<Parameters<typeof Timeline>[0]> = {}) => {
  const props = {
    formations,
    currentFormationIndex: 0,
    onAddFormation: vi.fn(),
    onSelectFormation: vi.fn(),
    onDurationChange: vi.fn(),
    onTransitionChange: vi.fn(),
    notes: [],
    onAddNote: vi.fn(),
    onUpdateNoteDuration: vi.fn(),
    onUpdateNoteStartTime: vi.fn(),
    onUpdateNoteText: vi.fn(),
    onDeleteNotes: vi.fn(),
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
    onAudioUpload: vi.fn(),
    onDeleteFormation: vi.fn(),
    ...overrides,
  };
  const utils = render(<Timeline {...props} />);
  return { props, ...utils };
};

describe('Timeline', () => {
  beforeEach(() => {
    mocks.timeline.selectFormation.mockClear();
    mocks.timeline.zoomIn.mockClear();
    mocks.timeline.zoomOut.mockClear();
  });

  it('renders the transport controls and the formatted time label', () => {
    setup();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByText('t:0.0')).toBeInTheDocument();
    expect(screen.getByText('No Audio Track')).toBeInTheDocument();
  });

  it('renders one formation block per formation', () => {
    setup();
    expect(screen.getAllByTestId('formation-block')).toHaveLength(1);
    expect(screen.getByText('Formation 1')).toBeInTheDocument();
  });

  it('calls onTogglePlay from the play button', async () => {
    const { props } = setup();
    await userEvent.click(screen.getByTitle('Play'));
    expect(props.onTogglePlay).toHaveBeenCalled();
  });

  it('calls onAddFormation from the New Formation button', async () => {
    const { props } = setup();
    await userEvent.click(screen.getByRole('button', { name: /new formation/i }));
    expect(props.onAddFormation).toHaveBeenCalled();
  });

  it('calls zoomIn and zoomOut from the zoom controls', async () => {
    setup();
    await userEvent.click(screen.getByTitle('Zoom In'));
    expect(mocks.timeline.zoomIn).toHaveBeenCalled();
    await userEvent.click(screen.getByTitle('Zoom Out'));
    expect(mocks.timeline.zoomOut).toHaveBeenCalled();
  });

  it('selecting a formation delegates to selectFormation, onSelectFormation and onSeek', async () => {
    const { props } = setup();
    await userEvent.click(screen.getByText('select'));
    expect(mocks.timeline.selectFormation).toHaveBeenCalledWith(0, {});
    expect(props.onSelectFormation).toHaveBeenCalledWith(0);
    expect(props.onSeek).toHaveBeenCalledWith(0);
  });

  it('uploads audio through the hidden input', () => {
    const { props } = setup();
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(props.onAudioUpload).toHaveBeenCalledWith(file);
  });
});
