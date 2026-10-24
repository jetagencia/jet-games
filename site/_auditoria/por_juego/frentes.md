# frentes: 16 registros del catálogo, 58 copys

## [RSP-FRENTES-01] P1 · active · Responsive y controles
**Las hojas cerradas siguen siendo enfocables fuera de pantalla**
- Actual: `current_1410/frentes__frentes__src__ui.css:366–369`: `.sheet` se oculta sólo con `transform:translate(-50%,105%)`, no con `visibility`, `hidden` o `inert`; `current_1410/frentes.html:181–196` contiene botones operativos (incluido `#bCfGo`) en esas hojas. `current_1410/frentes__frentes__src__game.js:109–114` sólo alterna `.on`.
- Instrucción: Inicializar `#shConfirm/#shKeypad/#shMsg` con `hidden inert`. Abrir: retirar `hidden`, mantener posición inicial un frame, quitar `inert`, añadir `.on`, activar protocolo modal RSP-MODALS-01. Cerrar: poner `inert` inmediatamente, retirar `.on`, y poner `hidden` al terminar transición (con fallback si movimiento reducido); volver al activador. Conservar la regla `[hidden]{display:none!important}` que ya existe en `ui.css:11`. Si no se conserva animación, usar simplemente `hidden` al abrir/cerrar y evitar temporizadores. El fondo `#sheetBg` no debe estar en Tab.
- Copy: 
- Aceptación: Antes de abrir cualquier hoja, recorrido Tab nunca entra en `#bCfGo/#bCfNo/#bKpNo/#bKpOk`. Con hoja abierta sólo sus controles son alcanzables; cerrar con Escape no deja foco invisible. Probar en 320/360/390/768 y reduced-motion.
- Referencias: Archivo: current_1410/frentes__frentes__src__ui.css
Líneas: 366–369
Archivo: current_1410/frentes.html
Líneas: 181–196
Archivo: current_1410/frentes__frentes__src__game.js
Líneas: 109–114
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

## [VIS-FRENTES-03] P1 · active_proposal · Dirección visual interna
**Asignación de flota: columnas de precisión, no barras luminosas ambiguas**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .lcol, .lfill, .lfill::after, .lmark, .lnum, .lpm, .resv-bar
Estado identificado en la revisión: .lcol width min(64%,74px), radio 12; .lfill gradiente violeta→cian y halo 18 px; segmentos repetidos var(--seg); lmark rival rojo dashed 2 px; lnum 24 px, peso 800; reserva segmentada 1%.
- Instrucción: Columna: base #101A27, borde 1 px #3C5067, radio 8 px. Relleno usar degradado corto #1AA899→#58D8C5 (no cambia significado de cantidad) sin shadowBlur; línea superior 1 px #BCFFF3 para precisión. Segmentos conservar exactamente var(--seg), trazo 1 px negro .22. Rival conserva línea roja discontinua y umbral exacto. Número de 24 px y peso 700 tabular-nums, fondo #1C2C3E, borde 1 px #4D657E; selección borde cian 2 px sin desplazar geometría. Botones ±44 px conservados con iconos 22 px, radio 8 y área visual clara. Reserva usar barra sólida con mismas divisiones reales, no inventar divisiones por 10 si 1% tiene significado; cifra principal siempre visible. Estado cero no reducir opacidad del texto, mantener señal existente.
- Copy: 
- Aceptación: Barra pixel-height equivale al mismo valor al inicio/mitad/máximo y reserva 0.
Al drag, cifra y barra coinciden en el mismo frame; no atraso>100 ms.
Foco/teclado/hover/botón mantenido/dragdrop conservan contraste y el estado locked/battle no parece editable.
- Referencias: ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .lcol, .lfill, .lfill::after, .lmark, .lnum, .lpm, .resv-bar
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No alterar heights calculadas, cantidades, escalas, drag/reserve constraints, umbral rival ni feedback de sobreasignación. No usar easing que haga parecer otro número después de input.

