# Matriz Señal

- implementado: 17
- ya_corregido_verificado: 1 (SRC-G02)
- no_aplicable: 1 (SRC-G01)

## Hecho
Modales con inert, nombre, ciclo Tab y retorno de foco (pausa, ajustes, rendirse, resultado, compartir, borrado); layout en tres zonas con la guía junto a la bandeja; pestañas de categorías en varias filas, activa siempre visible y bloqueadas con aria-disabled y requisito real; HUD «Pruebas enviadas» / «Muestras analizadas» y etiqueta «Ejemplo inicial»; estados de selección, foco y guía separados; ayuda compacta de bandeja con atajos reales (Enter, L, Esc) y nombres de acción por ranura; vocabulario muestra/regla con costo real antes de comprobar; rendirse con alertdialog previo y «Nueva práctica»; símbolos mini fieles, registro en tres columnas, ranuras con estados distinguibles, animaciones unificadas; viewport ampliable; bootstrap de carga con error recuperable; etiquetas canónicas; borrado con confirmación explícita; compartir con fallback de textarea.

## Pendiente / decisiones
- «Repetir esta señal» (COPY-senal-replay) no se añadió: no existe manejador que repita la misma señal; el CTA real es «Nueva práctica» (genera otra regla).
- Tono: el juego usa «tú» en sus textos previos; los copys del catálogo son voseo es-AR y se aplicaron tal cual. Las cadenas nuevas sin copy siguen el voseo del catálogo. Unificar el resto del juego es decisión editorial.
- El texto compartido no cambió (no estaba en el catálogo).

## Riesgos
- inert y :has no están en navegadores muy viejos; el fondo queda igualmente oculto por CSS.
- Las cadenas del bootstrap de carga están duplicadas en el HTML (ES/EN) a propósito: deben funcionar aunque falle i18n.js.
- Versiones de recursos subidas (i18n v6, piezas v3, app v8, css v6): hay que publicar los cuatro archivos juntos.
