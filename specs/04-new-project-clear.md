# SPEC 04 — Nuevo proyecto: botón con confirmación que limpia el tablero y desvincula el autoguardado

**State:** Approved
**Date:** 2026-08-04
**Depends on:** —

## Objective
Añadir un botón "New" en la top bar que, tras una confirmación en modal propio, resetee el proyecto a sus valores por defecto, vacíe el historial de undo y desvincule el archivo autoguardado (handle y entrada de localStorage) para que ninguna referencia previa haga conflicto.

## Scope
**In:**
- Botón "New" (icono `Plus` de lucide-react) en la top bar, entre Export y Settings.
- Modal propio estilizado con las CSS vars del proyecto, con botones Cancel/confirm, cierre por Escape y por clic en el backdrop.
- Reset de estado a `DEFAULT_DANCERS` y `DEFAULT_FORMATIONS` con índice activo 0, vía `clearProject()` en `useDanceState`.
- Nombre del proyecto a "Untitled Dance".
- Vaciar el historial de undo/redo y pushear los defaults como única línea base (el clear no es deshacible, pero el undo posterior a mutaciones sí funciona).
- Desvincular el archivo elegido del autosave (`fileHandleRef = null`, `mode: 'local'`, `hasFileTarget: false`) y borrar la clave `danceform_autosave` de localStorage.
- Parar la reproducción y quitar la pista cargada al confirmar: `clearAudio()` en `useAudio` (pause, `src` vacío, `currentTime`/`duration` a 0) y vaciar la onda de wavesurfer en `Timeline` vía señal de reset.

**Not in:**
- Borrar el archivo físico vinculado en disco.
- Cambiar el formato de persistencia ni el resto del autosave (solo `clearFileTarget`).

## Data model
No introduce estructuras de datos nuevas. Se reutilizan `DEFAULT_DANCERS`/`DEFAULT_FORMATIONS` ya existentes en `useDanceState.ts`. Se añaden tres funciones nuevas:
- `useUndoHistory.reset(snapshot)` — vacía `past`/`future` y pushea `snapshot` como línea base.
- `useDanceState.clearProject()` — setea dancers/formations/index y llama a `history.reset(defaultSnapshot)`.
- `useAutoSave.clearFileTarget()` — resetea el handle, `mode`, `hasFileTarget`, cancela el debounce pendiente y hace `localStorage.removeItem(LS_KEY)`.
- `useAudio.clearAudio()` — `audioRef.current.pause()`, `audioRef.current.src = ''`, `audioRef.current.load()`, `setIsPlaying(false)`, `setCurrentTime(0)`, `setDuration(0)`.
- `Timeline` recibe la prop `clearSignal: number` (por defecto 0); un efecto llama `wavesurfer.current?.empty()` (con try/catch, igual que el efecto de zoom) cuando `clearSignal` cambia.

## Implementation plan
1. **`src/hooks/useUndoHistory.ts`** — añadir `reset(snapshot)` que vacía `past` y `future` y pushea `snapshot`. Verificación: `npm run build`.
2. **`src/hooks/useDanceState.ts`** — añadir `clearProject()` que aplica `DEFAULT_DANCERS`, `DEFAULT_FORMATIONS`, `setCurrentFormationIndex(0)` y `history.reset({ dancers: DEFAULT_DANCERS, formations: DEFAULT_FORMATIONS })`; exportarla en el return. Verificación: `npm run build`.
3. **`src/hooks/useAutoSave.ts`** — añadir `clearFileTarget()`: `fileHandleRef.current = null`, `setMode('local')`, `setHasFileTarget(false)`, cancelar `debounceTimer.current` si está pendiente y `localStorage.removeItem(LS_KEY)`; exportarla en el return. Verificación: `npm run build`.
4. **`src/hooks/useAudio.ts`** — añadir `clearAudio()`: pause, `src = ''`, `.load()`, `setIsPlaying(false)`, `setCurrentTime(0)`, `setDuration(0)`; exportarla en el return. Verificación: `npm run build`.
5. **`src/components/Timeline.tsx`** — añadir la prop `clearSignal: number` (por defecto 0) y un efecto que llama `wavesurfer.current?.empty()` en try/catch cuando `clearSignal > 0` y cambia. Verificación: `npm run build`.
6. **`src/components/ConfirmModal.tsx`** (nuevo) — modal estilizado: backdrop oscuro (clic → cancel), caja centrada con `--bg-card`/`--border-color`/`--border-radius`, título, mensaje y botones Cancel/confirm (el de confirmar con `--accent-primary`). Escape cierra vía keydown. Props: `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`. Verificación: `npm run build`.
7. **`src/App.tsx`** — estado `isConfirmOpen` y `audioClearSignal`; botón "New" con icono `Plus` entre Export y Settings; al confirmar: `setProjectName('Untitled Dance')`, `danceState.clearProject()`, `clearFileTarget()` (destructurada de `useAutoSave`), `audio.clearAudio()`, `setAudioClearSignal(s => s + 1)` y cerrar el modal. Verificación: QA manual.
8. `npm run build` y `npm run lint`.

