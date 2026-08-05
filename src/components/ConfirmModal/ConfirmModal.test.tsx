import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';

const setup = (overrides: Partial<Parameters<typeof ConfirmModal>[0]> = {}) => {
  const props = {
    title: 'Delete?',
    message: 'Are you sure?',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ConfirmModal {...props} />);
  return props;
};

describe('ConfirmModal', () => {
  it('renders the title, message and action labels', () => {
    setup();
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('confirms on Enter and cancels on Escape', async () => {
    const props = setup();
    await userEvent.keyboard('{Enter}');
    expect(props.onConfirm).toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('calls onCancel from the Cancel button and onConfirm from the confirm button', async () => {
    const props = setup();
    await userEvent.click(screen.getByText('Cancel'));
    expect(props.onCancel).toHaveBeenCalled();
    await userEvent.click(screen.getByText('Delete'));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when the overlay is clicked', async () => {
    const props = setup();
    const modal = screen.getByText('Delete?').closest('div');
    const overlay = modal!.parentElement as HTMLElement;
    await userEvent.click(overlay);
    expect(props.onCancel).toHaveBeenCalled();
  });
});
