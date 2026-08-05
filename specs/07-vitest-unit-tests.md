# SPEC 07 — Tests unitarios con Vitest + refactor a hooks por componente

**State:** Implemented
**Date:** 2026-08-04
**Depends on:** —

## Objective
Añadir tests unitarios con Vitest al proyecto, refactorizando la lógica embebida en componentes a hooks dedicados y funciones puras, de modo que la suite sea fiable (lógica pura por encima de DOM) y sirva de red de seguridad al agregar cambios.

## Scope
**In:**
- **devDependencies:** `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- **Config:** bloque `test` en `vite.config.ts` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, sin globals → imports explícitos de `vitest`) + `src/test/setup.ts` con `import '@testing-library/jest-dom/vitest'`. Script nuevo `"test": "vitest run"` en `package.json`.
- **Refactor 1 — `src/hooks/useTimeline.ts`** extraído de `Timeline.tsx`: estado `pixelsPerSecond` (clamp 5..150) con zoom por Shift+scroll y Shift+=/−, `selectedIndices` (multi-selección de formaciones), pan con Space, borrado con Delete/Backspace, click→tiempo (`timeFromClick`), `formatTime` (mm:ss.m). `Timeline.tsx` delega y conserva wavesurfer en sus efectos.
- **Refactor 2 — `src/hooks/useFormationResize.ts`** extraído de `FormationBlock.tsx`: resize de duración (min 20px) y transición (min 5px, ≤ duración), conversión px→segundos con `pixelsPerSecond`, listeners de documento.
- **Refactor 3 — `src/utils/undoHistory.ts`**: `push/undo/redo/reset/canUndo/canRedo` como funciones puras e inmutables sobre `UndoStack { past, future }`. `useUndoHistory` pasa a delegar en ellas.
- **`src/utils/validateProject.ts`**: función pura que valida la forma de `{ dancers, formations }` y devuelve el proyecto tipado o `null`. `App.tsx` la usa en `handleImport` en lugar del check `if (data.dancers && data.formations)` (línea 89).
- **Política de mocks (unit tests aislados):** toda unidad bajo test mockea sus imports para no re-testear dependencias ya cubiertas en su propio nivel:
  - **Componentes:** `Timeline.test.tsx` mockea `useTimeline`, `wavesurfer.js` y `FormationBlock` (retorna un stub `data-testid="formation-block"`); solo verifica el render/vista y que llame a sus props. `DancerOnStage.test.tsx` mockea `framer-motion` (motion.div → div plano) y verifica shapes/`data-dancer`/label sin lógica de arrastre. `ConfirmModal` y `Sidebar` no importan hooks/componentes propios, solo iconos de lucide (reales).
  - **Hooks:** `useDanceState.test.tsx` mockea `./useUndoHistory` (trackea `push`/`undo`/`redo`) y `Date.now` (ids); solo valida mutaciones y que `commit` registre el snapshot. `useAutoSave.test.tsx` mockea localStorage y `window.showSaveFilePicker` (si se cubre el path de archivo) con `vi.useFakeTimers`. `useAudio.test.tsx` mockea `HTMLAudioElement` y `URL.createObjectURL`. `useUndoHistory.test.tsx` mockea `../utils/undoHistory` y verifica solo la delegación (push → `pushUndo`, undo → `undoStack`). `useStageZoom` y `useStageInteraction` y los utils puros (`undoHistory`, `validateProject`) no requieren mocks.
  - Regla transversal: **un test jamás asevera sobre el comportamiento de lo que mockea** — el mock solo aporta valores/handlers controlados.
- **Tests co-locados** (`*.test.ts` / `*.test.tsx` junto a su código):
  - `src/utils/undoHistory.test.ts` · `src/utils/validateProject.test.ts` — puros, sin mocks.
  - `src/hooks/useUndoHistory.test.tsx` (delegación) · `src/hooks/useDanceState.test.tsx` (todas las mutaciones + que `commit` registra undo) · `src/hooks/useAutoSave.test.tsx` (fake timers: debounce 800ms, localStorage, saveStatus) · `src/hooks/useStageZoom.test.tsx` (clamp 0.25..3) · `src/hooks/useStageInteraction.test.tsx` (toggle + multi-drag) · `src/hooks/useAudio.test.tsx` (HTMLAudioElement mockeado) · `src/hooks/useTimeline.test.tsx` · `src/hooks/useFormationResize.test.tsx` — renderHook.
  - `src/components/Timeline/Timeline.test.tsx` · `src/components/DancerOnStage/DancerOnStage.test.tsx` (3 shapes, `data-dancer`) · `src/components/ConfirmModal/ConfirmModal.test.tsx` (Escape, Cancel/Confirm) · `src/components/Sidebar/Sidebar.test.tsx` (Save/Delete/Cancel) — render con @testing-library/react y mocks de sus imports.
- **QA final:** `npm run test`, `npm run lint` (0 problemas) y `npm run build` pasan; comportamiento visible intacto.

**Not in:**
- Tests E2E (Playwright) — spec aparte.
- Umbral de coverage como puerta (vitest informa sin bloquear).
- Tests de wavesurfer.js (se mockea/ignora en Timeline).
- CI (GitHub Actions) — spec aparte.
- Test del render completo de `App.tsx`.
- Cambios de funcionalidad, paleta, layout o estructura de datos.

## Data model
Nuevas estructuras y contratos (sin cambios a `types/index.ts`):

```ts
// src/utils/undoHistory.ts
export interface UndoStack { past: Snapshot[]; future: Snapshot[] }   // Snapshot = { dancers, formations }
export function createUndoStack(s: Snapshot): UndoStack
export function pushUndo(stack: UndoStack, s: Snapshot): UndoStack
export function undoStack(stack: UndoStack): { stack: UndoStack; snapshot: Snapshot | null }
export function redoStack(stack: UndoStack): { stack: UndoStack; snapshot: Snapshot | null }
export function resetStack(stack: UndoStack, s: Snapshot): UndoStack
export function canUndo(stack: UndoStack): boolean
export function canRedo(stack: UndoStack): boolean

