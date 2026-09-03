# AGENTS.md

Vite + React 19 + TypeScript app ("DanceForm"): a choreography mockup editor for placing dancers on a stage across timed formations, with audio playback and autosave. Single-page; entry is `src/main.tsx` → `src/App.tsx`.

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (also the only typecheck path; no separate typecheck script)
- `npm run lint` — ESLint (react-hooks + react-refresh rules). Runs with `--max-warnings 0`: any warning or error fails.
- `npm run test` — `vitest run` (jsdom, setup file `src/test/setup.ts`)
- `npm run preview` — Vite preview server

## Architecture
- All app state lives in `src/hooks/useDanceState.ts` (dancers, formations, notes, active formation). `STAGE_WIDTH`/`STAGE_HEIGHT` constants (800×500) are exported there; dancer/note positions are absolute pixel coords on that stage.
- Every mutation must go through `commit(newDancers, newFormations, newNotes)` in `useDanceState` — it pushes an undo snapshot via `src/hooks/useUndoHistory.ts` → `src/utils/undoHistory.ts` (cap 50). Adding a mutation that bypasses `commit` breaks Cmd/Ctrl+Z undo. Undo/redo key handling is registered globally inside the hook.
- Dancer ids are `Date.now().toString()`; formation ids are `form-${Date.now()}`; note ids are `note-${Date.now()}`.
- Persistence: `src/hooks/useAutoSave.ts` debounces 800ms, writing to localStorage key `danceform_autosave` (project name under `danceform_project_name`), or to a user-picked file via the File System Access API when available. It diffs on the `data` object identity, which `App.tsx` stabilizes with `useMemo` — keep that memoized reference. Import validation is in `src/utils/validateProject.ts`.
- Playback: `src/hooks/useAudio.ts` uses a plain `HTMLAudioElement`; `wavesurfer.js` is used only to render the waveform in `Timeline.tsx`, not for playback state.
- Hooks are split by concern: `useAudio`, `useAutoSave`, `useDanceState`, `useFormationResize`, `useStageInteraction`, `useStageZoom`, `useTimeline`, `useUndoHistory` — each with a co-located `*.test.tsx`.
- Components (`src/components/*/`) use SCSS Modules (`*.module.scss`) + `sass`; `src/index.css` / `src/App.css` still define CSS vars like `--accent-primary`, `--bg-card`, `--border-color`.
- Types: `src/types/index.ts` defines `Dancer`, `DancerPosition`, `Formation`, `Note`, `Shape`.

## TypeScript conventions (enforced by tsconfig.app.json)
- `verbatimModuleSyntax` is on → use `import type { ... }` for type-only imports.
- `erasableSyntaxOnly` is on → no enums, namespaces, or constructor parameter properties; use string-literal unions (e.g. `Shape` in `src/types/index.ts`).
- `noUnusedLocals` / `noUnusedParameters` are on; keep them clean.
- `react-hooks` v6 rules (`set-state-in-effect`, `refs`, `immutability`, `exhaustive-deps`) are project standard. Refactor code to satisfy them; do not suppress them with `eslint-disable`.

## Testing
- Runner: Vitest + Testing Library + jsdom. Config in `vite.config.ts` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`, `globals: false`).
- Co-located tests: `*.test.tsx` next to each hook/component + `src/utils/*.test.ts`.
- Global setup imports `@testing-library/jest-dom/vitest` and calls `cleanup` after each test.

## Specs
- `specs/` holds approved specs (e.g. `01-sidebar-edit-panel-fixed.md` … `07-vitest-unit-tests.md`) — review before large changes.

## Gotchas
- `README.md` is the untouched Vite template — ignore it.
- `StrictMode` is enabled; effects run twice on mount in dev.
- Styling mixes SCSS Modules with CSS vars and some inline styles.
- Stage zoom: Cmd/Ctrl+scroll or Cmd/Ctrl+=/-; timeline zoom: Shift+scroll or Shift+=/-. Space (with body focused) pans the timeline; Delete/Backspace deletes selected formations.
