# antes: 17 registros del catálogo, 55 copys

## [RSP-ANTES-01] P1 · active · Responsive y controles
**No secuestrar Tab para la vista temporal**
- Actual: `current_1410/antes__antes__src__main.js:1171`: cualquier Tab durante juego vivo ejecuta `e.preventDefault()` y `fijarVista(...)`; texto de atajo en `45–46` lo promueve.
- Instrucción: Eliminar ese caso global. Implementar como atajo NUEVO `]` / `[` para adelantar/retroceder vista; no describirlo como existente. Añadir su manejador, sin Ctrl/Meta/Alt, y procesarlo sólo si el foco está en `#sala` o en `body`. No usar Alt+flechas, que puede entrar en conflicto con la navegación del navegador. Añadir a la barra temporal dos botones nativos 44×44 mínimos con nombres «Ver turno anterior» / «Ver turno siguiente» y el mismo `fijarVista`; no sustituir con botones sólo de canvas. Actualizar la ayuda ES/EN para documentar el nuevo atajo y los dos botones, sin cambiar los controles de movimiento.
- Copy: 
- Aceptación: En 320/360/390/768, empezar nivel, recorrer con Tab todos los controles del HUD/acciones y volver con Shift+Tab sin avanzar el tiempo. Verificar el nuevo manejador de corchetes: sólo cambia la vista y no mueve al astronauta; fuera de #sala/body no actúa. La ayuda ES/EN muestra los nuevos atajos. Escape sigue abriendo Pausa.
- Referencias: Archivo: current_1410/antes__antes__src__main.js
Líneas: 1171
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-MODALS-01] P1 · active · Responsive y controles
**Contención, nombre y retorno de foco de superposiciones**
- Actual: **P1/P2 según acción de fondo; confianza alta en la ausencia de contención.** No confundir con un simple cambio visual de `z-index`: el fondo sigue siendo navegable si sólo se dibuja una capa encima.

| Juego | Evidencia concreta | Estado actual |
|---|---|---|
| Señal | `current_1410/senal__senal__src__app.js:975–995`, `1526–1540`; `current_1410/senal.html:85` | `abrirModal()` muestra `#velo` y enfoca un control; `cerrarModal()` vacía HTML. No guarda/restaura el activador ni aplica `inert`; no hay ciclo Tab. `role=dialog aria-modal=true` sin nombre conectado al título. |
| Telemetría | `current_1410/telemetria__telemetria__src__ui.js:186–191`, `1186–1194`; `current_1410/telemetria.html:65–68` | `abrirOv/cerrarOv` cambian `.on` y autofocus. No contención Tab ni retorno al activador; los diálogos tienen `aria-modal` pero no nombre. |
| Portada | `current_1410/portada__portada__src__ui.js:91–120`, `657–664`; `current_1410/portada__portada__src__style.css:29`; `current_1410/portada.html:179` | Las pantallas de pila se ocultan entre sí, pero `#game` no se vuelve `inert` al abrir Ajustes/Pausa/Detalle; la capa puede cubrir controles todavía tabulables. `back()` no restaura foco. |
| Caja Negra | `current_1410/cajanegra__cajanegra__src__app.js:339–346`, `903–914`, `1143`, `1372–1384`; `current_1410/cajanegra.html:38–42` | Autofocus parcial y retornos especiales para Ajustes, pero ninguna contención/inert general para las cinco `.capa`. Los diálogos declarados no tienen nombre. |
| Cráter | `current_1410/crater__crater__src__ui.js:58–61`, `294–298`; `current_1410/crater.html:135–174` | Pila y z-index correctos visualmente, pero no `inert` ni ciclo Tab. `cerrar()` retorna siempre al canvas si está en ronda, no al botón que abrió la capa. `.scr.modal` no declara rol modal. |
| Frentes | `current_1410/frentes__frentes__src__game.js:88–114`, `1184–1194` | Las capas y hojas sólo reciben `.on`. No desactivación de controles de fondo, captura de Tab ni retorno al activador. |
| Estación | `current_1410/estacion__estacion__src__ui.js:64–67`, `139–168`, `637–646`; `current_1410/estacion.html:41–42` | `screen()` apila DIVs; el inspector declara `aria-modal=true` pero no nombre. La apertura no vuelve inerte al fondo, el cierre hace `.blur()` y pierde el punto de retorno. |


