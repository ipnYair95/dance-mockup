# AGENTS.md

Vite + React 19 + TypeScript app ("DanceForm"): a choreography mockup editor for placing dancers on a stage across timed formations, with audio playback and autosave. Single-page; entry is `src/main.tsx` → `src/App.tsx`.

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (also the only typecheck path; no separate typecheck script)
- `npm run lint` — ESLint (react-hooks + react-refresh rules). Runs with `--max-warnings 0`: any warning or error fails.
- No test framework or test scripts exist in this repo.

## Architecture
- All app state lives in `src/hooks/useDanceState.ts` (dancers, formations, active formation, undo). `STAGE_WIDTH`/`STAGE_HEIGHT` constants (800×500) are exported there; dancer positions are absolute pixel coords on that stage.
- Every mutation must go through `commit(newDancers, newFormations)` in `useDanceState` — it pushes an undo snapshot. Adding a mutation that bypasses `commit` breaks Cmd/Ctrl+Z undo. Undo/redo key handling is registered globally inside the hook.
- Dancer ids are `Date.now().toString()`; formation ids are `form-${Date.now()}`.
- Persistence: `src/hooks/useAutoSave.ts` debounces 800ms, writing to localStorage key `danceform_autosave`, or to a user-picked file via the File System Access API when available. It diffs on the `data` object identity, which App.tsx stabilizes with `useMemo` — keep that memoized reference.
- Playback: `src/hooks/useAudio.ts` uses a plain `HTMLAudioElement`; `wavesurfer.js` is used only to render the waveform in `Timeline.tsx`, not for playback state.

## TypeScript conventions (enforced by tsconfig.app.json)
- `verbatimModuleSyntax` is on → use `import type { ... }` for type-only imports.
- `erasableSyntaxOnly` is on → no enums, namespaces, or constructor parameter properties; use string-literal unions (e.g. `Shape` in `src/types/index.ts`).
- `noUnusedLocals` / `noUnusedParameters` are on; keep them clean.
- `react-hooks` v6 rules (`set-state-in-effect`, `refs`, `immutability`, `exhaustive-deps`) are project standard. Refactor code to satisfy them; do not suppress them with `eslint-disable`.

## Gotchas
- `README.md` is the untouched Vite template — ignore it.
- `src/utils/` is empty.
- `StrictMode` is enabled; effects run twice on mount in dev.
- Styling is plain CSS (`src/index.css` defines CSS vars like `--accent-primary`, `--bg-card`, `--border-color`) mixed with heavy inline styles.
- Stage zoom: Cmd/Ctrl+scroll or Cmd/Ctrl+=/-; timeline zoom: Shift+scroll or Shift+=/-. Space (with body focused) pans the timeline; Delete/Backspace deletes selected formations.