## Acceptance criteria
- [ ] En la top bar, entre Export y Settings, existe un botón "New".
- [ ] Clic en "New" abre el modal estilizado con título, mensaje y botones Cancel/confirm.
- [ ] Cancel, clic en el backdrop o Escape cierran el modal sin tocar el estado.
- [ ] Confirmar resetea a los 3 bailarines por defecto y a la 1 formación por defecto (índice activo 0).
- [ ] El nombre del proyecto en la top bar vuelve a "Untitled Dance".
- [ ] Tras confirmar, Ctrl/Cmd+Z no restaura el proyecto anterior.
- [ ] Si había un archivo vinculado, el botón de autosave muestra "Auto-Save" y los cambios posteriores escriben a localStorage, no al archivo.
- [ ] Tras confirmar, la reproducción se detiene, el audio cargado se elimina y la onda del timeline queda en blanco.
- [ ] Tras confirmar, recargar la página muestra el tablero por defecto (no el proyecto previo).
- [ ] Tras confirmar, una mutación posterior seguida de Ctrl/Cmd+Z revierte al estado limpio (defaults).
- [ ] `npm run build` y `npm run lint` pasan sin errores.

## Decisions taken and discarded
- **Sí: botón en la top bar junto a Export.** Es la zona de acciones de proyecto; se coloca entre Export y Settings. Decisión del usuario.
- **Sí: modal propio estilizado.** `window.confirm` no se integra con el tema oscuro; un modal con las CSS vars es consistente con la app y permite Escape/backdrop.
- **Sí: reset completo (dancers, formations, nombre, historial).** "Empezar de cero de verdad", decisión del usuario.
- **No: clear deshacible.** El usuario eligió vaciar el historial; `reset` pushea los defaults como línea base para que el undo posterior siga funcionando sin poder volver al proyecto anterior.
- **Sí: desvincular archivo + borrar entrada de localStorage.** La entrada se sobrescribiría sola con los defaults por el autosave, pero borrarla cubre el caso de cerrar la pestaña antes del debounce de 800ms.
- **No: borrar el archivo físico en disco.** Destructivo y la File System Access API no garantiza el borrado; solo se pidió desvincular.
- **Sí: limpiar también el audio.** "Empezar de cero" incluye callar la música y quitar la pista; el audio es solo memoria y no interfiere con el autoguardado.
- **No: revocar el object URL del audio.** `useAudio` no guarda referencia al URL; se vacía el `src` y el GC libera el blob.

## Risks
| Risk | Mitigation |
| --- | --- |
| Escritura pendiente del autosave con el handle viejo tras limpiar | `clearFileTarget` cancela el debounce pendiente; además `clearProject` cambia `data`, reiniciando el efecto de autosave. |
| Recargar antes de que el autosave reescriba localStorage | El clear borra la entrada; en el mount no hay nada que restaurar. |
| StrictMode monta efectos dos veces en dev | `reset`/`clearProject` son idempotentes; sin efecto visible. |

## What is **not** in this spec
- Borrar el archivo físico vinculado en disco.
- Undo deshacible del clear.
- Cambios al formato de persistencia o al autosave más allá de `clearFileTarget`.
- Confirmación nativa (`window.confirm`).

Cada uno de esos, si llega, va en su propia spec.
