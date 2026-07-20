import { useState } from 'react';
import type { Dancer, Formation } from '../types';

export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 500;

export const useDanceState = () => {
  const [dancers, setDancers] = useState<Dancer[]>([
    { id: '1', name: 'Dancer 1', color: '#E91E63', shape: 'circle' },
    { id: '2', name: 'Dancer 2', color: '#2196F3', shape: 'square' },
    { id: '3', name: 'Dancer 3', color: '#4CAF50', shape: 'triangle' },
  ]);

  const [formations, setFormations] = useState<Formation[]>([
    {
      id: 'form-1',
      name: 'Formation 1',
      duration: 5, // 5 seconds duration
      positions: [
        { dancerId: '1', x: STAGE_WIDTH / 2 - 50, y: STAGE_HEIGHT / 2 },
        { dancerId: '2', x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 },
        { dancerId: '3', x: STAGE_WIDTH / 2 + 50, y: STAGE_HEIGHT / 2 },
      ]
    }
  ]);
  
  const [currentFormationIndex, setCurrentFormationIndex] = useState(0);
  const activeFormation = formations[currentFormationIndex];

  const addDancer = () => {
    const newId = (dancers.length + 1).toString();
    setDancers(prev => [
      ...prev,
      { id: newId, name: `Dancer ${newId}`, color: '#FFC107', shape: 'circle' }
    ]);
    
    setFormations(prev => prev.map(form => ({
      ...form,
      positions: [
        ...form.positions,
        { dancerId: newId, x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 }
      ]
    })));
  };

  const addFormation = () => {
    const newId = `form-${formations.length + 1}`;
    const newFormation: Formation = {
      id: newId,
      name: `Formation ${formations.length + 1}`,
      duration: 5,
      positions: [...activeFormation.positions]
    };
    
    setFormations(prev => [...prev, newFormation]);
    setCurrentFormationIndex(formations.length);
  };

  const updateDancerPosition = (dancerId: string, x: number, y: number) => {
    setFormations(prev => {
      const updatedFormations = [...prev];
      const newPositions = activeFormation.positions.map(p => {
        if (p.dancerId === dancerId) {
          return { ...p, x, y };
        }
        return p;
      });

      updatedFormations[currentFormationIndex] = {
        ...activeFormation,
        positions: newPositions
      };

      return updatedFormations;
    });
  };

  const updateFormationDuration = (index: number, newDuration: number) => {
    setFormations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], duration: Math.max(1, newDuration) };
      return updated;
    });
  };

  return {
    dancers,
    formations,
    currentFormationIndex,
    activeFormation,
    addDancer,
    addFormation,
    setCurrentFormationIndex,
    updateDancerPosition,
    updateFormationDuration
  };
};