- Instrucción: **Implementación precisa para cada juego:**
1. Al abrir, guardar `document.activeElement` por entrada de pila; marcar `inert=true` en la pantalla base y cualquier capa inferior. No marcar inerte un ancestro que contenga el diálogo activo.
2. Diálogo activo con `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando a su `h2/h3` de ID estable; conservar `alertdialog` sólo para una confirmación urgente. Asignar `tabindex=-1` al contenedor si no tiene controles.
3. Enfocar título o primer control útil sin condicionar a `hover:hover`/`pointer:fine`: un dispositivo táctil puede tener teclado conectado. En confirmaciones destructivas, foco inicial en Cancelar.
4. Tab y Shift+Tab recorren únicamente controles visibles/habilitados de la capa superior. Escape cierra sólo esa capa cuando sea cancelable. `aria-modal` no reemplaza `inert` ni el control de foco.
5. Al cerrar, restaurar el estado `inert` de la pila y foco al activador si sigue visible; si desapareció, enfocar el título/primer control lógico de la pantalla revelada. No usar `.blur()` como gestión de foco.


- Copy: 
- Aceptación: **Aceptación común:** en las cuatro anchuras indicadas, abrir Ajustes, Ayuda, Pausa y una confirmación/resultado con teclado. Recorrer al menos dos ciclos Tab y uno inverso: nunca aparece foco detrás ni se activa el juego. Cerrar devuelve el foco al disparador correcto. Con lector de pantalla se anuncia tipo y título del diálogo. Hacer prueba anidada (Pausa → Ajustes → cerrar → Reanudar partida).

**Excepción importante:** Antes ya tiene ciclo Tab en `current_1410/antes__antes__src__main.js:677–686`; no reemplazarlo por otro duplicado. Completar allí semántica `role/aria-modal/aria-labelledby` e `inert` del fondo, y quitar condicionamiento `!tactil` de la gestión de foco de `674–676`. Sus `.ov` HTML son DIVs sin rol.
- Referencias: Archivo: current_1410/senal__senal__src__app.js
Líneas: 975–995
Archivo: current_1410/senal.html
Líneas: 85
Archivo: current_1410/telemetria__telemetria__src__ui.js
Líneas: 186–191
Archivo: current_1410/telemetria.html
Líneas: 65–68
Archivo: current_1410/portada__portada__src__ui.js
Líneas: 91–120
Archivo: current_1410/portada__portada__src__style.css
Líneas: 29
Archivo: current_1410/portada.html
Líneas: 179
Archivo: current_1410/cajanegra__cajanegra__src__app.js
Líneas: 339–346
Archivo: current_1410/cajanegra.html
Líneas: 38–42
Archivo: current_1410/crater__crater__src__ui.js
Líneas: 58–61
Archivo: current_1410/crater.html
Líneas: 135–174
Archivo: current_1410/frentes__frentes__src__game.js
Líneas: 88–114
Archivo: current_1410/estacion__estacion__src__ui.js
Líneas: 64–67
Archivo: current_1410/estacion.html
Líneas: 41–42
Archivo: current_1410/antes__antes__src__main.js
Líneas: 677–686
- Notas: Problema identificado en fuente; HTML y JS de estos 8 juegos revalidados. Los únicos cambios de CSS de Telemetría/Caja agregan colocación del selector de idioma; no añaden gestión de foco, inert ni semántica de diálogo. Telemetría conserva visibility:hidden en su sheet cerrado; no atribuirle el defecto de Frentes.

## [RSP-NATIVE-KEYS-01] P1 · active · Responsive y controles
**No consumir Enter/Espacio de botones enfocados**
- Actual: `current_1410/antes__antes__src__main.js:1165–1169` procesa flechas, Espacio, Backspace sin comprobar destino interactivo. Espacio sobre un botón del HUD/acciones puede ejecutar «esperar» y cancelar la activación nativa.

`current_1410/crater__crater__src__ui.js:302–307` procesa Enter/Espacio cuando hay selección y sólo exceptúa otra `.plat`; sobre Pausa u otro botón no-plataforma puede aterrizar/saltar/siguiente en vez de activar el botón.
- Instrucción: Después de los atajos Escape/Pausa y antes de comandos de juego, salir si `e.target.closest('button,a[href],input,textarea,select,summary,[contenteditable=true]')`; exceptuar únicamente los controles del tablero que implementen explícitamente ese comando (`.plat` en Cráter, con su comportamiento propio). En Antes, dejar que los botones nativos activen su `click`, no duplicar órdenes de juego desde keydown. La vista temporal y canvas deben ser enfocables con instrucciones accesibles.
- Copy: 
- Aceptación: En las cuatro anchuras, enfocar cada botón de HUD/acción por Tab y activar con Enter y Espacio. Una sola acción esperada, sin movimiento/turno/aterrizaje adicional. Con foco de juego, atajos existentes siguen funcionando.
- Referencias: Archivo: current_1410/antes__antes__src__main.js
Líneas: 1165–1169
Archivo: current_1410/crater__crater__src__ui.js
Líneas: 302–307
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-AN01] P1 · active_source_finding · Texto, estados y flujo
**#pReiniciar vs #bReiniciar**
- Actual: Reiniciar nivel; Toca otra vez para borrar {n} copias
- Instrucción: La ruta de pausa pasa confirmado=true y omite el aviso del botón inferior. Unificar ambas rutas con la misma confirmación cuando hay pasos o copias. Advertir pérdida del intento actual, no de la campaña.
- Copy: ¿Reiniciar el nivel? / Se borrarán las {n} copias de este intento. / Cancelar / Reiniciar nivel
- Aceptación: Crear dos ecos y reiniciar desde HUD o pausa: misma protección. Cancelar mantiene la línea de tiempo. Confirmar reinicia sólo el nivel actual.
- Referencias: https://jetgames.fun/antes/src/main.js?v=3 —343–355,850,1212
- Notas: Inconsistencia confirmada en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [PLAY-ANTES-01] P2 · active · Prueba interactiva y propuestas
**Jerarquía visual del mapa sin cambiar las reglas**
- Actual: El nivel 1-2 ocupa una franja horizontal de unos 220 px de alto dentro de una gran área vacía. Paredes y pisos comparten tonos púrpura oscuros y celdas decorativas. La conexión entre placa y puerta sí comunica su relación.
- Instrucción: Ajustar el encuadre al mapa y agrupar el HUD y las acciones en su contorno. Diferenciar piso transitable, pared, puerta, placa y salida mediante valores de luz y bordes. Mantener exactamente la cuadrícula, las posiciones y las conexiones; no engrosar paredes sobre casillas ni crear rutas falsas. Los rótulos deben usar el identificador de la placa o puerta correspondiente.
- Copy: Placa {id}
Puerta {id} abierta
Salida
- Aceptación: Con brillo reducido se distinguen el piso y los obstáculos sin activar un modo especial. El rediseño conserva la solución y el número de pasos de los niveles probados.
- Referencias: evidence/antes-pass1-gameplay.jpg
evidence/antes-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [PLAY-ANTES-02] P2 · active · Prueba interactiva y propuestas
**Explicar reloj simulado y metas antes del resultado**
- Actual: El HUD muestra 00/16 o 00/08 y el aviso Cada paso es un segundo. El resultado cambia el denominador a 14/14 o 6/6 sin indicar que corresponde al objetivo de estrellas y no al límite del nivel.
- Instrucción: Etiquetar la línea temporal como tiempo de la copia y separar el límite del ciclo del objetivo de rendimiento. Mostrar las metas de estrellas antes de empezar y explicar que pensar no consume tiempo: sólo avanzan las acciones.
- Copy: Tiempo de esta copia: {actual}/{límite} s
Cada movimiento o espera avanza un segundo. Podés pensar sin límite.
Meta de estrellas: hasta {copias} copias y {segundos} s
- Aceptación: No se confunden el tiempo real, la duración del ciclo y la meta de estrellas. Los distintos denominadores tienen etiquetas y un significado explícito.
- Referencias: evidence/antes-pass1-gameplay.jpg
evidence/antes-pass1-result.jpg
evidence/antes-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [PLAY-ANTES-03] P2 · active · Prueba interactiva y propuestas
**Diferenciar deshacer, rebobinar y reiniciar**
- Actual: Hay tres acciones temporales visibles, pero el botón Rebobinar no explica que crea una nueva copia ni cuánto tiempo debe mantenerse R. Reiniciar está en la franja superior y las otras acciones quedan abajo.
- Instrucción: Agrupar las acciones con descripciones breves y una jerarquía que refleje su impacto. Añadir un indicador de pulsación mantenida con la duración real configurada e informar qué se conserva o elimina. Distinguir deshacer un paso, crear un eco y borrar todo el nivel.
- Copy: Deshacer un paso
Rebobinar y crear un eco
Mantené R para crear una nueva copia.
Reiniciar nivel · borrar todas las copias
- Aceptación: El jugador puede anticipar el efecto de cada control. Una pulsación breve no muestra un éxito falso; el progreso y la confirmación de la pulsación mantenida son visibles y accesibles.
- Referencias: evidence/antes-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [PLAY-ANTES-04] P2 · active · Prueba interactiva y propuestas
**Sincronizar el tiempo mostrado con la repetición**
- Actual: El modo Repetición·2× sólo ofrece Terminar. Mientras se mueve el personaje, el HUD sigue mostrando 06/08, el valor del resultado final, en lugar del instante que se reproduce.
- Instrucción: Sincronizar el cabezal y el contador con el instante de reproducción. Separar el resultado final del reloj de la repetición y añadir pausa, paso anterior, paso siguiente, reinicio y selector de velocidad. Durante la repetición, no presentar las instrucciones para mover al personaje como acciones de juego activas.
- Copy: Repetición
Pausar repetición
Paso anterior
Paso siguiente
Volver al resultado
- Aceptación: Al ver avanzar el eco de 0 a 2, el contador refleja ese instante. Pausar la reproducción no modifica la partida ni su puntuación.
- Referencias: evidence/antes-pass2-replay.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [PLAY-ANTES-05] P2 · active · Prueba interactiva y propuestas
**Estrellas y bloqueos correctos en capítulos**
- Actual: El árbol de accesibilidad anuncia ★★★ tanto para los niveles ganados como para 1-3, sin jugar, y 1-4, bloqueado. Visualmente, las estrellas vacías y las tarjetas bloqueadas tienen contraste mínimo.
- Instrucción: Dar a cada nivel un nombre accesible con las estrellas obtenidas y posibles, el estado disponible o bloqueado y su requisito. No incluir tres estrellas literales como si todas se hubieran ganado. Mantener legibles el número y el título de los niveles bloqueados; el candado y el texto comunican el bloqueo.
- Copy: Nivel {n}: {nombre}. {estrellas} de 3 estrellas.
Disponible
Bloqueado: completá el nivel anterior.
- Aceptación: En el estado observado, el lector anuncia 0/3 para 1-3 y 3/3 para 1-2. Visualmente se distingue disponible de completado sin depender sólo del brillo.
- Referencias: evidence/antes-chapters.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [PLAY-ANTES-06] P2 · active · Prueba interactiva y propuestas
**Nombres accesibles de ajustes y estado del tablero**
- Actual: Ajustes expone casillas de verificación sin nombre y dos controles deslizantes Volumen indistinguibles. El árbol de accesibilidad del juego informa reloj y copia, pero no ofrece casillas, jugador, placa o puerta como un tablero navegable. Tras deshacer, el anuncio del estado anterior seguía diciendo Segundo 2/puerta abierta mientras el reloj pasó a 1.
- Instrucción: Asociar etiquetas a cada ajuste y a cada control de volumen. Añadir una representación accesible del mapa y actualizar los mensajes también al deshacer. Incluir posición, copia, estado de puerta y placa, y movimiento bloqueado; no anunciar sólo incrementos. El identificador y el estado de la puerta deben proceder del tablero vigente.
- Copy: Volumen de música
Volumen de efectos
Vista previa de ecos
Paso deshecho. Segundo {n}. Puerta {puerta} {estado}.
- Aceptación: Los ajustes se entienden sin ver la pantalla. Después de deshacer se anuncia el estado vigente, no el anterior. Con teclado se pueden consultar el entorno y los objetivos.
- Referencias: evidence/antes-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:13:00Z/2026-10-22T15:19:00Z

## [RSP-ANTES-02] P2 · active · Responsive y controles
**Etiquetar y diferenciar los ajustes**
- Actual: `current_1410/antes.html:161–174`: etiquetas hermanas sin `for`, botones `.tog` vacíos. `current_1410/antes__antes__src__main.js:1085–1094` sólo actualiza `aria-pressed`; ambos sliders reciben el mismo nombre genérico `set.volume`.
- Instrucción: Dar ID estable al texto de cada fila y `aria-labelledby` al toggle; en música/efectos dar nombres distintos a sliders («Volumen de música», «Volumen de efectos») y a toggles («Música», «Efectos»). Mantener botones toggle con `aria-pressed` o migrar todos a `role=switch/aria-checked`, sin mezclar estados. Asociar texto de desbloqueo `#lkAurora/#lkTrail/#lkLargo` con `aria-describedby`. En `#segLang` y `#segVel` actualizar `aria-pressed` además de `.on`.
- Copy: 
- Aceptación: Lector anuncia nombre, estado y, si procede, requisito de estrellas de cada control. No quedan botones sin nombre; volumen de música y de efectos se distinguen. El foco permanece visible durante cambios de idioma.
- Referencias: Archivo: current_1410/antes.html
Líneas: 161–174
Archivo: current_1410/antes__antes__src__main.js
Líneas: 1085–1094
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [RSP-GLOBAL-01] P2 · active · Responsive y controles
**Permitir ampliar la interfaz, sin romper los controles de juego**
- Actual: P2 · confianza alta · confirmado por fuente. `meta[name=viewport]`, línea 5 (Match: línea 83 en la versión canónica actual) de `current_1410/antes.html`, `current_1410/astro.html`, `current_1410/balizas.html`, `current_1410/bestiario.html`, `current_1410/cajanegra.html`, `current_1410/crater.html`, `current_1410/estacion.html`, `current_1410/frentes.html`, `current_1410/jetball.html`, `current_1410/jetbox.html`, `current_1410/jetflow_canonical.html`, `current_1410/jetmatch_canonical.html`, `current_1410/jetrocket_canonical.html`, `current_1410/jetslalom_canonical.html`, `current_1410/jetwords_canonical.html`, `current_1410/portada.html`, `current_1410/raid.html`, `current_1410/salchidrez.html`, `current_1410/senal.html`, `current_1410/telemetria.html`: contienen `maximum-scale=1` y `user-scalable=no`. **No aplicarlo a Jump/Escudos: ya permiten zoom en meta.**
- Instrucción: Eliminar solamente `maximum-scale` y `user-scalable`; conservar `width=device-width, initial-scale=1, viewport-fit=cover` y `interactive-widget=resizes-content` de Estación. No bloquear `gesturestart`/doble clic a nivel documento. En Box, eliminar los bloqueos globales de `gesturestart`/`dblclick` (`current_1410/jetbox.html:924–925`) y mover `touch-action:none` de `html,body` (66) a `#stage,#dpad`. En Astro, mover `touch-action:none` de `html,body` (72–76) a la superficie de juego. En Telemetría, retirar también el bloqueo global de `gesturestart` en `current_1410/telemetria__telemetria__src__ui.js:1182`, limitándolo, si fuera imprescindible, a un gesto activo del canvas. Los paneles desplazables deben usar `touch-action:pan-y pinch-zoom`; botones, `manipulation`. Mantener control de puntero sólo sobre el lienzo/pad.
- Copy: 
- Aceptación: Se puede ampliar Ayuda/Ajustes al 200 % y leer/activar todo mediante scroll; el desplazamiento por el panel no salta/dispara en el juego; arrastrar el juego sigue sin mover la página. No asumir que eliminar sólo meta resuelve los bloqueos CSS/JS.
- Referencias: Archivo: current_1410/antes.html
Líneas: 
Archivo: current_1410/astro.html
Líneas: 
Archivo: current_1410/balizas.html
Líneas: 
Archivo: current_1410/bestiario.html
Líneas: 
Archivo: current_1410/cajanegra.html
Líneas: 
Archivo: current_1410/crater.html
Líneas: 
Archivo: current_1410/estacion.html
Líneas: 
Archivo: current_1410/frentes.html
Líneas: 
Archivo: current_1410/jetball.html
Líneas: 
Archivo: current_1410/jetbox.html
Líneas: 
Archivo: current_1410/jetflow_canonical.html
Líneas: 
Archivo: current_1410/jetmatch_canonical.html
Líneas: 
Archivo: current_1410/jetrocket_canonical.html
Líneas: 
Archivo: current_1410/jetslalom_canonical.html
Líneas: 
Archivo: current_1410/jetwords_canonical.html
Líneas: 
Archivo: current_1410/portada.html
Líneas: 
Archivo: current_1410/raid.html
Líneas: 
Archivo: current_1410/salchidrez.html
Líneas: 
Archivo: current_1410/senal.html
Líneas: 
Archivo: current_1410/telemetria.html
Líneas: 
Archivo: current_1410/jetbox.html
Líneas: 924–925
Archivo: current_1410/telemetria__telemetria__src__ui.js
Líneas: 1182
Archivo: current_1410/jetbox.html
Líneas: 66,924–925
Archivo: current_1410/astro.html
Líneas: 72–76
Archivo: current_1410/jetball.html
Líneas: 5
Archivo: current_1410/astro.html
Líneas: 5
Archivo: current_1410/jetrocket_canonical.html
Líneas: 5
Archivo: current_1410/jetslalom_canonical.html
Líneas: 5
Archivo: current_1410/jetflow_canonical.html
Líneas: 5
Archivo: current_1410/jetmatch_canonical.html
Líneas: 83
Archivo: current_1410/jetwords_canonical.html
Líneas: 5
Archivo: current_1410/jetbox.html
Líneas: 5
Archivo: current_1410/salchidrez.html
Líneas: 5
Archivo: current_1410/senal.html
Líneas: 5
Archivo: current_1410/antes.html
Líneas: 5
Archivo: current_1410/telemetria.html
Líneas: 5
Archivo: current_1410/portada.html
Líneas: 5
Archivo: current_1410/cajanegra.html
Líneas: 5
Archivo: current_1410/crater.html
Líneas: 5
Archivo: current_1410/frentes.html
Líneas: 5
Archivo: current_1410/balizas.html
Líneas: 5
Archivo: current_1410/estacion.html
Líneas: 5
Archivo: current_1410/raid.html
Líneas: 5
Archivo: current_1410/bestiario.html
Líneas: 5
- Notas: Problema identificado en fuente; la lógica/regla citada persiste; las pruebas de tamaños de ventana y tecnologías de asistencia siguen pendientes.

