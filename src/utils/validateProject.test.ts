import { describe, it, expect } from 'vitest';
import { validateProject } from './validateProject';
import type { Dancer, Formation } from '../types';

const validDancers: Dancer[] = [
  { id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'circle' },
  { id: '2', name: 'Dancer 2', color: '#2196F3', shape: 'square' },
];

const validFormations: Formation[] = [
  {
    id: 'form-1',
    name: 'Formation 1',
    duration: 5,
    transitionDuration: 1,
    positions: [
      { dancerId: '1', x: 400, y: 250 },
      { dancerId: '2', x: 450, y: 250 },
    ],
  },
];

describe('validateProject', () => {
  it('returns the typed project for a valid payload', () => {
    const data = { dancers: validDancers, formations: validFormations };
    expect(validateProject(data)).toEqual(data);
  });

  it('returns null for non-object input', () => {
    expect(validateProject(null)).toBeNull();
    expect(validateProject(undefined)).toBeNull();
    expect(validateProject('data')).toBeNull();
    expect(validateProject([])).toBeNull();
  });

  it('returns null when dancers is not an array', () => {
    expect(validateProject({ dancers: 'nope', formations: validFormations })).toBeNull();
  });

  it('returns null when a dancer is malformed', () => {
    const dancers = [{ id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'hexagon' }];
    expect(validateProject({ dancers, formations: validFormations })).toBeNull();
    expect(validateProject({ dancers: [{ id: '1' }], formations: validFormations })).toBeNull();
  });

  it('returns null when formations is not an array', () => {
    expect(validateProject({ dancers: validDancers, formations: {} })).toBeNull();
  });

  it('returns null when a formation is malformed', () => {
    const formations = [{ id: 'form-1', name: 'Formation 1', duration: 5, transitionDuration: 1, positions: 'none' }];
    expect(validateProject({ dancers: validDancers, formations })).toBeNull();
  });

  it('returns null when a position is malformed', () => {
    const formations = [
      { id: 'form-1', name: 'Formation 1', duration: 5, transitionDuration: 1, positions: [{ dancerId: '1' }] },
    ];
    expect(validateProject({ dancers: validDancers, formations })).toBeNull();
  });
});
