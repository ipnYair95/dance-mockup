import { motion } from 'framer-motion';
import type { Dancer, DancerPosition } from '../types';

interface DancerOnStageProps {
  dancer: Dancer;
  position: DancerPosition;
  stageRef: React.RefObject<HTMLDivElement | null>;
  isInitialLoad?: boolean;
  transitionDuration: number;
  isSelected: boolean;
  onDragStart: () => void;
  onDrag: (offsetX: number, offsetY: number) => void;
  onDragEnd: (offsetX: number, offsetY: number) => void;
  onClick: (e: React.MouseEvent) => void;
}

export function DancerOnStage({
  dancer,
  position,
  stageRef,
  isInitialLoad,
  transitionDuration,
  isSelected,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
}: DancerOnStageProps) {
  const renderShape = (d: Dancer) => {
    switch (d.shape) {
      case 'square':   return <rect width="30" height="30" fill={d.color} rx="2" />;
      case 'triangle': return <polygon points="15,0 30,30 0,30" fill={d.color} />;
      default:         return <circle cx="15" cy="15" r="15" fill={d.color} />;
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
      onDragStart={() => onDragStart()}
      onDrag={(_, info) => onDrag(info.offset.x, info.offset.y)}
      onDragEnd={(_, info) => onDragEnd(info.offset.x, info.offset.y)}
      onClick={onClick}
      style={{
        position: 'absolute',
        width: 30,
        height: 30,
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
      whileDrag={{ scale: 1.15, cursor: 'grabbing', zIndex: 20 }}
      transition={
        transitionDuration === 0
          ? { duration: 0 }
          : { type: 'tween', duration: transitionDuration, ease: 'easeInOut' }
      }
    >
      <svg width="30" height="30" style={{ overflow: 'visible' }}>
        {/* Selection ring */}
        {isSelected && (
          <circle
            cx="15" cy="15" r="21"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="5 3"
            opacity="0.9"
          />
        )}
        {renderShape(dancer)}
        <text x="15" y="-8" fill="white" fontSize="10" textAnchor="middle" style={{ pointerEvents: 'none' }}>
          {dancer.name}
        </text>
      </svg>
    </motion.div>
  );
}
