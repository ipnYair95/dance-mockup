import { useState, useEffect } from 'react';
import type { Dancer, Formation, Shape } from '../types';
import { useUndoHistory } from './useUndoHistory';

export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 500;

export const DEFAULT_DANCERS: Dancer[] = [
  { id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'circle' },
  { id: '2', name: 'Dancer 2', color: '#2196F3', shape: 'square' },
  { id: '3', name: 'Dancer 3', color: '#4CAF50', shape: 'triangle' },
];

export const DEFAULT_FORMATIONS: Formation[] = [
  {
    id: 'form-1',
    name: 'Formation 1',
    duration: 5,
    transitionDuration: 1,
    positions: [
      { dancerId: '1', x: STAGE_WIDTH / 2 - 50, y: STAGE_HEIGHT / 2 },
      { dancerId: '2', x: STAGE_WIDTH / 2,       y: STAGE_HEIGHT / 2 },
      { dancerId: '3', x: STAGE_WIDTH / 2 + 50,  y: STAGE_HEIGHT / 2 },
    ]
  }
];

export const useDanceState = () => {
  const [dancers, setDancers] = useState<Dancer[]>(DEFAULT_DANCERS);
  const [formations, setFormations] = useState<Formation[]>(DEFAULT_FORMATIONS);
  const [currentFormationIndex, setCurrentFormationIndex] = useState(0);
  const activeFormation = formations[currentFormationIndex];

  const history = useUndoHistory();

  // Push initial snapshot once
  useEffect(() => {
    history.push({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: apply snapshot after undo/redo
  const applySnapshot = (snap: { dancers: Dancer[]; formations: Formation[] } | null) => {
    if (!snap) return;
    setDancers(snap.dancers);
    setFormations(snap.formations);
    setCurrentFormationIndex(i => Math.min(i, snap.formations.length - 1));
  };

  // Register undo/redo keyboard shortcut globally
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        applySnapshot(history.undo());
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        applySnapshot(history.redo());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: mutate both, then push to history
  const commit = (newDancers: Dancer[], newFormations: Formation[]) => {
    setDancers(newDancers);
    setFormations(newFormations);
    history.push({ dancers: newDancers, formations: newFormations });
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const addDancer = () => {
    const newId = Date.now().toString();
    const newDancer: Dancer = { id: newId, name: `Dancer ${dancers.length + 1}`, color: '#FFC107', shape: 'circle' };
    const newDancers = [...dancers, newDancer];
    const newFormations = formations.map(form => ({
      ...form,
      positions: [...form.positions, { dancerId: newId, x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 }]
    }));
    commit(newDancers, newFormations);
  };

  const updateDancer = (id: string, updates: Partial<{ name: string; color: string; shape: Shape }>) => {
    const newDancers = dancers.map(d => d.id === id ? { ...d, ...updates } : d);
    commit(newDancers, formations);
  };

  const deleteDancer = (id: string) => {
    const newDancers = dancers.filter(d => d.id !== id);
    const newFormations = formations.map(form => ({
      ...form,
      positions: form.positions.filter(p => p.dancerId !== id)
    }));
    commit(newDancers, newFormations);
  };

  const addFormation = () => {
    const newId = `form-${Date.now()}`;
    const newFormation: Formation = {
      id: newId,
      name: `Formation ${formations.length + 1}`,
      duration: 5,
      transitionDuration: 1,
      positions: [...activeFormation.positions]
    };
    const newFormations = [...formations, newFormation];
    commit(dancers, newFormations);
    setCurrentFormationIndex(formations.length);
  };

  const deleteFormation = (indices: number[]) => {
    if (formations.length - indices.length < 1) return;
    const newFormations = formations.filter((_, i) => !indices.includes(i));
    commit(dancers, newFormations);
    setCurrentFormationIndex(prev => Math.min(prev, newFormations.length - 1));
  };

  const updateDancerPosition = (dancerId: string, x: number, y: number) => {
    const newPositions = activeFormation.positions.map(p =>
      p.dancerId === dancerId ? { ...p, x, y } : p
    );
    const newFormations = formations.map((f, i) =>
      i === currentFormationIndex ? { ...f, positions: newPositions } : f
    );
    commit(dancers, newFormations);
  };

  // Multi-dancer position update (for multi-select drag)
  const updateMultipleDancerPositions = (newPositions: { dancerId: string; x: number; y: number }[]) => {
    const posMap = new Map(newPositions.map(p => [p.dancerId, { x: p.x, y: p.y }]));
    const updatedPositions = activeFormation.positions.map(p =>
      posMap.has(p.dancerId) ? { ...p, ...posMap.get(p.dancerId) } : p
    );
    const newFormations = formations.map((f, i) =>
      i === currentFormationIndex ? { ...f, positions: updatedPositions } : f
    );
    commit(dancers, newFormations);
  };

  const updateFormationDuration = (index: number, newDuration: number) => {
    const newFormations = formations.map((f, i) =>
      i === index ? {
        ...f,
        duration: Math.max(1, newDuration),
        transitionDuration: Math.min(f.transitionDuration, Math.max(1, newDuration))
      } : f
    );
    commit(dancers, newFormations);
  };

  const updateTransitionDuration = (index: number, newTransition: number) => {
    const newFormations = formations.map((f, i) =>
      i === index ? {
        ...f,
        transitionDuration: Math.min(f.duration, Math.max(0.1, newTransition))
      } : f
    );
    commit(dancers, newFormations);
  };

  const loadProject = (newDancers: Dancer[], newFormations: Formation[]) => {
    commit(newDancers, newFormations);
    setCurrentFormationIndex(0);
  };

  const clearProject = () => {
    setDancers(DEFAULT_DANCERS);
    setFormations(DEFAULT_FORMATIONS);
    setCurrentFormationIndex(0);
    history.reset({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS });
  };

  return {
    dancers,
    formations,
    currentFormationIndex,
    activeFormation,
    addDancer,
    updateDancer,
    deleteDancer,
    addFormation,
    deleteFormation,
    setCurrentFormationIndex,
    updateDancerPosition,
    updateMultipleDancerPositions,
    updateFormationDuration,
    updateTransitionDuration,
    loadProject,
    clearProject,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
};
