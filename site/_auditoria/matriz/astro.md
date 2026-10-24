# Matriz Astro

- implementado: 16
- no_aplicable: 4
- ya_corregido_verificado: 1

## Hecho
Overlay con hidden/inert y foco gestionado (inicio, pausa, fin), diálogo de confirmación para Reiniciar/Volver al menú, Enter/Espacio respetan botones y enlaces, textos de pausa/resultado/controles según copys ES/EN, panel de sonido con estado, porcentajes y Silenciar todo, zoom permitido con touch-action sólo en el escenario, selector ES/EN de 44 px, y la dirección visual (suelo nítido, estrellas tenues en el corredor, tarjeta unificada, hito breve, llama estable con movimiento reducido).
## Pendiente / decisiones
- PLAY-ASTRO-04: el valor inicial de sonido sigue activo (arranca con la primera interacción); pasar a silencio por defecto es decisión de producto.
- Cadena nueva no prevista en los copys: «¿Reiniciar la partida?» / «Restart the game?» (confirmación de reinicio desde la pausa).
- Pausa automática al perder el foco de la ventana se conserva: al tabular fuera del documento el juego se pausa (comportamiento previo).
## Riesgos
- inert requiere navegadores modernos (Chrome 102+, Safari 15.5+, Firefox 112+); en navegadores viejos el overlay sigue oculto por display:none.
- El enlace de regreso ahora añade ?lang= para conservar idioma sin cookie; la home debe seguir aceptando ese parámetro (ya lo hace JETIdioma).