## [PLAY-FRENTES-01] P2 · active · Prueba interactiva y propuestas
**Evitar que una partida nueva herede la pausa de la anterior**
- Actual: Tutorial ganado → Pausa → Salir al inicio → Entrenamiento → Ronda rápida permite repartir, pero Lanzar flota queda en Toca para acelerar durante más de 40 segundos; Acelerar no funciona. Pausa → Continuar permite recuperar la animación y llegar al resultado. Una revisión de fuentes aparte vincula el fallo con G.paused, que no se limpia al cambiar de partida.
- Instrucción: Cerrar explícitamente el estado de pausa al abandonar una partida y establecer un estado coherente al iniciar otra. Revisar las rutas de tutorial, ronda rápida, duelo, academia, diario y análisis: retirar la superposición no equivale a reanudar, y una partida nueva no debe heredar G.paused de la anterior. Mantener la pausa real mientras su modal esté abierto; no reanudar una batalla detrás de él. Proteger la transición y ofrecer «Ver resultado» sólo si el resultado ya está calculado, sin depender del reloj de la animación ni modificar la evaluación. No forzar resultados mediante un timeout, cambiar la flota o atribuir este fallo a la red. La acción de reanudar debe rotularse «Reanudar partida».
- Copy: Ver resultado
La animación está pausada.
Reanudar partida
- Aceptación: Repetir la secuencia observada: tutorial terminado → pausa → salida al menú → entrenamiento → ronda rápida → lanzamiento. La batalla termina sin requerir otra pausa y reanudación. Una ronda visible nueva no hereda G.paused=true. Pausar una batalla en curso la detiene y reanudarla la continúa; acelerar sólo cambia la velocidad. Cubrir las demás rutas de salida e inicio sin enviar jugadas diarias a producción para probar esta regresión.
- Referencias: evidence/frentes-pass2-stalled.jpg
evidence/frentes-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z
Fallo recuperable: Pausa → Continuar permitió llegar al resultado; no se observó un bloqueo permanente. La bandera no se inspeccionó directamente en el navegador. La revisión de la fuente guardada documenta la causa y la recuperación en source_review/network_1531/FRENTES_PAUSE_STATE.md: pauseGame activa G.paused; goHome y startQuick cierran las superposiciones sin limpiarla; battleStep retorna mientras esa bandera esté activa; resumeGame la limpia. Ronda rápida entrega un resultado local, sin esperar una API. «La animación está pausada» sólo describe una pausa real; no sustituye la corrección del estado residual.

## [PLAY-FRENTES-02] P2 · active · Prueba interactiva y propuestas
**Final del tutorial con acciones correctas**
- Actual: Tras ¡Ganaste! en el tutorial 3/3, siguen visibles Lanzar flota y Saltar tutorial, además de Ir al frente de hoy. No hay un retorno directo al inicio sin abrir la pausa.
- Instrucción: Convertir la pantalla en un estado de tutorial completado. Desactivar las acciones de despliegue ya concluido y retirar «Saltar tutorial». Ofrecer destinos explícitos y separados: menú, práctica y frente diario. No exigir una visita al modo diario para considerar aprendido el tutorial ni publicar una jugada como efecto de abrir ese destino.
- Copy: Tutorial completado
Practicar una ronda
Volver al menú
Ver el frente de hoy
- Aceptación: Al completar el tutorial no se puede relanzar la flota por accidente ni aparece «Saltar tutorial». La práctica y el regreso al menú quedan disponibles sin entrar al modo diario.
- Referencias: evidence/frentes-pass1-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z

## [PLAY-FRENTES-03] P2 · active · Prueba interactiva y propuestas
**Explicar y hacer precisos los controles de reparto**
- Actual: Hacer clic en una barra sólo selecciona el planeta; arrastrarla modifica la cantidad. Sin embargo, el tutorial dice Pon más naves sin explicar el gesto. Las barras largas no tienen escala y los controles +/− dibujados no aparecen como botones en el árbol de accesibilidad, que sólo expone un slider por planeta.
- Instrucción: Mostrar una indicación inicial de arrastre y ofrecer las alternativas +/− y teclado. Añadir una entrada numérica accesible por planeta, con sus límites y la reserva visibles. Conservar la suma total de naves y la política vigente de redistribución; explicar qué sucede al añadir cuando no queda reserva, sin cambiar esa política. Exponer los controles y sus valores con nombres que incluyan el planeta.
- Copy: Arrastrá hacia arriba para sumar naves.
Naves en {planeta}
Sumar una nave a {planeta}
Quitar una nave de {planeta}
Asignar la reserva a {planeta}
- Aceptación: Se puede preparar un reparto exacto mediante teclado o entrada numérica sin repetir una gran cantidad de pulsaciones ni aprender el arrastre por ensayo. El lector anuncia la reserva, los límites y la cantidad asignada a cada planeta.
- Referencias: evidence/frentes-pass1-gameplay.jpg
evidence/frentes-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z

