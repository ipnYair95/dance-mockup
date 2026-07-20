export type Shape = 'circle' | 'square' | 'triangle';

export interface Dancer {
  id: string;
  name: string;
  color: string;
  shape: Shape;
}

export interface DancerPosition {
  dancerId: string;
  x: number;
  y: number;
}

export interface Formation {
  id: string;
  name: string;
  duration: number; // total duration in seconds
  transitionDuration: number; // transition time in seconds
  positions: DancerPosition[];
}