## [SRC-AN02] P2 · active_source_finding · Texto, estados y flujo
**Resultados y reproducción**
- Actual: Siguiente; Otra vez; Repetición; Terminar; Segundo {t} de {N}
- Instrucción: Mantener segundos si son la unidad real de la mecánica y explicar Cada acción avanza 1 s; Paso es alternativa editorial a validar, no reemplazo obligatorio de una unidad física. Distinguir ver repetición de volver a jugar.
- Copy: Siguiente nivel; Repetir nivel; Ver repetición; Salir de la repetición; Paso {t} de {N}
- Aceptación: Ver repetición no cambia récord ni progreso. Salir de la repetición vuelve al resultado. Siguiente nivel no repite el actual. Esperar se entiende como una acción.
- Referencias: https://jetgames.fun/antes/src/textos.js — es.btn.next/again/replay/stopReplay y hud.second
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-ANTES-01] P2 · active_proposal · Dirección visual interna
**Graduar el detalle del suelo para que los mecanismos dominen**
- Actual: V.ajustar limita cs entre 14 y 96. El suelo #120a26 tiene juntas #1c1238, remaches y patrones por capítulo; paredes degradadas #271c4b/#1d1539 con frente de .14cs y sombra sobre el suelo.
- Instrucción: En cs<24 omitir remaches y patrones interiores del suelo; usar sólo una junta 1 px alpha .10. Mantener el volumen del muro y la sombra de contacto, pero limitarla a .2cs para no oscurecer casi media casilla. En cs>=24 mantener los detalles con luminosidad por debajo de placas/cables. El exterior de la sala continúa casi negro; no añadir estrellas dentro de casillas transitables para diferenciar capítulos.
- Copy: 
- Aceptación: En salas densas y giradas se identifica primero camino/muro/puerta y después decoración. Las mismas coordenadas de entrada siguen seleccionando la misma casilla. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/antes__antes__src__render.js
lines: 33–42,79–89,108–134
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Conservar mapa, rotación de pantalla, esMuro, vacío y emisores. No modificar V.celdaDePixel ni encoger la geometría para que parezca caber mejor.

