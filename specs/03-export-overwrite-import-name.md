# SPEC 03 — Export con sobrescritura vía picker y nombre de proyecto desde el archivo importado

**State:** Borrador
**Date:** 2026-08-04
**Depends on:** —

## Objective
Que Export use `showSaveFilePicker` para permitir elegir/sobrescribir un archivo existente (con fallback a descarga si la API no existe), que ese archivo quede como destino del autoguardado, y que al importar el nombre del proyecto se derive del nombre del archivo.

## Scope
**In:**
- Export con `showSaveFilePicker` cuando la File System Access API está disponible: el usuario elige ubicación y puede sobrescribir un archivo existente.
- Unificar Export con autosave: el archivo elegido en Export se convierte en el destino del autoguardado (`fileHandleRef`, `mode: 'file'`, `hasFileTarget: true`) y se escribe inmediatamente.
- Fallback: si la API no está disponible, Export conserva el `<a download>` actual.
- Al importar un `.json`, el nombre del proyecto en la top bar pasa a ser el del archivo (sin extensión `.json`).
- Cancelar el picker no produce descarga ni cambio de estado.

**Not in:**
- No se cambia el formato del JSON exportado (`{ dancers, formations }`); el nombre no se guarda dentro del archivo.
- No se guarda el destino del autoguardado entre sesiones (se pierde al recargar, igual que hoy).
- No se cambia el autoguardado salvo por la unificación con Export.
- No se añade opción de "guardar como" separada del autosave.

## Data model
No introduce estructuras de datos nuevas. El JSON de exportación sigue siendo `{ dancers: Dancer[], formations: Formation[] }`. El nombre del proyecto no se persiste en el archivo.

## Implementation plan
1. **`src/hooks/useAutoSave.ts` — `pickSaveFile` parametrizado.** Añadir parámetro opcional `suggestedName` (por defecto `'dance-project.json'`) y usarlo como `suggestedName` del picker. Verificación: el botón autosave sigue ofreciendo `dance-project.json`.
2. **`src/App.tsx` — `handleExport` con picker.** Si `hasFileSystemAPI`, llamar a `pickSaveFile(`${safeName}.json`)` (escribe el archivo y lo fija como destino del autosave); si no, mantener el `<a download>` actual. Verificación: con picker se puede sobrescribir un archivo; cancelar no hace nada; sin API sigue descargando.
3. **`src/App.tsx` — nombre en `handleImport`.** Tras cargar los datos, derivar el nombre: `file.name.replace(/\.json$/i, '').trim()`, con fallback a `'Untitled Dance'` si queda vacío, y llamar `setProjectName(nombre)`. Verificación: importar `mi-coreo.json` muestra "mi-coreo" en la top bar.
4. `npm run build` y `npm run lint`.

## Acceptance criteria
- [ ] Con File System Access API disponible, Export abre el picker y permite elegir un archivo existente y sobrescribirlo.
- [ ] Tras elegir el archivo en Export, el botón de autosave muestra "File Sync" y el siguiente cambio escribe a ese mismo archivo.
- [ ] Sin File System Access API, Export descarga el archivo como hoy (`<a download>`).
- [ ] Si el usuario cancela el picker, no ocurre nada: ni descarga, ni error, ni cambio de estado.
- [ ] Al importar un `.json`, el nombre del proyecto en la top bar pasa al del archivo sin extensión.
- [ ] `npm run build` y `npm run lint` pasan sin errores.

## Decisions taken and discarded
- **Sí: `showSaveFilePicker` para Export.** Es la única vía del navegador para elegir ubicación y sobrescribir; es la misma API que ya usa el autoguardado.
- **Sí: unificar Export con el autosave.** Un solo archivo para todo evita dos handles en paralelo y que el usuario acabe con dos copias divergentes.
- **Sí: fallback a `<a download>` sin API.** Mantiene el comportamiento actual en navegadores no soportados (Safari).
- **Sí: nombre del proyecto desde el nombre del archivo importado.** Sin cambiar el formato del JSON; decisión explícita del usuario.
- **No: guardar `projectName` dentro del JSON.** Cambiaría el formato y exigiría migración; el nombre del archivo es suficiente según el usuario.
- **No: persistir el destino del autosave entre sesiones.** Misma limitación que hoy; re-pickear al recargar.

## Risks
| Risk | Mitigation |
| --- | --- |
| Error no-Abort al elegir archivo en Export | Igual que en autosave: `console.error` silencioso, sin descarga. Aceptado para coherencia. |
| El `<a download>` de fallback descarga a Downloads sin preguntar | Comportamiento actual; solo se usa sin File System Access API. |
| `suggestedName` en Export se sanitiza igual que hoy | `safeName` ya existe en `App.tsx` (línea 67); no se duplica lógica. |

## What is **not** in this spec
- Guardar el nombre del proyecto dentro del archivo JSON.
- Recordar el archivo destino del autosave entre recargas.
- Cambios al autoguardado más allá de la unificación con Export.
- Confirmación de sobrescritura extra (el picker nativo ya pregunta).

Cada uno de esos, si llega, va en su propia spec.