## [PLAY-FRENTES-04] P2 · active · Prueba interactiva y propuestas
**Dar escala y leyenda a tablero y estadísticas**
- Actual: Ronda rápida muestra columnas MEDIA/VACÍO sin unidad ni explicación, líneas rojas discontinuas y barras con bandas decorativas sin graduación. El resultado añade histogramas sin ejes; los puntos y los nombres de los planetas son pequeños en comparación con las áreas vacías.
- Instrucción: Añadir una leyenda que distinga el promedio de naves rivales del porcentaje de rivales que dejaron vacío cada planeta. Rotular la línea de promedio y la escala de 0 a 100 con la unidad que corresponda; no confundir cantidades de naves con porcentajes. Diferenciar la flota propia de la distribución rival mediante patrón y texto, además del color. Reducir el brillo o el fondo que compitan con los datos y mejorar la legibilidad de nombres y puntos. Mantener la identidad de cada planeta, el orden y los valores exactos.
- Copy: Promedio de naves rivales
Rivales con 0 naves
Tu flota
Distribución rival
Valor: {puntos} puntos
- Aceptación: Se identifican la unidad, el promedio, la cantidad propia y el valor de cada planeta sin adivinar. La gráfica conserva los valores reales y ofrece un equivalente textual.
- Referencias: evidence/frentes-pass2-gameplay.jpg
evidence/frentes-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z

## [PLAY-FRENTES-05] P2 · active · Prueba interactiva y propuestas
**No llamar oficial a la práctica**
- Actual: El análisis de Ronda rápida dice ANÁLISIS · NO CAMBIA TU JUGADA OFICIAL, aunque la ronda fue local contra 200 rivales de práctica.
- Instrucción: Derivar los títulos y avisos del modo real. En práctica, indicar que se trata de simulaciones locales y que el análisis no modifica el resultado de esa ronda. Reservar «jugada oficial» para el frente diario. Antes de cualquier publicación diaria, explicar su efecto. No usar la presencia de rivales simulados como prueba de que una acción diaria no envía datos: son propiedades distintas.
- Copy: Análisis de práctica · no cambia el resultado de esta ronda
Frente diario · tu jugada oficial no cambia
Ronda rápida · rivales de práctica
- Aceptación: El resultado y el análisis de una ronda rápida no la llaman oficial. El modo diario y la práctica quedan diferenciados antes de confirmar cualquier acción; analizar no publica una nueva jugada.
- Referencias: evidence/frentes-pass2-analysis.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z

## [PLAY-FRENTES-06] P2 · active · Prueba interactiva y propuestas
**Mantener el mismo formato y significado del rendimiento en resultado y análisis**
- Actual: El resultado dice que la mejor jugada encontrada habría vencido al 95 %; al abrir La mejor, el análisis muestra 94,5 %. El botón La mejor pierde el matiz encontrada y los valores 1 · 1 · 32 · 37 · 29 aparecen sin nombres de planetas.
- Instrucción: Usar una única función de formato del porcentaje en resultado y análisis: una cifra decimal cuando el valor no sea entero, con separadores apropiados al idioma. No cambiar el cálculo para hacer coincidir dos etiquetas. Usar «Mejor reparto encontrado», sin afirmar que la búsqueda prueba el óptimo global, y asociar cada cantidad al nombre del planeta. Rotular pct como rendimiento frente al conjunto de rivales, no como probabilidad de ganar ni porcentaje estricto de victorias: la fórmula vigente es (victorias + 0,5 × empates) / total de rivales × 100. Mostrar también victorias, empates y derrotas por separado. Cada victoria aporta 1, cada empate 0,5 y cada derrota 0 al numerador; la presentación no debe alterar esa ponderación.
- Copy: Mejor reparto encontrado
Comparar mi reparto
{planeta}: {naves} naves
Rendimiento frente a estos rivales: {porcentaje}%
Cada victoria cuenta como 1 y cada empate como 0,5 al calcular el rendimiento.
- Aceptación: El mismo reparto, evaluado contra el mismo conjunto de rivales, muestra el mismo porcentaje y formato en todas las pantallas. Probar un resultado con empates para comprobar que el rendimiento no se presenta como victorias estrictas. Las cantidades conservan sus planetas correspondientes y la heurística no se anuncia como un máximo matemático garantizado.
- Referencias: evidence/frentes-pass2-result.jpg
evidence/frentes-pass2-analysis.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z
La fuente guardada frentes/src/core.js, líneas 165–182, confirma que pct incluye medio punto por empate; las victorias, los empates y las derrotas se conservan como contadores separados. La diferencia observada entre 95 % y 94,5 % es de presentación, no justifica alterar la evaluación. {porcentaje} debe recibir el número formateado sin un signo % duplicado.

