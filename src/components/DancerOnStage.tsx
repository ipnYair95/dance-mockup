import { motion } from 'framer-motion';
import type { Dancer, DancerPosition } from '../types';

interface DancerOnStageProps {
  dancer: Dancer;
  position: DancerPosition;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (dancerId: string, x: number, y: number) => void;
  isInitialLoad?: boolean;
  transitionDuration: number;
}

export function DancerOnStage({ dancer, position, stageRef, onDragEnd, isInitialLoad, transitionDuration }: DancerOnStageProps) {
  const renderDancerShape = (d: Dancer) => {
    switch (d.shape) {
      case 'square':
        return <rect width="30" height="30" fill={d.color} />;
      case 'triangle':
        return <polygon points="15,0 30,30 0,30" fill={d.color} />;
      case 'circle':
      default:
        return <circle cx="15" cy="15" r="15" fill={d.color} />;
    }
  };

  return (
    <motion.div
      className="dancer-on-stage"
      drag
      dragConstraints={stageRef}
      dragElastic={0}
      dragMomentum={false}
      initial={isInitialLoad ? { x: position.x, y: position.y } : false}
      animate={{ x: position.x, y: position.y }}
      onDragEnd={(_, info) => onDragEnd(dancer.id, position.x + info.offset.x, position.y + info.offset.y)}
      style={{
        position: 'absolute',
        width: 30,
        height: 30,
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      whileDrag={{ scale: 1.1, cursor: 'grabbing', zIndex: 10 }}
      transition={{ type: 'tween', duration: transitionDuration, ease: 'easeInOut' }}
    >
      <svg width="30" height="30" style={{ overflow: 'visible' }}>
        {renderDancerShape(dancer)}
        <text x="15" y="-5" fill="white" fontSize="10" textAnchor="middle">
          {dancer.name}
        </text>
      </svg>
    </motion.div>
  );
}
