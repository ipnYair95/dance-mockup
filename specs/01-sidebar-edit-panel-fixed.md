# SPEC 01 — Panel de edición de bailarín en posición fija (sin scroll extra)

**State:** Implementado
**Date:** 2026-08-04
**Depends on:** —

## Objective
Que el panel de edición de un bailarín se renderice en `position: fixed` junto al sidebar, fuera del contenedor `.dancers-list`, de modo que abrirlo no genere scroll adicional ni desplace la lista.

## Scope
**In:**
- Reposicionar `DancerEditPanel` a `position: fixed` anclado a la derecha del sidebar (`left: 260px`, `top: 60px`), superpuesto al escenario.
- Montar el panel una sola vez en `Sidebar` (fuera de `.dancers-list`) cuando `editingId` esté definido, buscando el bailarín por `editingId`.
- Mantener interacciones: Enter guarda, Escape cancela, clic fuera cierra, botones Save/Delete/Cancel.
- Mantener el mismo aspecto (220px de ancho, fondo, borde, sombra, `zIndex: 100`).

**Not in:**
- No se modifica el scroll legítimo de `.dancers-list` con muchos bailarines.
- No se implementa seguimiento de la fila al hacer scroll.
- No se rediseña el panel ni el sidebar.
- No se tocan otros menús/popups (Settings, Import, Export).

## Data model
No introduce estructuras de datos nuevas. Solo cambia el estilo de posicionamiento y el punto de montaje del panel en `src/components/Sidebar.tsx`.

## Implementation plan
1. En `Sidebar.tsx`, mover el render de `DancerEditPanel` fuera del `dancers.map`, renderizándolo una sola vez si `editingId !== null` (obtener el dancer con `dancers.find(d => d.id === editingId)`).
2. Cambiar su estilo inline de `position: 'absolute', left: '220px', top: 0` a `position: 'fixed', left: '260px', top: '60px'` (250px sidebar + 10px margen; 50px top-bar + 10px margen).
3. Verificar que el cierre por clic fuera siga funcionando (el handler ya comprueba `panelRef.current.contains`).
4. `npm run build` y `npm run lint`.

## Acceptance criteria
- [ ] Con suficientes bailarines para que `.dancers-list` tenga scroll, abrir el panel del último bailarín no añade scroll nuevo ni desplaza la lista.
- [ ] El panel aparece superpuesto a la derecha del sidebar, totalmente visible, sin recortes.
- [ ] Con el panel abierto, hacer scroll en la lista mueve la lista pero no el panel.
- [ ] Enter guarda y cierra; Escape cancela; clic fuera cierra; los botones funcionan igual que antes.
- [ ] Al hacer clic en otro bailarín, el panel muestra los datos de ese bailarín.
- [ ] `npm run build` y `npm run lint` pasan sin errores.

## Decisions taken and discarded
- **Posición fija junto al sidebar (decidido).** `position: fixed` escapa de contenedores con `overflow`, así nunca genera scroll. Anclado a `left: 260px`, `top: 60px`.
- **No seguir la fila (decidido).** El panel queda estable mientras el usuario hace scroll; evita complejidad de clamp/reflow.
- **Superponer el escenario (decidido).** Aceptado: tapa temporalmente la esquina superior izquierda del escenario.
- **Descartado: panel absoluto dentro del sidebar.** Queda confinado al sidebar y su ancho (250px) obligaría a rediseñar el panel.
- **Descartado: modal centrado.** Desconecta visualmente el panel del sidebar y la lista.

## Risks
- Bajo: `top-bar` (50px) y ancho del sidebar (250px) están en CSS; si cambian, las coordenadas fijas se desalinean. Mitigación: definir constantes en el componente.
- Bajo: un ancestro con `transform` rompería `position: fixed`. Verificado: `.main-content` y `.app-container` no aplican transform.
