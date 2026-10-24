# Matriz Portada

- implementado: 21
- ya_corregido_verificado: 1 (SRC-G02)
- no_aplicable: 1 (SRC-G01)

## Hecho
Pila de pantallas con rol dialog, nombre, inert del tablero y cromo, ciclo Tab y retorno de foco (pausa, ajustes, ayuda, hemeroteca, vista, intro, detalle, confirmaciones); titulares sin cortes torpes y variante compacta con mínimo de 10 px; guías de celdas sólo al editar y nombres accesibles con tamaño, fila/columna y selección; HUD con unidad, meta y referencia del jefe; sellos con causa y tabla de pares con secciones completas; tutorial sincronizado con el estado (también al deshacer/rehacer); resultado con nivel de estrellas, aporte por pieza rotulado según bossDiff, desglose siempre visible, comparación bajo demanda y acciones claras; intro con botón «Continuar»; ayuda con una sola lámina expuesta y botones de paso; chips de 44 px; Tab no se inmoviliza al colocar por teclado; confirmación al imprimir bajo la meta; contadores de piezas/celdas; textura de papel bajo el contenido; semitono por DPR y versión plana en miniaturas; franja de sellos y estados de arrastre sin halos; bootstrap de carga; borrado con confirmación; compartir con fallback.

## Pendiente / decisiones
- PLAY-PORTADA-05: la opción de simular sustituciones (diferencia neta con dos ejecuciones completas de la puntuación) sigue pendiente de decisión de producto; sólo se rotuló el valor actual de bossDiff.
- PLAY-PORTADA-06: no se ofreció «Volver a editar» porque el resultado de la edición ya queda guardado; se ofrece «Repetir esta práctica» (tutorial) y «Rehacer esta edición» (libre fallida) según la lógica existente.
- Tono: textos previos en «tú» (tutorial, ayuda); los copys del catálogo (voseo) se aplicaron tal cual y las cadenas nuevas siguen ese voseo.
- El media query de movimiento reducido ponía transition-duration .12s a todos los elementos (animaba la posición de todas las cajas en cada relayout); se dejó en 0s. Confirmar que ningún efecto dependía de ello.

## Riesgos
- La retícula del tablero ahora la dibuja el CSS a partir de --cell (antes estilo en línea); cualquier CSS que vuelva a fijar background-image en #cells la anula.
- Versiones subidas (i18n v6, art v3, ui v7, css v6): publicar juntas.
