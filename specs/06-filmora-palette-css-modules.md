# SPEC 06 — Paleta Filmora + estilos separados a CSS modules

**State:** Aprobado
**Date:** 2026-08-04
**Depends on:** —

## Objective
Cambiar la paleta de colores a la de Filmora (acento violeta) y separar los inline styles de todos los componentes a archivos `.module.scss` que conviven con su `.tsx` en una carpeta, añadiendo feedback de hover a todos los botones.

## Scope
**In:**
- Instalar `sass` como devDependency (requisito para `.module.scss` en Vite).
- Paleta Filmora en `:root` de `src/index.css`: `--accent-primary: #7C3AED`, `--accent-hover: #6D28D9`. Ajustar al violeta los overlays/glows actuales: box-shadow del playhead (App.css), transition-overlay (rgba(33,150,243,...)), badge de selección del stage, y los colores de onda de wavesurfer en `Timeline.tsx` (`waveColor`/`progressColor`, hardcodeados porque wavesurfer no resuelve `var(--...)`). Los neutros oscuros se mantienen.
- Cada componente pasa a su carpeta con su CSS module:
  - `components/Sidebar/` (Sidebar.tsx + Sidebar.module.scss) — incluye DancerEditPanel.
  - `components/Stage/` · `components/Timeline/` · `components/FormationBlock/`
  - `components/DancerOnStage/` · `components/ConfirmModal/`
- `App.tsx` permanece en `src/` con `App.css` como hoja global de layout/topbar (se eliminan de App.css las clases que migran a los modules: sidebar*, dancer*, stage, timeline*, formation-block*, resize-handle*, transition*, playhead, add-dancer-btn, add-formation-btn).
- Feedback de hover (fondo `--bg-hover` + ícono a color completo, transición suave) en todos los botones: header (Auto-Save, Import, Export, New), transporte del timeline (skip-back, play/pause, Add Audio, New Formation, zoom in/out), zoom del stage (−/+), panel de edición (Save/Delete/Cancel, shape, color) y ConfirmModal (Cancel/Confirm).
- Estilos dinámicos (saveColor, `pixelsPerSecond`, panOffset/zoom, colores del bailarín, anchos de resize) se mantienen inline, usando `var(--...)` cuando es posible.

**Not in:**
- No cambia comportamiento funcional, props ni estructura de datos.
- No se mueve `App.tsx` a una carpeta.
- No se toca `PRESET_COLORS` del sidebar (colores de bailarines = datos, no tema).
- No se añade CI ni testing.

## Data model
Sin cambios de datos. Los checks por selector de clase en `Stage.tsx` (`closest('.dancer-on-stage')`, `closest('.zoom-controls')`, línea 40) se reemplazan por atributos `data-*` porque los nombres de clase de CSS modules se hashean.

## Implementation plan
1. **Instalar `sass`** (devDependency). Verificación: `npm run dev` compila `.module.scss`.
2. **Paleta Filmora**: variables violeta en index.css + glows/overlays/wavesurfer al violeta. Verificación: la app se ve con acento violeta; audio y playhead alineados.
3. **Sidebar → components/Sidebar/** con module.scss (layout, panel de edición, hover de botones del panel). Verificación: panel abre, guarda, elimina, cambia forma/color.
4. **Stage → components/Stage/** con module.scss; cambiar `closest()` a `data-*`. Verificación: pan, zoom, selección múltiple y co-move funcionan.
5. **DancerOnStage → components/DancerOnStage/** con module.scss (posición absoluta, tamaño, cursor) + `data-dancer`. Verificación: bailarines se arrastran y animan.
6. **Timeline → components/Timeline/** con module.scss (controles, transporte, zoom, tracks, ruler, playhead) + hover. Verificación: play/seek/zoom/pan, Add Audio, New Formation.
7. **FormationBlock → components/FormationBlock/** con module.scss (block, resize-handles, transition overlay). Verificación: redimensionar duración/transición y selección.
8. **ConfirmModal → components/ConfirmModal/** con module.scss + hover. Verificación: abrir/cerrar/cancelar/confirmar.
9. **App.tsx/App.css**: limpiar App.css (quitar clases migradas), añadir clases `icon-btn` con hover a los botones del header y sustituir inline styles estáticos por clases. Verificación: hover en Auto-Save/Import/Export/New; layout intacto.
10. **QA final**: `npm run lint` con 0 problemas y `npm run build` pasan.

## Acceptance criteria
- [ ] `sass` está en devDependencies.
- [ ] `--accent-primary: #7C3AED` y `--accent-hover: #6D28D9` en `index.css`; glows/overlays/onda de audio al violeta.
- [ ] Cada componente convertido vive en `components/<Nombre>/<Nombre>.tsx` + `<Nombre>.module.scss`.
- [ ] `App.tsx` sigue en `src/` y `App.css` solo conserva layout/topbar/globales.
- [ ] Todos los botones listados cambian en hover (fondo + ícono a color completo, transición).
- [ ] `Stage.tsx` usa atributos `data-*` en `closest()`; pan, zoom, co-move y selección funcionan.
- [ ] `npm run lint` sale con 0 problemas.
- [ ] `npm run build` pasa.
- [ ] QA: playback, seek, zoom de timeline, redimensionar formaciones, panel de edición y modal siguen funcionando con la nueva paleta.

## Decisions taken and discarded
- **Sí: paleta violeta actual de Filmora (#7C3AED).** Marca actual; los neutros oscuros se mantienen.
- **Sí: convertir todos los componentes.** Consistencia; el pedido pide separar los estilos separables.
- **No: mover App.tsx a carpeta.** El usuario decidió mantenerlo en raíz con App.css global.
- **Sí: hover = fondo + color completo.** Feedback claro en todos los botones.
- **Sí: atributos `data-*` en los queries de Stage.** CSS modules hashea las clases; los selectores por clase no matchearían.
- **Sí: estilos dinámicos se quedan inline.** Dependen de estado y no tienen equivalente estático.
- **No: migrar PRESET_COLORS.** Los colores de bailarines son datos, no tema.

## Risks
| Risk | Mitigation |
| --- | --- |
| Los queries por clase en Stage (`closest('.dancer-on-stage')`) rompen con CSS modules hasheados. | Migrar a atributos `data-*` en el mismo paso que se mueve Stage (paso 4). |
| Wavesurfer no resuelve `var(--...)` para colores de onda. | Hardcodear el hex violeta en la config, alineado con la variable. |
| Regresión visual al eliminar clases de App.css. | QA visual por paso; lint/build como puerta final. |

## What is **not** in this spec
- Cambio de comportamiento o de estructura de datos.
- Migración de App.tsx a carpeta.
- Cambio de PRESET_COLORS o lógica de componentes.