## [PLAY-FRENTES-07] P2 · active · Prueba interactiva y propuestas
**Mostrar resumen y acciones sin confundir rivales con rondas jugadas**
- Actual: A 1180×757, el resumen y cinco tarjetas ocupan toda la pantalla; Otra ronda/Analizar/Inicio quedan bajo el desplazamiento. El texto 200 JUGADAS puede interpretarse como 200 partidas del usuario, aunque se comparó una flota contra 200 rivales.
- Instrucción: Presentar el recuento como duelos simulados o rivales comparados, no como partidas independientes que jugó el usuario. Mantener visibles el resumen y una barra de acciones sin tapar las tarjetas. Priorizar «Analizar reparto» y «Jugar otra ronda»; dejar Compartir como acción secundaria y deliberada. Mostrar junto a «Sin medalla» los criterios de la rama vigente, sin inventar umbrales ni modificar la puntuación. Conservar que las medallas ordinarias usan Math.round(pct) antes de aplicar los umbrales existentes: 50, 75 y 90. Explicar ese redondeo aunque las comparaciones muestren una cifra decimal. En Ronda rápida, respetar la llamada medalla(pct, null): no prometer allí un premio por superar el mejor reparto encontrado.
- Copy: {victorias} victorias · {empates} empates · {derrotas} derrotas
Tu reparto se comparó con {rivales} rivales de práctica.
Analizar reparto
Jugar otra ronda
Ver criterios de medallas
- Aceptación: Las acciones primarias quedan accesibles a 1180×757 y en móvil, sin cubrir el contenido. La lectura distingue una ronda del número de rivales con que se comparó el reparto. Compartir no se ejecuta automáticamente. La ayuda y la medalla obtenida coinciden con la regla vigente de redondeo y con el modo; el formato decimal de otras cifras no cambia esa regla.
- Referencias: evidence/frentes-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:47:00Z/2026-10-22T15:53:00Z
Verificación de fuentes guardadas: frentes/src/core.js, líneas 306–310, usa Math.round(pct) para los umbrales ordinarios de medalla. frentes/src/game.js, línea 761, llama medalla(pct, null) en Ronda rápida. Son reglas existentes que la ayuda debe explicar, no propuestas de nuevos umbrales.

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

## [SRC-FR01] P2 · active_source_finding · Texto, estados y flujo
**Asignación/análisis**
- Actual: Al despliegue; Vaciar; Resto aquí; La mejor; +1 aquí, −1 en {pl} ⇒ {p}
- Instrucción: Usar acciones autoexplicativas. Mantener «Mejor reparto encontrado»: el código no demuestra que sea el óptimo global. En análisis, identificar el modo real: sólo el frente diario debe hablar de jugada oficial; la práctica indica que no cambia el resultado de esa ronda. Mostrar la reserva y el total asignado. Explicar el carácter definitivo antes de lanzar únicamente cuando corresponda al flujo real, sin trasladar advertencias de publicación diaria a una evaluación local.
- Copy: Distribuir naves
Quitar todas las naves
Asignar reserva aquí
Mejor reparto encontrado
- Aceptación: Quitar todas las naves devuelve la reserva a 100 y permite Deshacer. Asignar reserva aquí sólo utiliza las naves disponibles. Analizar no remite otra jugada oficial; los textos de práctica y diario conservan esa distinción y no afirman un óptimo global.
- Referencias: https://jetgames.fun/frentes/src/i18n.js?v=5 — es.toDeploy/clear/restHere/marginalFrom/loadBest
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-FR02] P2 · active_source_finding · Texto, estados y flujo
**share fallback**
- Actual: Cuando fallan ambos métodos de copiado, toast con las primeras dos líneas.
- Instrucción: Ofrecer el texto completo, seleccionable y persistente, incluida URL y contexto real/práctica. Diferenciar intento de compartir de copia exitosa en métricas: hoy rec.sh se marca antes del resultado.
- Copy: Compartir resultado / No pudimos copiarlo automáticamente. Seleccioná y copiá este texto.
- Aceptación: Forzar fallos de compartir y copiar no oculta el resultado ni muestra Copiado. Cerrar el fallback vuelve al resultado sin reevaluar ni remitir la flota.
- Referencias: https://jetgames.fun/frentes/src/game.js?v=6 —816–825
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-FRENTES-01] P2 · active_proposal · Dirección visual interna
**Tablero y fondo: reducir competencia detrás de las decisiones**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: buildBg, R.frame
ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .board, .obj, .bmain, .bside, .lane
Estado identificado en la revisión: buildBg radial #140830→#0a0418→#050108,9 nebulosas y estrellasW*H/2600; R.frame parallax6 px; .lane.sel añade fondo cian .07; .bside rgba(14,7,28,.82), radio 20 px y blur8 px.
- Instrucción: Crear modo de fondo de partida diferenciándolo de portada: base #080E18 y radial #17243A alfa .45; nebulosas máximo .025 y estrellas máximo 180, alpha .15–.35. No proyectar estrellas detrás de textos/columnas con el mismo contraste: paneles opacos #121D2B al .96, borde #34465B de 1 px, radio 12 px. .obj padding 12/16 px; .bside padding 12 px móvil/16 px desktop, gap 12 px. Columnas mantienen layout DOM y data-slot: no alterar posiciones canvas manualmente. Separación mínima 8 px entre lanes si cabe, sino actual 6 px; no reducir ancho para ornamentación. Escala visual: objetivo 16/1.4, reserva 28 px mono, ayuda 14/1.5.
- Copy: 
- Aceptación: Verificar data-slot y planetas alineados tras resize/zoom.
Tablero con 1–5 frentes y máximos valores no se superpone.
Fondo de partida se congela bajo reduced-motion sin detener animación necesaria de resolución.
- Referencias: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: buildBg, R.frame
ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .board, .obj, .bmain, .bside, .lane
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Mismo número/orden de frentes, posiciones interactivas y reglas. data-slot sigue siendo única fuente geométrica del canvas; no introducir fondo semejante a nuevos planetas.