## [VIS-ANTES-02] P2 · active_proposal · Dirección visual interna
**Ecos legibles y numerados sin convertirlos en actores sólidos**
- Actual: astroEco() tiñe al 45%, dibuja al 55% (70% en alto contraste), añade scanlines cada4 px y número en círculo de radio max(6,.14cs). Los ecos en movimiento dejan3 imágenes con alpha .15/.10/.05.
- Instrucción: Conservar transparencia y numeración. Para cs<28 quitar scanlines y limitar estela a una sola silueta alpha .10; para cs>=28 permitir dos, nunca tres. Dar al círculo numérico borde oscuro 1 px; conservar número #050108 sobre cian/amarillo y usar marfil sólo sobre los tonos oscuros cuando la medición confirme contraste de al menos 4.5:1; mantener diámetro mínimo 12 px y aumentar a 14–18 px sólo cuando cs>=32. Dibujar la insignia después de todas las siluetas para que no quede semitapada por otra copia, sin cambiar orden de profundidad del cuerpo. El astronauta actual conserva aspecto sólido y no recibe número de eco.
- Copy: 
- Aceptación: Con 2,4 y 6 copias, cada eco puede asociarse a su registro aun cuando dos se cruzan. Con movimiento reducido no hay estelas/scanlines, pero cuerpos y números siguen presentes. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/antes__antes__src__render.js
lines: 239–248,267–292
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No reasignar IDs ni colores COLOR_ECO/COLOR_AURORA; conservar patrones del modo alto contraste. No ocultar ecos que realmente ocupan una celda.

