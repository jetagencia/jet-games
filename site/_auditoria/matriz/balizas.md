# Matriz Balizas

- implementado: 21
- no_aplicable: 1
- ya_corregido_verificado: 1

## Hecho
Tutorial, valoración simulada y vuelo oficial separados y rotulados sin añadir envíos; guardia de teclas entre pantallas; mapa y miniatura con lenguaje cartográfico común; guía de controles según dispositivo; selector radial con Cancelar, safe areas y Deshacer de 5 s; Ajustes con nombres por canal y retorno contextual; cierre de práctica con resumen; viewport con zoom; estado de carga; compartir con fallback persistente; dirección visual de rocas, fondo, balizas, mapa y paneles.
## Pendiente / decisiones
- La ruta del piloto del tutorial pasa primero junto a la puerta; colocar una baliza cerca da «near_gate» (regla vigente, no alterada).
- «Alto contraste de balizas» se mantiene como estaba (no se amplió a otros elementos).
- «Saltar tutorial» sigue siendo directo (sin confirmación).
## Riesgos
- I.t ahora interpola nombres de parámetro con acentos/espacios ([\p{L}\p{N}_ ]+): cualquier texto previo con llaves literales se interpolaría si coincide con una clave.
- En escritorio #ctl está oculto: el retorno de foco del selector va al lienzo #cv (tabindex) en lugar del botón de baliza.
