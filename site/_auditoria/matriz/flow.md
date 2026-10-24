# Matriz Flow

- implementado: 17
- no_aplicable: 3
- ya_corregido_verificado: 1

## Hecho
Botones DOM reales de pausa y liberar/acelerar sobre el canvas, foco inicial correcto en Ajustes y borrado con confirmación explícita, confirmación al descartar un circuito con cambios, textos de derrota por causa y botones Repetir/Reintentar, Revisar la fuga con tablero congelado, grilla de niveles a 3 columnas hasta 419 px con flechas que respetan la columna, salida accesible del cursor y la pieza, zoom permitido, y la dirección visual (material de tubos, juntas, flechas de puertos, HUD con cuenta de 20 px, astronauta que no tapa, movimiento reducido).
## Pendiente / decisiones
- Tono: el juego usa tuteo («Toca», «Instala») y los copys del catálogo usan voseo; se aplicaron las cadenas exactas pedidas y el resto conserva el tono existente. Unificar requiere decisión editorial.
- Cadena nueva no prevista en copys: «¿Salir del circuito?» / «Leave the circuit?» para Ver niveles / Volver al menú con cambios.
- La enumeración del borrado se amplió a «circuitos completados, estrellas y récords guardados» porque también se borran los récords (SAVE.best).
- Representación accesible del tablero completo (todas las celdas) no implementada; sólo cursor, pieza actual/próxima e instalaciones.
## Riesgos
- Los botones DOM del HUD son transparentes sobre el dibujo del canvas; si cambian LY.pause/LY.fast deben seguir sincronizados (syncHudDom en layout y render).
- RSP-LANGUAGE-TARGETS-01 no figura en el catálogo de Flow; su .seg sigue en 38 px de alto.