## [VIS-ANTES-03] P2 · active_proposal · Dirección visual interna
**Cables y placas como circuito causal, no halo continuo**
- Actual: Los cables se derivan de placas/destinos y se dibujan alpha .16 apagados,.65 encendidos; activos usan blur.3cs y guion animado. Placas conservan forma por k, relleno .32 y glow.5cs si activas.
- Instrucción: Mantener las cuatro parejas color/forma. Cable apagado: línea 1.5 px alpha .25; activo: línea 2 px del color correspondiente con un pequeño pulso viajero sólo durante 250 ms después de cambiar estado. Reducir halo activo a min(6,.15cs). Placa activa mantiene relleno y forma llena; inactiva, forma de contorno. Conservar explícitamente rayas amarillo/negro de las placas pesadas; no aplicarles el tratamiento de peligro rojo reservado al láser. En cruces, usar un puente visual pequeño sólo si los cables no están conectados lógicamente.
- Copy: 
- Aceptación: Activar una placa ilumina únicamente sus conexiones existentes. La puerta correspondiente sigue su estado real y la placa pesada se reconoce sin color. El circuito se entiende con animación detenida. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/antes__antes__src__render.js
lines: 105–107,137–160,188–191,295–308
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: Las conexiones se obtienen de calcularCables; no unir cables por proximidad, inventar circuitos o mostrar información futura que el estado aún no habilita.

