# SPEC 02 — Limpieza de lint: corregir los 13 problemas y endurecer el estándar

**State:** Aprobado
**Date:** 2026-08-04
**Depends on:** —

## Objective
Corregir los 13 problemas que reporta `npm run lint` (10 errores y 3 warnings) en 6 archivos de `src/` con refactor real, sin supresiones, y endurecer el lint para que falle ante cualquier warning.

## Scope
**In:**
- Corregir los 13 problemas actuales (10 errores + 3 warnings) con refactor, sin `eslint-disable`.
- Refactors estructurales de react-hooks v6: `FormationBlock.tsx` (derivar ancho en render, quitar el efecto), `Timeline.tsx` (quitar el efecto de sincronización de selección), `Stage.tsx` (mover refs del co-move a estado), `useAutoSave.ts` (ref leído en render → estado).
- Fixes triviales: orden de declaración en `Sidebar.tsx` y `useAutoSave.ts`, `catch (e)` sin usar en `Timeline.tsx`, destructuring en `App.tsx`.
- Tipar la File System Access API sin `any` en `useAutoSave.ts` (module augmentation para `showSaveFilePicker`).
- Endurecer el lint: `--max-warnings 0` en el script `lint` de `package.json`.
- Documentar en `AGENTS.md` que las reglas react-hooks v6 son estándar del proyecto y no se suprimen.

**Not in:**
- No se cambian presets de `eslint.config.js` (ni `recommended-latest`, ni `strict`, ni se agregan reglas nuevas).
- No se altera el comportamiento funcional de la app; solo se refactoriza para cumplir las reglas.
- No se refactoriza código que no genere problemas de lint.
- No se agrega CI ni infraestructura de testing.
- No se reabre el posicionamiento del panel de edición (SPEC 01).

## Data model
Este spec no introduce estructuras de datos nuevas. `Stage.tsx` reemplaza refs por estado del mismo tipo (`Map<string, { x, y }>`, `string | null`, `boolean`) y `useAutoSave.ts` añade un booleano `hasFileTarget` a su estado — sin cambio de formato de persistencia.

## Implementation plan
1. **`Timeline.tsx` — variable sin usar.** Cambiar `catch (e)` por `catch` en el efecto de zoom (línea 132). Verificación: `npm run lint` baja de 13 a 12 problemas.
2. **`Sidebar.tsx` — `handleSave` antes de su uso.** Convertir `handleSave` a `useCallback` (deps `[name, color, shape, dancer.name, onUpdate, onClose]`), declararla antes del `useEffect`, e incluirla en las deps del efecto. Verificación: panel abre, clic fuera guarda, Enter guarda, Escape cancela.
3. **`useAutoSave.ts` — orden y tipos.** (a) Mover `writeToFile` por encima del `useEffect`. (b) `handle.createWritable()` sin cast. (c) Declarar `showSaveFilePicker` con module augmentation tipado y usarlo sin `any`. (d) `catch (e)` con guard `e instanceof Error` para leer `.name`. (e) `hasFileTarget` como estado, seteado en `pickSaveFile`. Verificación: guardado a localStorage y a archivo funcionan; `npm run build` pasa.
4. **`App.tsx` — warning de dependencias.** Destructurar `danceState` y usar los nombres directos en el efecto de playback, manteniendo las deps actuales. Verificación: el avance de formaciones durante playback sigue sincronizado.
5. **`FormationBlock.tsx` — derivar en render.** Quitar el `useEffect`. Derivar `width` y `transitionWidth` en render (estado draft solo mientras se redimensiona) e inicializar los drafts desde el valor derivado en cada `mousedown`. Verificación: redimensionar duración y transición funciona; el ancho se refresca al cambiar duración/densidad.
6. **`Timeline.tsx` — quitar efecto de sincronización de selección.** Eliminar el `useEffect` que hace `setSelectedIndices`; derivar en render el resaltado activo combinando `currentFormationIndex` con la selección múltiple, y sincronizar la selección en los handlers de selección/borrado. Verificación: selección múltiple, Delete/Backspace y resaltado durante playback siguen igual.
7. **`Stage.tsx` — refs de co-move a estado.** Reemplazar `draggingDancerIdRef`, `isDraggingDancerRef` y `dragStartPositionsRef` por estado, escrito solo en handlers de drag y leído en render. Verificación: arrastrar un bailarín, co-move múltiple y pan funcionan.
8. **Endurecer el lint.** Agregar `--max-warnings 0` al script `lint` de `package.json`. Verificación: `npm run lint` reporta 0 problemas y sale con éxito.
9. **Documentar el estándar.** Añadir en `AGENTS.md` que las reglas react-hooks v6 (set-state-in-effect, refs, immutability) son estándar y no se suprimen con `eslint-disable`.