## [VIS-FRENTES-02] P2 · active_proposal · Dirección visual interna
**Planetas y enjambres: conservar identidad, ganar volumen sin ruido**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: PCOL, strip, shade, R.drawPlanet, drawRing, R.drawSwarm
Estado identificado en la revisión: PCOL: Aria #6b2bd9, Boreal #8fe3ee, Cobalto #2f62d6, Dunas #d99a3a, Eco #22ae95. Texturas distintivas con luz superior izquierda, atmósfera.55 hasta 1.32r; Eco anillos. Enjambres representan n=round(sl.shown), rings caps16/26/36/60.
- Instrucción: Conservar PCOL y todos los rasgos distintivos. Bajar atmósfera de shade a .22 y alcance 1.18r, no cambiar radio físico ni sombra de esfera. Mantener luz superior izquierda; aumentar separación del terminador sin negro empastado usando extremo rgba(5,1,12,.72) frente .88. Planeta no seleccionado sin aura extra; seleccionado aro cian 2 px offset 6 con cuatro segmentos de enfoque, no círculo de puntos vibrante. Enjambres: conservar cantidad, órbitas y orden de aparición; chevron con borde oscuro .6 px alfas trasero.50/delantero 1 para distinguir siluetas. No reemplazar enjambre por un número sin aprobación, ya que metáfora/cantidad visible son relevantes. Con reduced-motion, congelar órbita en fase inicial determinista, mantener conteo y transiciones discretas de ingreso.
- Copy: 
- Aceptación: Snapshots de los 5 planetas con 0/1/16/17/42/100 naves: mismo conteo.
Planetas identificables por textura además de color; Eco conserva anillos delante/detrás.
Ningún halo corta nombres y ninguna nave aparece fuera de su lane.
- Referencias: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: PCOL, strip, shade, R.drawPlanet, drawRing, R.drawSwarm
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Colores/nombres/orden/radio de planetas y cantidades de flota intactos. No añadir luna, anillo o icono a planetas que no lo tenían. No cambiar sl.shown ni caps ni número de chevrons.

## [VIS-FRENTES-04] P2 · active_proposal · Dirección visual interna
**Batalla y resultado: visualización de datos con revelación controlada**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: drawBattleLane, R.spark, R.starRain, R.trail, R.frame
ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .rchip, .lres, .btn.launch.ready
Estado identificado en la revisión: Histograma usa Math.pow(h/maxH,.55) para ancho; rojo/cian/blanco según resultado; línea cian 2 px halo 10. Partículas limit260, victoria90 estrellas; CTA listo sweep2.5s infinito y doble shadow.
- Instrucción: Mantener histograma y transformación .55 exactos, no presentarlo como escala lineal nueva. Dar a la zona de resultados fondo #0E1722 y baseline 1 px #5A7086. Barras conservan colores funcionales PK/CY/WH y alfas actuales; separar filas con 1 px solo donde rowH>3 como ahora. Línea del jugador 2 px sin halo mayor 4 px; leyendas existentes 12 px mono. chips rival/perdido/empatado mantienen rojo/cian/blanco y texto; radio 6 px, padding 4/6, borde 1 px. CTA listo cian sólido con texto #052F2B, sin sweep infinito; una única entrada de 180 ms. Partículas máximo 40 en victoria, duración≤700 ms, fuera de datos/texto; no acortar ni adelantar la revelación. Bajo reduced-motion, aparición por estados y mismo final, sin lluvia ni parallax.
- Copy: 
- Aceptación: En cada etapa arrive/reveal 0/.5/1 se ve únicamente lo permitido en versión anterior.
Igualdad de resultado numérico y colores semánticos para ganar/perder/empatar.
La secuencia final es legible con 0 partículas; efectos no bloquean input ni lectura.
- Referencias: ui_audit/source_review/current_1410/frentes__frentes__src__render.js :: drawBattleLane, R.spark, R.starRain, R.trail, R.frame
ui_audit/source_review/current_1410/frentes__frentes__src__ui.css :: .rchip, .lres, .btn.launch.ready
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No mostrar histogramas del rival antes del momento autorizado. No cambiar valores, fase de reveal, win/tie/lose, número de victorias ni ritmo lógico.