// src/utils/validateProject.ts
export function validateProject(data: unknown): { dancers: Dancer[]; formations: Formation[] } | null

// src/hooks/useTimeline.ts
useTimeline(params: {
  formationsLength: number; currentFormationIndex: number; timelineDuration: number;
  onSeek: (t: number) => void; onDeleteFormation: (indices: number[]) => void;
}) → { pixelsPerSecond, selectedIndices, isSpacePressed, isPanning, trackRef,
      zoomIn, zoomOut, handleTimelineClick, handleKeyDown, handleKeyUp,
      handleTrackMouseDown/Move/Up, selectFormation, formatTime, timeFromClick }

// src/hooks/useFormationResize.ts
useFormationResize({ duration, transitionDuration, pixelsPerSecond }) →
  { width, transitionWidth, isResizingDuration, isResizingTransition,
    durationHandlers, transitionHandlers }
```

## Implementation plan
1. **Instalar y configurar Vitest**: devDependencies + bloque `test` en `vite.config.ts` (referencia `vitest/config`, jsdom, setup) + `src/test/setup.ts` + script `"test"`. Verificación: `npm run test` corre (0 tests).
2. **`src/utils/validateProject.ts` + test** e integración en `App.tsx` (`handleImport`). Verificación: test pasa; import de JSON válido/inválido funciona igual en QA manual.
3. **`src/utils/undoHistory.ts` puro + test**, y `useUndoHistory` delegando + test renderHook (mock de `../utils/undoHistory`). Verificación: `npm run test`; Cmd+Z/Cmd+Shift+Z siguen funcionando.
4. **`useTimeline`** extraído y `Timeline.tsx` usándolo (wavesurfer intacto) + tests (renderHook y helpers puros, sin mocks). Verificación: zoom/pan/selección/Delete/seek idénticos.
5. **`useFormationResize`** extraído y `FormationBlock.tsx` usándolo + tests del hook (sin mocks). Verificación: redimensionar duración/transición igual.
6. **Tests renderHook de hooks existentes** sin modificar, cada uno con sus mocks: `useDanceState` (mock `useUndoHistory` + `Date.now`), `useAutoSave` (fake timers + localStorage), `useStageZoom` (elemento ref stub), `useStageInteraction` (sin mocks), `useAudio` (mock `HTMLAudioElement`/`URL.createObjectURL`). Verificación: suite verde.
7. **Tests de render de componentes con mocks:** `Timeline` (mock `useTimeline`, `wavesurfer.js`, `FormationBlock`), `DancerOnStage` (mock `framer-motion`), `ConfirmModal`, `Sidebar`. Verificación: suite verde.
8. **QA final**: `npm run test`, `npm run lint` (0), `npm run build`; reproducción manual del flujo completo.

## Acceptance criteria
- [ ] `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event` en devDependencies.
- [ ] `npm run test` ejecuta la suite en modo run y pasa; script definido en `package.json`.
- [ ] `vite.config.ts` tiene bloque `test` (jsdom) con setup de jest-dom.
- [ ] `src/utils/undoHistory.ts` existe y `useUndoHistory` delega en sus funciones puras; tests puros cubren push/undo/redo/reset/canUndo/canRedo.
- [ ] `src/hooks/useTimeline.ts` existe y `Timeline.tsx` lo usa sin cambios funcionales visibles.
- [ ] `src/hooks/useFormationResize.ts` existe y `FormationBlock.tsx` lo usa.
- [ ] `src/utils/validateProject.ts` existe y `App.tsx` lo usa en `handleImport`.
- [ ] Cada test de componente mockea los hooks, componentes hijos y librerías que importa (p. ej. `Timeline` mockea `useTimeline`, `wavesurfer.js` y `FormationBlock`).
- [ ] Cada test de hook mockea los hooks/utils que importa y los APIs globales que usa (localStorage, `Date.now`, `HTMLAudioElement`, `showSaveFilePicker`).
- [ ] Ningún test asevera sobre el comportamiento interno de lo que mockea (solo usa valores/handlers controlados).
- [ ] Existe al menos un test renderHook para cada hook existente: `useDanceState`, `useAutoSave`, `useStageZoom`, `useStageInteraction`, `useAudio`.
- [ ] Existe un test de render para `Timeline`, `DancerOnStage`, `ConfirmModal` y `Sidebar`.
- [ ] Todos los tests están co-locados (`*.test.ts(x)` junto a su código).
- [ ] `npm run test`, `npm run lint` (0 problemas) y `npm run build` pasan.
- [ ] QA: playback, seek, zoom de timeline, redimensionar formaciones, undo/redo, panel de edición y modal funcionan igual que antes.

## Decisions taken and discarded
- **Sí: Vitest + jsdom + Testing Library.** Pila estándar para React 19 + Vite.
- **Sí: extraer hooks por componente (`useTimeline`, `useFormationResize`) en vez de un reducer global.** Decisión del usuario: "busquemos primero la manera de separar en hooks específicos para sus componentes". Aísla lógica por UI sin reestructurar el estado global.
- **No: reducer global (`danceReducer`) para `useDanceState`.** Descartado en favor del split por componentes; el hook se testea con renderHook sin refactor.
- **Sí: undo/redo como funciones puras + hook que delega.** Testeable sin React y protege la invariante "toda mutación pasa por `commit`".
- **Sí: `validateProject` puro para el import.** La validación queda reutilizable y testable.
- **Sí: tests co-locados.** Mismo patrón que las carpetas de componentes.
- **Sí: mocks por unidad (unit tests aislados).** Decisión del usuario: mockear toda importación (componentes y hooks) para no volver a testear lo ya probado. Cada unidad se cubre una sola vez: `useTimeline`/`FormationBlock` en sus tests, y como mocks en el test de `Timeline`.
- **No: umbral de coverage como puerta.** El usuario eligió tooling sin umbral; la suite es la verificación.
- **No: E2E, CI, tests de `App.tsx` completo ni de wavesurfer.** Fuera de alcance; cada uno merece su spec.

## Risks
| Risk | Mitigation |
| --- | --- |
| Refactor de `Timeline`/`FormationBlock` introduce regresiones (keyboard, wavesurfer, resize). | Pasos aislados (4 y 5) con QA manual por paso; el hook no toca wavesurfer; QA final de flujo completo. |
| `HTMLAudioElement` / File System Access API no existen en jsdom. | Mocks explícitos por test (`vi.fn`, clase mock de audio). |
| Debounce/intervalos de `useAutoSave` vuelven los tests lentos o con fugas. | `vi.useFakeTimers` + cleanup por test. |
| Los archivos de test rompen `tsc -b` (`npm run build`). | Imports explícitos de vitest (sin globals) y `setup.ts` tipado; build como puerta final. |
| CSS modules hasheados rompen selectores en tests. | Los tests usan `data-*`, roles y texto, no clases. |
| Mockear demasiado esconde bugs de integración (conectores rotos entre hook y componente). | El mock expone la API pública real del hook/componente (`vi.mock` con la misma firma); el QA manual y `npm run build` cubren la integración. |
| `vi.mock` de rutas relativas con `erasableSyntaxOnly`/`verbatimModuleSyntax`. | Imports de tipos separados (`import type`) y mocks de módulo solo de valores en runtime. |

## What is **not** in this spec
- E2E (Playwright), CI, umbral de coverage, tests de `App.tsx` completo, tests de wavesurfer.
- Cambio de comportamiento funcional, paleta, layout o estructura de datos.
