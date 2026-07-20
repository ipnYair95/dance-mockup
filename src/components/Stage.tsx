import { useRef } from 'react';
import type { Dancer, Formation } from '../types';
import { DancerOnStage } from './DancerOnStage';

interface StageProps {
  dancers: Dancer[];
  activeFormation: Formation;
  onUpdateDancerPosition: (dancerId: string, x: number, y: number) => void;
}

export function Stage({ dancers, activeFormation, onUpdateDancerPosition }: StageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <section className="stage-area">
      <div className="stage" ref={stageRef}>
        {activeFormation.positions.map(pos => {
          const dancer = dancers.find(d => d.id === pos.dancerId);
          if (!dancer) return null;

          return (
            <DancerOnStage
              key={dancer.id}
              dancer={dancer}
              position={pos}
              stageRef={stageRef}
              onDragEnd={onUpdateDancerPosition}
              transitionDuration={activeFormation.transitionDuration}
            />
          );
        })}
      </div>
    </section>
  );
}
