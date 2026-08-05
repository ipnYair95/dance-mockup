import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode, MouseEventHandler } from 'react';
import type { Dancer } from '../../types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, 'data-dancer': dataDancer, onClick }: {
      children?: ReactNode;
      className?: string;
      'data-dancer'?: boolean;
      onClick?: MouseEventHandler;
    }) => (
      <div data-testid="motion-div" className={className} data-dancer={dataDancer} onClick={onClick}>
        {children}
      </div>
    ),
  },
}));

import { DancerOnStage } from './DancerOnStage';

const dancer: Dancer = { id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'circle' };

const setup = (overrides: Partial<Parameters<typeof DancerOnStage>[0]> = {}) => {
  const props = {
    dancer,
    position: { dancerId: '1', x: 100, y: 200 },
    stageRef: { current: null },
    isInitialLoad: false,
    transitionDuration: 1,
    isSelected: false,
    onDragStart: vi.fn(),
    onDrag: vi.fn(),
    onDragEnd: vi.fn(),
    onClick: vi.fn(),
    ...overrides,
  };
  render(<DancerOnStage {...props} />);
  return props;
};

const shapeSvg = () => screen.getByText('Dancer 1').closest('svg');

describe('DancerOnStage', () => {
  it('renders a motion div with data-dancer and the dancer label', () => {
    setup();
    expect(screen.getByTestId('motion-div')).toHaveAttribute('data-dancer');
    expect(screen.getByText('Dancer 1')).toBeInTheDocument();
  });

  it('renders a circle for the default shape', () => {
    setup();
    expect(shapeSvg()!.querySelector('circle')).toBeInTheDocument();
  });

  it('renders a square shape', () => {
    setup({ dancer: { ...dancer, shape: 'square' } });
    expect(shapeSvg()!.querySelector('rect')).toBeInTheDocument();
  });

  it('renders a triangle shape', () => {
    setup({ dancer: { ...dancer, shape: 'triangle' } });
    expect(shapeSvg()!.querySelector('polygon')).toBeInTheDocument();
  });

  it('shows a selection ring when selected', () => {
    setup({ isSelected: true });
    expect(shapeSvg()!.querySelectorAll('circle')).toHaveLength(2);
  });

  it('does not show a selection ring when not selected', () => {
    setup();
    expect(shapeSvg()!.querySelectorAll('circle')).toHaveLength(1);
  });

  it('calls onClick when clicked', async () => {
    const props = setup();
    await userEvent.click(screen.getByTestId('motion-div'));
    expect(props.onClick).toHaveBeenCalled();
  });
});
