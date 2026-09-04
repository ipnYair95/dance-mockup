import type { Dancer, DancerPosition, Formation, Note, Shape } from '../types';

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star'];

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

const isNote = (value: unknown): value is Note =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.text) &&
  isNumber(value.startTime) &&
  isNumber(value.duration) &&
  isNumber(value.x) &&
  isNumber(value.y);

export function validateProject(data: unknown): { dancers: Dancer[]; formations: Formation[]; notes: Note[] } | null {
  if (!isRecord(data)) return null;
  if (!Array.isArray(data.dancers) || !data.dancers.every(isDancer)) return null;
  if (!Array.isArray(data.formations) || !data.formations.every(isFormation)) return null;
  // notes es opcional para compatibilidad con proyectos antiguos
  if (data.notes !== undefined && (!Array.isArray(data.notes) || !data.notes.every(isNote))) return null;
  const notes = Array.isArray(data.notes) ? (data.notes as Note[]) : [];
  return { dancers: data.dancers as Dancer[], formations: data.formations as Formation[], notes };
}
