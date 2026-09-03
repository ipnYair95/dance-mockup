# DanceForm

Choreography mockup editor — place dancers on a stage across timed formations, with audio playback and autosave. Single-page app: `src/main.tsx` → `src/App.tsx`.

## Stack

Vite + React 19 + TypeScript · SCSS Modules · `wavesurfer.js` (waveform only) · Vitest + Testing Library + jsdom

## Commands

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint --max-warnings 0
npm run test     # vitest run
npm run preview  # Vite preview
```

## Features

- **Stage** (800×500): drag dancers, multi-select (Shift/Ctrl+Click), snap on drop. Zoom: `Ctrl/Cmd + scroll` or `Ctrl/Cmd + +/-/0`, pan by dragging empty area.
- **Timeline**: formation blocks with duration/transition resize, note blocks. Zoom: `Shift + scroll` or `Shift + +/-`, pan: `Space + drag`, seek: click track. `Delete/Backspace` removes selected blocks.
- **Audio**: `HTMLAudioElement` for playback; `wavesurfer.js` only renders the waveform. Syncs current formation to `currentTime`.
- **Autosave**: debounced 800ms to `localStorage` (`danceform_autosave` + `danceform_project_name`) or to a user-picked file via File System Access API. Import validates via `src/utils/validateProject.ts`.
- **Undo/Redo**: `Ctrl/Cmd+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`, history cap 50 (`src/utils/undoHistory.ts`).

## Project Structure

```
src/
  components/  # Stage, Timeline, Sidebar, DancerOnStage, etc. (SCSS Modules)
  hooks/       # useDanceState, useAudio, useAutoSave, useUndoHistory, useStageInteraction, ...
  utils/       # undoHistory, validateProject
  types/       # Dancer, Formation, Note, Shape
  test/setup.ts
specs/         # approved specs (01-07)
```

All state lives in `src/hooks/useDanceState.ts` — every mutation goes through `commit(dancers, formations, notes)` or undo breaks. `App.tsx` memoizes `projectData` so `useAutoSave` can diff by reference.

## TypeScript

`verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums), `noUnusedLocals/Parameters` on. `react-hooks` v6 rules enforced — don't suppress with `eslint-disable`.