## Acceptance criteria
- [ ] `npm run lint` termina con éxito y reporta 0 problemas (0 errores y 0 warnings).
- [ ] No hay comentarios `eslint-disable` nuevos en los 6 archivos tocados.
- [ ] `npm run build` (`tsc -b && vite build`) pasa sin errores.
- [ ] El script `lint` de `package.json` incluye `--max-warnings 0`.
- [ ] QA: redimensionar duración y transición en el timeline funciona y el ancho se refresca al cambiar duración o zoom.
- [ ] QA: selección múltiple (Shift/Cmd+clic) y borrado de formaciones (Delete/Backspace) funcionan.
- [ ] QA: durante la reproducción, la formación activa se resalta en el timeline.
- [ ] QA: arrastrar un bailarín, co-move múltiple y pan del escenario funcionan.
- [ ] QA: auto-save a localStorage y a archivo funciona; se muestra "Auto-Saved"/"File Sync".
- [ ] QA: el panel de edición abre, guarda con clic fuera/Enter/Save y cierra con Escape.
- [ ] `AGENTS.md` documenta el estándar de reglas react-hooks v6.

## Decisions taken and discarded
- **Sí: refactor real, sin supresiones.** Las reglas react-hooks v6 señalan anti-patrones reales; suprimirlas con `eslint-disable` los perpetúa. Decisión del usuario en la fase de preguntas.
- **Sí: corregir los 13 problemas (errores + warnings).** Deja `npm run lint` como puerta única y verificable.
- **Sí: `--max-warnings 0` en el script de lint.** ESLint no ofrece "warnings como errores" global en config flat; el flag lo cubre para todas las reglas automáticamente.
- **No: cambiar presets en `eslint.config.js`.** Los `recommended` actuales ya activan las reglas nuevas; otro preset añade reglas no pedidas.
- **Sí: module augmentation para `showSaveFilePicker`.** `lib.dom` de TS 6.0.3 no la incluye; declarar la interface global tipada evita el `any` y es compatible con `erasableSyntaxOnly`.
- **No: `caughtErrors: 'none'` en `no-unused-vars`.** Preferimos arreglar el `catch (e)` puntual antes que aflojar la regla globalmente.
- **No: nueva spec para el endurecimiento.** Es cambio de una línea en el mismo script y se resuelve aquí.

## Risks
| Risk | Mitigation |
| --- | --- |
| Refactor de `Stage.tsx`: el co-move en tiempo real depende de que el estado se propague en cada pointermove. | `coMoveOffset` ya es estado y se actualiza por evento; QA manual de arrastre/co-move explícito en los criterios. |
| `FormationBlock.tsx`: el draft state puede quedar "sucio" entre redimensionamientos. | Inicializar el draft en `mousedown` desde el valor derivado, nunca desde estado previo. |
| Quitar el efecto de sincronización en `Timeline.tsx`: el resaltado durante playback depende de la derivación en render. | Derivar el highlight combinando `currentFormationIndex` y la selección; QA durante reproducción. |
| `--max-warnings 0` endurece el flujo para futuros cambios. | Documentado en `AGENTS.md`; cualquier warning futuro exige arreglo o ajuste explícito de config. |

## What is **not** in this spec
- Nuevas reglas de ESLint o cambio de presets.
- Refactor de código sin problemas de lint.
- CI, tests o tooling de verificación adicional.
- Cambios de comportamiento o de UI de la app.

Cada uno de esos, si llega, va en su propia spec.
