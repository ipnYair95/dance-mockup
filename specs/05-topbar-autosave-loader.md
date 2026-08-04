# SPEC 05 — Top bar: loader de guardado/import en el chip, sin Settings, nombre junto al título con icono

**State:** Approved
**Date:** 2026-08-04
**Depends on:** —

## Objective
Rediseñar la top bar: quitar el botón Settings sin funcionalidad, agregar un icono al título "DanceForm", mover el nombre del proyecto junto al título, eliminar el texto de estado junto al nombre, y mostrar un spinner en el chip de autosave mientras guarda o importa.

## Scope
**In:**
- Quitar el botón Settings de la top bar (no tiene funcionalidad).
- Título con icono `Footprints` de lucide-react + texto "DanceForm" (se mantiene el texto actual).
- Nombre del proyecto movido a la izquierda, junto al título, conservando su comportamiento editable (clic → input, Enter/Escape/blur, persistencia vía `saveProjectName`).
- Eliminar el texto "· Saving…/· Saved" que hoy se muestra junto al nombre (el chip ya informa el estado).
- Spinner en el chip mientras `saveStatus === 'saving'`: icono `Loader2` de lucide-react girando + etiqueta "Saving…", en lugar del `HardDrive`.
- Estado `saved` en el chip: icono de check verde (p. ej. `CheckCircle2`) + etiqueta Auto-Saved/File Sync.
- Loader durante la importación de `.json`: mientras se lee/parsea el archivo, el chip muestra el spinner + etiqueta "Loading…".
- Keyframe de giro `@keyframes spin` en `src/App.css`.

**Not in:**
- Cambios a la lógica de `useAutoSave` (la escritura debounced/periódica queda intacta).
- Spinner al restaurar el autosave de localStorage en el arranque (es síncrono e instantáneo; animarlo sería artificial).
- Cambiar el texto o la tipografía de "DanceForm".
- Darle funcionalidad real al botón Settings.

## Data model
No introduce estructuras de datos nuevas. Se agrega un único estado local de UI en `App.tsx`: `isImporting: boolean` (inicial `false`). Se eliminan las constantes `SAVE_STATUS_LABELS` y `SAVE_STATUS_COLORS` de `App.tsx` (solo se usaban en el texto junto al nombre).

## Implementation plan
1. **`src/App.css`** — añadir `@keyframes spin` (0→360deg) y una clase `.spin { animation: spin 1s linear infinite }`. Verificación: `npm run build`.
2. **`src/App.tsx`** — ajustar imports de lucide-react: quitar `Settings`, añadir `Footprints`, `Loader2`, `CheckCircle2`. Verificación: `npm run build`.
3. **`src/App.tsx`** — reestructurar la top bar: el grupo izquierdo pasa a ser `Footprints` + "DanceForm" + el bloque del nombre editable (el que hoy vive en el grupo central); se elimina el grupo central y las constantes `SAVE_STATUS_LABELS`/`SAVE_STATUS_COLORS` y su uso. Verificación: `npm run build`.
4. **`src/App.tsx`** — chip con icono condicional: `saving` → `Loader2` con clase `.spin`; `saved` → `CheckCircle2` en verde; resto → `HardDrive`. La etiqueta añade el caso `isImporting` → "Loading…". Se elimina el botón Settings. Verificación: `npm run build`.
5. **`src/App.tsx`** — estado `isImporting`; en `handleImport`, `setIsImporting(true)` antes de `reader.readAsText(file)` y `setIsImporting(false)` al final de `onload` y en el `catch`. Verificación: QA manual.
6. `npm run build` y `npm run lint`.

## Acceptance criteria
- [ ] El botón Settings no aparece en la top bar.
- [ ] El título muestra el icono `Footprints` seguido del texto "DanceForm".
- [ ] El nombre del proyecto está a la izquierda, junto al título.
- [ ] Clic en el nombre abre el input de renombrado; Enter/Escape/blur lo cierran igual que hoy.
- [ ] No existe el texto "· Saving…" ni "· Saved" junto al nombre.
- [ ] Mientras el autosave escribe, el chip muestra un spinner girando en lugar del `HardDrive`.
- [ ] Tras guardar, el chip muestra un check verde con la etiqueta Auto-Saved (local) o File Sync (archivo vinculado).
- [ ] Al importar un `.json`, el chip muestra el spinner y la etiqueta "Loading…" mientras se procesa.
- [ ] `npm run build` y `npm run lint` pasan sin errores.

## Decisions taken and discarded
- **Sí: spinner en el chip (no junto al nombre).** Es el único lugar de estado de guardado y coincide con "ya basta con el chip". Decisión del usuario.
- **Sí: loader solo al importar.** La restauración de localStorage en el arranque es síncrona e instantánea; no hay ventana real de espera que animar. Decisión del usuario.
- **Sí: eliminar el texto "· Saving…/· Saved" junto al nombre.** Redundante con el chip, que ahora además muestra spinner/check.
- **Sí: quitar el botón Settings.** Sin funcionalidad ni destino futuro confirmado.
- **Sí: icono `Footprints` para el título.** Sugiere pasos de baile/corografía, acorde con la app. Decisión del usuario.
- **Sí: mover el nombre junto al título.** Agrupa la identidad del proyecto en la izquierda y equilibra la barra.
- **No: crear un componente nuevo para el chip.** El resto de la top bar usa inline styles; mantener coherencia.

## Risks
| Risk | Mitigation |
| --- | --- |
| Flicker del spinner de import (la lectura es casi instantánea) | Se mantiene mientras dure el parseo; es el comportamiento pedido, aceptado. |
| Spinner y estado saved se pisan | Los estados son mutuamente excluyentes (`saving`/`import`/`saved`/idle) y se resuelven en un solo condicional. |

## What is **not** in this spec
- Cambios a la lógica de guardado (`useAutoSave.ts`).
- Spinner en el arranque con autosave de localStorage.
- Funcionalidad real para Settings.
- Cambio del texto o la tipografía de "DanceForm".

Cada uno de esos, si llega, va en su propia spec.