## [VIS-ANTES-04] P2 · active_proposal · Dirección visual interna
**Distinguir el tiempo actual de la inspección de otro turno**
- Actual: dibujarLinea() usa filas de ecos hasta 7 px, pasado alpha .14, cursor actual blanco 2 px con triángulo inferior y cursor de vista cian 2 px con círculo. La sala inspeccionada lleva marco dashed[8,6] animado.
- Instrucción: Mantener la posición temporal exacta. Añadir junto al cursor actual una etiqueta pequeña Ahora/Now y al de inspección Vista/View, con fondo oscuro y tamaño 11 px; cuando coinciden, mostrar una sola etiqueta compuesta y no dos textos superpuestos. Mantener triángulo/círculo como diferencia de forma. Dar al marco de sala inspeccionada guiones estáticos y rótulo fuera de la sala, en vez de movimiento continuo; durante rebobinado conservar el tinte breve pero no scanlines en movimiento reducido. Evitar etiquetar cada tick si no hay espacio: sólo 0, múltiplos de 5 y final cuando quepan.
- Copy: 
- Aceptación: Antes de hacer una acción se puede saber si se mira Ahora o una Vista previa. Arrastrar al turno actual fusiona etiquetas; salir de inspección quita el marco sin modificar el estado del nivel. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/antes__antes__src__main.js
lines: 411–443
file: ui_audit/source_review/current_1410/antes__antes__src__render.js
lines: 256–263
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No convertir inspección en movimiento ni alterar J.cur/J.vistaT, pasado/futuro o reglas de rebobinado. Estos rótulos son propuesta nueva de presentación.