# Copys ES/EN aplicables
- COPY-common-resume [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-FRENTES-01, PLAY-BALIZAS-04, PLAY-BALIZAS-06, PLAY-ESTACION-06] es-AR: «Reanudar partida» | en: «Resume game» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar', 'Seguir']
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-share [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Compartir resultado» | en: «Share result» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-failed [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «No pudimos copiarlo automáticamente. Seleccioná y copiá este texto.» | en: «We couldn’t copy it automatically. Select and copy this text.» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-text [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Copiar texto» | en: «Copy text» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-close [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Cerrar» | en: «Close» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copied [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Texto copiado» | en: «Text copied» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-distribute [SRC-FR01] es-AR: «Distribuir naves» | en: «Distribute ships» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-clear [SRC-FR01] es-AR: «Quitar todas las naves» | en: «Remove all ships» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-reserve-here [SRC-FR01] es-AR: «Asignar reserva aquí» | en: «Assign reserve here» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-best-found [SRC-FR01, PLAY-FRENTES-06] es-AR: «Mejor reparto encontrado» | en: «Best allocation found» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-analysis-warning [SRC-FR01] es-AR: «Este análisis no cambia tu jugada oficial.» | en: «This analysis does not change your official move.» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo análisis del frente diario. En tutorial, Academia o Ronda rápida usar frentes-practice-analysis: no existe jugada oficial de esa práctica. | params: [] | citas actuales: []
- COPY-frentes-reserve [SRC-FR01] es-AR: «Reserva: {n} naves» | en: «Reserve: {n} ships» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-assigned [SRC-FR01] es-AR: «Total asignado: {n} naves» | en: «Total assigned: {n} ships» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-final-choice [SRC-FR01] es-AR: «Después de lanzar, no vas a poder cambiar tu jugada oficial.» | en: «After launching, you won’t be able to change your official move.» | contexto: No afirmar óptimo global. Reserva total real revisada 100, pero HUD usa valor actual. Mostrar irreversibilidad sólo según flujo real; analizar no publica nueva jugada. Sólo jugada diaria oficial: confirmar envía POST y puede encolar offline. Tutorial/Academia/Ronda rápida evalúan localmente y no deben usar esta advertencia de jugada oficial. | condición: Sólo al confirmar jugada diaria oficial. No usar en tutorial/Academia/Ronda rápida, que evalúan localmente. | params: [] | citas actuales: []
- COPY-frentes-view-result [PLAY-FRENTES-01] es-AR: «Ver resultado» | en: «View result» | contexto: Pausa residual confirmada y recuperable: goHome/startQuick no limpian G.paused; battleStep retorna con pausa. No atribuir a red, ni fabricar resultado por timeout, ni confundir cerrar modal con reanudar. Ver resultado sólo si existe resultado calculado y se implementa omisión de animación sin alterar evaluación. Reanudar pausa usa common-resume, no Continuar ambiguo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-animation-paused [PLAY-FRENTES-01] es-AR: «La animación está pausada.» | en: «The animation is paused.» | contexto: Pausa residual confirmada y recuperable: goHome/startQuick no limpian G.paused; battleStep retorna con pausa. No atribuir a red, ni fabricar resultado por timeout, ni confundir cerrar modal con reanudar. Ver resultado sólo si existe resultado calculado y se implementa omisión de animación sin alterar evaluación. Reanudar pausa usa common-resume, no Continuar ambiguo. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-tutorial-completed [PLAY-FRENTES-02] es-AR: «Tutorial completado» | en: «Tutorial completed» | contexto: Final real del tutorial: no conservar Lanzar flota/Saltar tutorial como acciones del despliegue concluido. Practicar una ronda lleva a entrenamiento local; Ver el frente de hoy sólo abre su briefing y no confirma una jugada; salida usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-practice-round [PLAY-FRENTES-02] es-AR: «Practicar una ronda» | en: «Practice a round» | contexto: Final real del tutorial: no conservar Lanzar flota/Saltar tutorial como acciones del despliegue concluido. Practicar una ronda lleva a entrenamiento local; Ver el frente de hoy sólo abre su briefing y no confirma una jugada; salida usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-today-front [PLAY-FRENTES-02] es-AR: «Ver el frente de hoy» | en: «View today’s front» | contexto: Final real del tutorial: no conservar Lanzar flota/Saltar tutorial como acciones del despliegue concluido. Practicar una ronda lleva a entrenamiento local; Ver el frente de hoy sólo abre su briefing y no confirma una jugada; salida usa common-menu. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-drag-help [PLAY-FRENTES-03] es-AR: «Arrastrá hacia arriba para sumar naves.» | en: «Drag up to add ships.» | contexto: Nombres reales de planetas, valores/límites/reserva actuales y política de redistribución vigente. No cambiar suma total ni inventar qué se retira de otro planeta cuando reserva=0. Alternativas nativas deben llamar la misma acción real que arrastre. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-ships-on-planet [PLAY-FRENTES-03] es-AR: «Naves en {planeta}» | en: «Ships on {planeta}» | contexto: Nombres reales de planetas, valores/límites/reserva actuales y política de redistribución vigente. No cambiar suma total ni inventar qué se retira de otro planeta cuando reserva=0. Alternativas nativas deben llamar la misma acción real que arrastre. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-add-ship [PLAY-FRENTES-03] es-AR: «Sumar una nave a {planeta}» | en: «Add one ship to {planeta}» | contexto: Nombres reales de planetas, valores/límites/reserva actuales y política de redistribución vigente. No cambiar suma total ni inventar qué se retira de otro planeta cuando reserva=0. Alternativas nativas deben llamar la misma acción real que arrastre. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-remove-ship [PLAY-FRENTES-03] es-AR: «Quitar una nave de {planeta}» | en: «Remove one ship from {planeta}» | contexto: Nombres reales de planetas, valores/límites/reserva actuales y política de redistribución vigente. No cambiar suma total ni inventar qué se retira de otro planeta cuando reserva=0. Alternativas nativas deben llamar la misma acción real que arrastre. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-reserve-planet [PLAY-FRENTES-03] es-AR: «Asignar la reserva a {planeta}» | en: «Assign the reserve to {planeta}» | contexto: Nombres reales de planetas, valores/límites/reserva actuales y política de redistribución vigente. No cambiar suma total ni inventar qué se retira de otro planeta cuando reserva=0. Alternativas nativas deben llamar la misma acción real que arrastre. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-average-ships [PLAY-FRENTES-04] es-AR: «Promedio de naves rivales» | en: «Average opponent ship count» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-empty-opponents [PLAY-FRENTES-04] es-AR: «Rivales con 0 naves» | en: «Opponents with 0 ships» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-empty-percent [PLAY-FRENTES-04] es-AR: «Rivales con 0 naves: {porcentaje}%» | en: «Opponents with 0 ships: {porcentaje}%» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'porcentaje', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-own-fleet [PLAY-FRENTES-04] es-AR: «Tu flota» | en: «Your fleet» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-opponent-distribution [PLAY-FRENTES-04] es-AR: «Distribución rival» | en: «Opponent distribution» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-planet-value [PLAY-FRENTES-04] es-AR: «Valor: {puntos} puntos» | en: «Value: {puntos} points» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'puntos', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-one-point-value [PLAY-FRENTES-04] es-AR: «Valor: 1 punto» | en: «Value: 1 point» | contexto: MEDIA=promedio de naves; VACÍO=porcentaje de flotas rivales con cero naves en ese planeta. No son porcentaje global de victorias ni conteo de partidas del jugador. {porcentaje} formateado sin símbolo incluido para no duplicar %. Escala0–100 sólo donde ese tablero realmente usa100 naves. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-practice-analysis [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Análisis de práctica · no cambia el resultado de esta ronda» | en: «Practice analysis · does not change this round’s result» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo práctica real del modo correspondiente. No describir diario con rivales simulados como local; una cola diaria previa puede reenviarse al cargar/reconectar. | params: [] | citas actuales: []
- COPY-frentes-daily-analysis [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Frente diario · tu jugada oficial no cambia» | en: «Daily front · your official move is unchanged» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo G.lab.quick=false / modo diario real, nunca por defecto en Ronda rápida. | params: [] | citas actuales: []
- COPY-frentes-quick-practice [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Ronda rápida · rivales de práctica» | en: «Quick round · practice opponents» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-compare-own [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Comparar mi reparto» | en: «Compare my allocation» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-planet-allocation [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «{planeta}: {naves} naves» | en: «{planeta}: {naves} ships» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'naves', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-one-ship-allocation [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «{planeta}: 1 nave» | en: «{planeta}: 1 ship» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'planeta', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-performance [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Rendimiento frente a estos rivales: {porcentaje}%» | en: «Performance against these opponents: {porcentaje}%» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. No es tasa pura de victorias ni probabilidad de ganar. Identificar la muestra real/simulada según modo y mantener w/d/l como conteos separados. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'porcentaje', 'binding': 'porcentaje = pct = (w+0,5*d)/N*100; formato local consistente, una decimal si no es entero, sin símbolo% en el valor. Si N=0, no presentar0 como muestra de rivales existente; mostrar estado vacío coherente.'}] | citas actuales: []
- COPY-frentes-performance-rule [PLAY-FRENTES-05, PLAY-FRENTES-06] es-AR: «Cada victoria cuenta como 1 y cada empate como 0,5.» | en: «Each win counts as 1 and each draw as 0.5.» | contexto: Práctica local≠jugada oficial. Porcentaje pct=(victorias+0,5×empates)/rivales×100, frentes_core.js181; no llamarlo porcentaje vencido. Mejor reparto usa la misma escala ponderada. Formatear con una decimal si no es entero, igual en resultado/análisis; signo% no va dentro del parámetro. La mejor opción es encontrada, no óptimo global garantizado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-results-counts [PLAY-FRENTES-07] es-AR: «{victorias} victorias · {empates} empates · {derrotas} derrotas» | en: «{victorias} wins · {empates} draws · {derrotas} losses» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo si ninguna cantidad es1. Cuando alguna sea1, componer ramas one/many por cada componente y separador ·, conservando mismo orden. | params: [{'name': 'victorias', 'binding': 'Conteo real w / res.ganados; NO w+0,5*d.'}, {'name': 'empates', 'binding': 'Conteo real d / res.empates.'}, {'name': 'derrotas', 'binding': 'Conteo real l / res.perdidos.'}] | citas actuales: []
- COPY-frentes-one-win [PLAY-FRENTES-07] es-AR: «1 victoria» | en: «1 win» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-many-wins [PLAY-FRENTES-07] es-AR: «{victorias} victorias» | en: «{victorias} wins» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'victorias', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-one-draw [PLAY-FRENTES-07] es-AR: «1 empate» | en: «1 draw» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-many-draws [PLAY-FRENTES-07] es-AR: «{empates} empates» | en: «{empates} draws» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'empates', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-one-loss [PLAY-FRENTES-07] es-AR: «1 derrota» | en: «1 loss» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-many-losses [PLAY-FRENTES-07] es-AR: «{derrotas} derrotas» | en: «{derrotas} losses» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'derrotas', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-compared-practice [PLAY-FRENTES-07] es-AR: «Tu reparto se comparó con {rivales} rivales de práctica.» | en: «Your allocation was compared against {rivales} practice opponents.» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo muestra de rivales de práctica/simulados del modo local correspondiente. No describir jugadores reales ni una muestra mixta diaria como enteramente simulada. | params: [{'name': 'rivales', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-frentes-compared-one-practice [PLAY-FRENTES-07] es-AR: «Tu reparto se comparó con 1 rival de práctica.» | en: «Your allocation was compared against 1 practice opponent.» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo muestra de rivales de práctica/simulados del modo local correspondiente. No describir jugadores reales ni una muestra mixta diaria como enteramente simulada. | params: [] | citas actuales: []
- COPY-frentes-analyze-allocation [PLAY-FRENTES-07] es-AR: «Analizar reparto» | en: «Analyze allocation» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-another-round [PLAY-FRENTES-07] es-AR: «Jugar otra ronda» | en: «Play another round» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-medal-criteria [PLAY-FRENTES-07] es-AR: «Ver criterios de medallas» | en: «View medal criteria» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-medal-rounded [PLAY-FRENTES-07] es-AR: «Las medallas usan el rendimiento redondeado al entero más cercano.» | en: «Medals use performance rounded to the nearest whole number.» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-medal-thresholds [PLAY-FRENTES-07] es-AR: «Bronce: desde 50%. Plata: desde 75%. Oro: desde 90%.» | en: «Bronze: 50% or higher. Silver: 75% or higher. Gold: 90% or higher.» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Mostrar junto a la explicación de redondeo frentes-medal-rounded: los umbrales se aplican a Math.round(pct), no directamente al decimal visible. No cambiar regla para hacer coincidir una captura. | params: [] | citas actuales: []
- COPY-frentes-perfect-command [PLAY-FRENTES-07] es-AR: «Mando perfecto: superá el rendimiento del mejor reparto encontrado.» | en: «Perfect command: exceed the performance of the best allocation found.» | contexto: Conteos reales de duelos para UNA flota; no200 partidas del usuario ni200 rivales fijados en copy. Plurales por cada componente. Umbrales verificados frentes_core.js306–310 sobre Math.round(pct), no modificar para coincidir con nueva precisión visible. Mando perfecto sólo cuando función recibe bestPct no nulo; Ronda rápida pasa null y no ofrece ese premio. Compartir sigue acción deliberada separada. | condición: Sólo si C.medalla recibe bestPct!=null y pct>bestPct+1e-9; es comparación con mejor reparto encontrado, no prueba de óptimo global. No mostrar como premio posible en Ronda rápida (bestPct=null). | params: [] | citas actuales: []
- COPY-frentes-one-reserve [SRC-FR01] es-AR: «Reserva: 1 nave» | en: «Reserve: 1 ship» | contexto: Variante n=1 de contador correspondiente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-frentes-one-assigned [SRC-FR01] es-AR: «Total asignado: 1 nave» | en: «Total assigned: 1 ship» | contexto: Variante n=1 de contador correspondiente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
