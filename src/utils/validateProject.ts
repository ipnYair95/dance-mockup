import type { Dancer, DancerPosition, Formation, Shape } from '../types';

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isShape = (value: unknown): value is Shape => SHAPES.includes(value as Shape);

const isDancer = (value: unknown): value is Dancer =>
  isRecord(value) && isString(value.id) && isString(value.name) && isString(value.color) && isShape(value.shape);

const isDancerPosition = (value: unknown): value is DancerPosition =>
  isRecord(value) && isString(value.dancerId) && isNumber(value.x) && isNumber(value.y);

const isFormation = (value: unknown): value is Formation =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isNumber(value.duration) &&
  isNumber(value.transitionDuration) &&
  Array.isArray(value.positions) &&
  value.positions.every(isDancerPosition);

export function validateProject(data: unknown): { dancers: Dancer[]; formations: Formation[] } | null {
  if (!isRecord(data)) return null;
  if (!Array.isArray(data.dancers) || !data.dancers.every(isDancer)) return null;
  if (!Array.isArray(data.formations) || !data.formations.every(isFormation)) return null;
  return { dancers: data.dancers as Dancer[], formations: data.formations as Formation[] };
}