# Copys ES/EN aplicables
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-sound-on [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido activado» | en: «Sound on» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-sound-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Sonido desactivado» | en: «Sound off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-mute [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Silenciar todo» | en: «Mute all» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Música» | en: «Music» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Efectos» | en: «Sound effects» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de música» | en: «Music volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-volume [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01, PLAY-ANTES-06, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Volumen de efectos» | en: «Sound effects volume» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-music-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Música desactivada» | en: «Music off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-effects-off [PLAY-ASTRO-04, PLAY-SALCHI-05, RSP-AUDIO-01, RSP-ANTES-02, RSP-BALIZAS-01] es-AR: «Efectos desactivados» | en: «Sound effects off» | contexto: Nombre/estado coherentes con el control real. Esta propuesta no prueba reproducción audible ni cambia sola la preferencia inicial. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-restart-title [SRC-AN01] es-AR: «¿Reiniciar el nivel?» | en: «Restart the level?» | contexto: Misma protección desde pausa y botón inferior cuando hubo pasos/copias; no sugerir pérdida de campaña. Singular si n=1; si hay pasos pero 0 copias, no usar borrado de copias como única advertencia. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-restart-copies [SRC-AN01] es-AR: «Se borrarán las {n} copias de este intento.» | en: «The {n} copies from this attempt will be deleted.» | contexto: Misma protección desde pausa y botón inferior cuando hubo pasos/copias; no sugerir pérdida de campaña. Singular si n=1; si hay pasos pero 0 copias, no usar borrado de copias como única advertencia. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-restart-one [SRC-AN01] es-AR: «Se borrará la copia de este intento.» | en: «The copy from this attempt will be deleted.» | contexto: Misma protección desde pausa y botón inferior cuando hubo pasos/copias; no sugerir pérdida de campaña. Singular si n=1; si hay pasos pero 0 copias, no usar borrado de copias como única advertencia. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-restart [SRC-AN01] es-AR: «Reiniciar nivel» | en: «Restart level» | contexto: Misma protección desde pausa y botón inferior cuando hubo pasos/copias; no sugerir pérdida de campaña. Singular si n=1; si hay pasos pero 0 copias, no usar borrado de copias como única advertencia. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-restart-attempt [SRC-AN01] es-AR: «Vas a perder el avance de este intento.» | en: «You’ll lose your progress in this attempt.» | contexto: Advertencia para intento con pasos, sin afirmar borrado de campaña ni copias inexistentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-next [SRC-AN02, RSP-ANTES-01] es-AR: «Siguiente nivel» | en: «Next level» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay [SRC-AN02, RSP-ANTES-01] es-AR: «Repetir nivel» | en: «Replay level» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-watch-replay [SRC-AN02, RSP-ANTES-01] es-AR: «Ver repetición» | en: «Watch replay» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-exit-replay [SRC-AN02, RSP-ANTES-01] es-AR: «Salir de la repetición» | en: «Exit replay» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-time-position [SRC-AN02, RSP-ANTES-01] es-AR: «Segundo {t} de {N}» | en: «Second {t} of {N}» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 't', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'N', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-time-rule [SRC-AN02, RSP-ANTES-01] es-AR: «Cada acción avanza 1 s.» | en: «Each action advances time by 1 s.» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-prev-turn [SRC-AN02, RSP-ANTES-01] es-AR: «Ver turno anterior» | en: «View previous turn» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-next-turn [SRC-AN02, RSP-ANTES-01] es-AR: «Ver turno siguiente» | en: «View next turn» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-time-controls [SRC-AN02, RSP-ANTES-01] es-AR: «Ver turno anterior: [. Ver turno siguiente: ]. También podés usar los botones de la barra temporal.» | en: «View previous turn: [. View next turn: ]. You can also use the buttons on the timeline.» | contexto: Conservar segundos porque son unidad mecánica real; Paso es alternativa NO adoptada. Corchetes son atajo NUEVO propuesto: mostrar ayuda sólo tras implementar scope de foco; nunca secuestrar Tab. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-plate [PLAY-ANTES-01] es-AR: «Placa {placa}» | en: «Plate {placa}» | contexto: Nombre/identificador de placa o puerta desde nivel real; A observado no se fija para todas las relaciones. No alterar geometría, conexiones ni saliencia jugable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'placa', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-open-door [PLAY-ANTES-01] es-AR: «Puerta {puerta} abierta» | en: «Door {puerta} open» | contexto: Nombre/identificador de placa o puerta desde nivel real; A observado no se fija para todas las relaciones. No alterar geometría, conexiones ni saliencia jugable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'puerta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-exit [PLAY-ANTES-01] es-AR: «Salida» | en: «Exit» | contexto: Nombre/identificador de placa o puerta desde nivel real; A observado no se fija para todas las relaciones. No alterar geometría, conexiones ni saliencia jugable. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-copy-time [PLAY-ANTES-02] es-AR: «Tiempo de esta copia: {actual}/{límite} s» | en: «Time for this copy: {actual}/{límite} s» | contexto: Distinguir límite de ciclo, tiempo de copia y meta de estrellas; usar valores reales. La versión singular sólo cuando copias=1. No fijar 8/16/6/14 de sesiones observadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'actual', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'límite', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-think-time [PLAY-ANTES-02] es-AR: «Cada movimiento o espera avanza un segundo. Podés pensar sin límite.» | en: «Each move or wait advances time by one second. You can take as long as you need to think.» | contexto: Distinguir límite de ciclo, tiempo de copia y meta de estrellas; usar valores reales. La versión singular sólo cuando copias=1. No fijar 8/16/6/14 de sesiones observadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-star-target [PLAY-ANTES-02] es-AR: «Meta de estrellas: hasta {copias} copias y {segundos} s» | en: «Star target: up to {copias} copies and {segundos} s» | contexto: Distinguir límite de ciclo, tiempo de copia y meta de estrellas; usar valores reales. La versión singular sólo cuando copias=1. No fijar 8/16/6/14 de sesiones observadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'copias', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'segundos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-one-star-copy [PLAY-ANTES-02] es-AR: «Meta de estrellas: hasta 1 copia y {segundos} s» | en: «Star target: up to 1 copy and {segundos} s» | contexto: Distinguir límite de ciclo, tiempo de copia y meta de estrellas; usar valores reales. La versión singular sólo cuando copias=1. No fijar 8/16/6/14 de sesiones observadas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'segundos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-undo-step [PLAY-ANTES-03] es-AR: «Deshacer un paso» | en: «Undo one step» | contexto: Duración real configurada del hold, sin inventar umbral. Reinicio conserva confirmación SRC-AN01; deshacer y rebobinar son acciones diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-rewind-echo [PLAY-ANTES-03] es-AR: «Rebobinar y crear un eco» | en: «Rewind and create an echo» | contexto: Duración real configurada del hold, sin inventar umbral. Reinicio conserva confirmación SRC-AN01; deshacer y rebobinar son acciones diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-hold-rewind [PLAY-ANTES-03] es-AR: «Mantené R para crear una nueva copia.» | en: «Hold R to create a new copy.» | contexto: Duración real configurada del hold, sin inventar umbral. Reinicio conserva confirmación SRC-AN01; deshacer y rebobinar son acciones diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-rewind-duration [PLAY-ANTES-03] es-AR: «Mantené R durante {duración} s.» | en: «Hold R for {duración} s.» | contexto: Duración real configurada del hold, sin inventar umbral. Reinicio conserva confirmación SRC-AN01; deshacer y rebobinar son acciones diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'duración', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-restart-all [PLAY-ANTES-03] es-AR: «Reiniciar nivel · borrar todas las copias» | en: «Restart level · delete all copies» | contexto: Duración real configurada del hold, sin inventar umbral. Reinicio conserva confirmación SRC-AN01; deshacer y rebobinar son acciones diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay-title [PLAY-ANTES-04] es-AR: «Repetición» | en: «Replay» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-pause-replay [PLAY-ANTES-04] es-AR: «Pausar repetición» | en: «Pause replay» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-resume-replay [PLAY-ANTES-04] es-AR: «Reanudar repetición» | en: «Resume replay» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay-prev [PLAY-ANTES-04] es-AR: «Paso anterior» | en: «Previous step» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay-next [PLAY-ANTES-04] es-AR: «Paso siguiente» | en: «Next step» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-restart-replay [PLAY-ANTES-04] es-AR: «Reiniciar repetición» | en: «Restart replay» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay-speed [PLAY-ANTES-04] es-AR: «Velocidad de repetición» | en: «Replay speed» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-replay-rate [PLAY-ANTES-04] es-AR: «{velocidad}×» | en: «{velocidad}×» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'velocidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-back-result [PLAY-ANTES-04] es-AR: «Volver al resultado» | en: «Back to results» | contexto: Controles NUEVOS propuestos para reproducción; conectar sólo tras implementar acciones y sincronizar contador con cabezal. No reiniciar nivel ni modificar resultado al reiniciar repetición. Opciones de velocidad según configuración real, no lista inventada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-level-status [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «Nivel {n}: {nombre}. {estrellas} de 3 estrellas.» | en: «Level {n}: {nombre}. {estrellas} of 3 stars.» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'nombre', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'estrellas', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-available [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «Disponible» | en: «Available» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-locked [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «Bloqueado: completá el nivel anterior.» | en: «Locked: complete the previous level.» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-echo-preview [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «Vista previa de ecos» | en: «Echo preview» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-undo-status [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «Paso deshecho. Segundo {n}. Puerta {puerta} {estado}.» | en: «Step undone. Second {n}. Door {puerta} {estado}.» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'puerta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'estado', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-antes-door-open [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «abierta» | en: «open» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-door-closed [PLAY-ANTES-05, PLAY-ANTES-06] es-AR: «cerrada» | en: «closed» | contexto: Estrellas obtenidas reales, no tres iconos interpretados como ganadas. Identificador puerta dinámico conserva A/B reales; estado después de deshacer, no aviso anterior. Actualizar sliders con cadenas common-music-volume/common-effects-volume. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-antes-time-now [VIS-ANTES-04] es-AR: «Ahora» | en: «Now» | contexto: Ahora identifica el cursor del tiempo actual J.cur; Vista el de inspección J.vistaT. Si coinciden en el mismo turno, usar una sola etiqueta compuesta. No convertir inspección en movimiento ni alterar pasado/futuro/cronología. | condición: Etiquetas sólo para los cursores/estado reales. Vista también puede rotular el marco de la sala inspeccionada fuera de su área jugable; al salir de inspección se retira. No afirmar un turno nuevo ni resolver el nivel al mover la vista. | params: [] | citas actuales: []
- COPY-antes-time-view [VIS-ANTES-04] es-AR: «Vista» | en: «View» | contexto: Ahora identifica el cursor del tiempo actual J.cur; Vista el de inspección J.vistaT. Si coinciden en el mismo turno, usar una sola etiqueta compuesta. No convertir inspección en movimiento ni alterar pasado/futuro/cronología. | condición: Etiquetas sólo para los cursores/estado reales. Vista también puede rotular el marco de la sala inspeccionada fuera de su área jugable; al salir de inspección se retira. No afirmar un turno nuevo ni resolver el nivel al mover la vista. | params: [] | citas actuales: []
- COPY-antes-time-now-view [VIS-ANTES-04] es-AR: «Ahora · Vista» | en: «Now · View» | contexto: Ahora identifica el cursor del tiempo actual J.cur; Vista el de inspección J.vistaT. Si coinciden en el mismo turno, usar una sola etiqueta compuesta. No convertir inspección en movimiento ni alterar pasado/futuro/cronología. | condición: Etiquetas sólo para los cursores/estado reales. Vista también puede rotular el marco de la sala inspeccionada fuera de su área jugable; al salir de inspección se retira. No afirmar un turno nuevo ni resolver el nivel al mover la vista. | params: [] | citas actuales: []
