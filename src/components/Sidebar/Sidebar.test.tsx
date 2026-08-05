import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Dancer } from '../../types';
import { Sidebar } from './Sidebar';

const dancers: Dancer[] = [
  { id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'circle' },
  { id: '2', name: 'Dancer 2', color: '#2196F3', shape: 'square' },
];

const setup = (overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) => {
  const props = {
    dancers,
    onAddDancer: vi.fn(),
    onUpdateDancer: vi.fn(),
    onDeleteDancer: vi.fn(),
    ...overrides,
  };
  render(<Sidebar {...props} />);
  return props;
};

describe('Sidebar', () => {
  it('lists all dancers', () => {
    setup();
    expect(screen.getByText('Dancer 1')).toBeInTheDocument();
    expect(screen.getByText('Dancer 2')).toBeInTheDocument();
  });

  it('calls onAddDancer from the add button', async () => {
    const props = setup();
    await userEvent.click(screen.getByTitle('Add Dancer'));
    expect(props.onAddDancer).toHaveBeenCalled();
  });

  it('opens the edit panel when a dancer is clicked', async () => {
    setup();
    await userEvent.click(screen.getByText('Dancer 1'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('saves edited dancer details', async () => {
    const props = setup();
    await userEvent.click(screen.getByText('Dancer 1'));
    const nameInput = screen.getByRole('textbox');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed');
    await userEvent.click(screen.getByText('Save'));
    expect(props.onUpdateDancer).toHaveBeenCalledWith('1', { name: 'Renamed', color: '#E91E63', shape: 'circle' });
  });

  it('deletes the dancer from the edit panel', async () => {
    const props = setup();
    await userEvent.click(screen.getByText('Dancer 1'));
    await userEvent.click(screen.getByTitle('Delete dancer'));
    expect(props.onDeleteDancer).toHaveBeenCalledWith('1');
  });

  it('cancels the edit without saving', async () => {
    const props = setup();
    await userEvent.click(screen.getByText('Dancer 1'));
    await userEvent.click(screen.getByTitle('Cancel'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(props.onUpdateDancer).not.toHaveBeenCalled();
  });
});
