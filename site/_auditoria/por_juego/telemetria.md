# telemetria: 15 registros del catálogo, 49 copys

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

## [PLAY-TELEMETRIA-01] P2 · active · Prueba interactiva y propuestas
**Explicar que las barras indican probabilidad de avería, no salud**
- Actual: Por defecto, las barras no muestran porcentajes ni una etiqueta que explique su significado; el árbol de accesibilidad sí anuncia 25 %, 75 % y 96 %. El usuario podría interpretarlas como estado o salud del sistema.
- Instrucción: Añadir el encabezado «Probabilidad de avería» y mostrar los porcentajes por defecto, sin presentar una probabilidad como certeza. Separar el resultado de la última lectura, ALERTA/NORMAL, de la probabilidad acumulada y del historial.
- Copy: Probabilidad de avería
Última lectura: {resultado}
{porcentaje} % de probabilidad según las lecturas
- Aceptación: Una lectura NORMAL no se interpreta como garantía de que el sistema esté sano. La barra, el porcentaje y el historial mantienen valores consistentes.
- Referencias: evidence/telemetria-pass1-gameplay.jpg
evidence/telemetria-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z

## [PLAY-TELEMETRIA-02] P2 · active · Prueba interactiva y propuestas
**Acercar guía, sistemas y acciones**
- Actual: A 1180×757, la nave queda a media altura a la izquierda, la lista arriba en el centro, las acciones arriba a la derecha y ORA al pie; gran parte del panel derecho está vacía. La guía animada aparece lejos de la acción y se lee por fragmentos.
- Instrucción: Organizar la cabina en tres zonas alineadas: esquema con etiquetas, diagnóstico y acciones. Situar ORA junto al sistema o al control que explica. Mostrar el texto completo inmediatamente u ofrecer «Mostrar todo»; la animación no debe imponer una espera obligatoria. Mantener sincronizadas las conexiones y la selección.
- Copy: Sistema seleccionado: {sistema}
Mostrar todo
Cerrar consejo
- Aceptación: El consejo y el control señalado caben en el mismo campo visual. A 1180×757, una columna alta vacía no reduce el espacio útil del esquema.
- Referencias: evidence/telemetria-pass1-gameplay.jpg
evidence/telemetria-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z

## [PLAY-TELEMETRIA-03] P2 · active · Prueba interactiva y propuestas
**Especificar los costes totales de reparar con acierto o error**
- Actual: El botón muestra REPARAR · 8 MIN y fallo −20. En la prueba, una reparación errónea consumió 20 min en total (32→12), no 8+20. El texto no aclara que se trata de costes alternativos.
- Instrucción: Antes de mantener pulsado el botón, mostrar los dos costes totales posibles: reparar un sistema averiado cuesta caso.R; reparar uno sano cuesta caso.R + caso.Rx. No sumar otra vez el coste base a un valor que ya representa el coste total del error. Añadir el nombre del sistema seleccionado y un indicador de progreso de la pulsación mantenida. Explicar que el aire es un presupuesto consumido por acciones, no un cronómetro en tiempo real. Obtener los costes del caso vigente, pues varían entre casos. La vista previa presenta ambos escenarios hipotéticos y sólo usa información visible; no consulta st.real ni revela cuál es el verdadero antes de actuar.
- Copy: Reparar {sistema}
Si está averiado: −{coste_acierto} min. Si está sano: −{coste_error} min en total.
Mantené pulsado para confirmar.
El aire se consume al actuar, no mientras pensás.
- Aceptación: La interfaz distingue coste de acierto y coste total de error, sin contar dos veces la penalización. Después de actuar, el saldo coincide con la única resta que realiza NUCLEO.aplicar para la rama resuelta. La vista previa no identifica esa rama por adelantado ni revela la avería. La información visible y la accesible comunican los mismos costes, incluidos casos con valores diferentes de los observados.
- Referencias: evidence/telemetria-pass1-gameplay.jpg
evidence/telemetria-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z
Verificado en las fuentes guardadas: telemetria/src/nucleo.js, líneas 189–198, calcula y resta una vez caso.R + (ok ? 0 : caso.Rx). Los valores 8/20 corresponden a casos iniciales; no son constantes de toda la campaña.

## [PLAY-TELEMETRIA-04] P2 · active · Prueba interactiva y propuestas
**Explicar la reparación acertada seguida de agotamiento del aire**
- Actual: Con 8 min, Reparar advierte Te quedarías sin aire. Una reparación correcta de Navegación deja 0 y primero anuncia Navegación reparado; después, el resultado muestra SIN AIRE / Estaba roto: Navegación, sin explicar que la reparación fue correcta pero no evitó el agotamiento.
- Instrucción: Separar el acierto del diagnóstico del desenlace de supervivencia. Conservar el orden de resolución vigente de NUCLEO.aplicar: primero aire <= 0 produce derrota; sólo después, si queda aire, real === 0 produce victoria. Por eso una reparación correcta que agota el aire no gana. No cambiar ese orden para hacer coincidir el resultado con un mensaje. Antes de actuar, comunicar los dos saldos hipotéticos a partir del aire disponible y de los costes visibles del caso, sin consultar st.real ni señalar si el sistema está realmente averiado. Mantener la convención visual vigente de mostrar el aire agotado como 0, aunque el saldo interno sea negativo. Tras actuar, ariaRepairOk debe anunciar que se reparó la avería, no una victoria; si el caso termina SIN AIRE, explicar ambos hechos con una plantilla neutra.
- Copy: Si está averiado, quedarían {aire_acierto} min. Si está sano, quedarían {aire_error} min.
Agotar el aire termina el caso, aunque la reparación sea correcta.
Avería reparada: {sistema}.
Reparaste {sistema}, pero agotaste el aire.
- Aceptación: Probar una reparación correcta con aire disponible exactamente igual a caso.R: termina SIN AIRE, según la precedencia existente, sin cambiar la regla. Verificar también los dos costes hipotéticos con aire suficiente y con riesgo de agotamiento. Las advertencias sólo usan aire y costes visibles, no revelan la avería antes de actuar y no confunden reparación acertada con victoria. El anuncio posterior usa una construcción gramatical neutra; no muestra Navegación reparado.
- Referencias: evidence/telemetria-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z
Se observó una reparación correcta que dejó 0 y terminó SIN AIRE. La revisión de telemetria/src/nucleo.js, líneas 201–202, confirmó que aire <= 0 se evalúa antes de real === 0. La explicación documenta esta regla existente; no introduce una nueva. telemetria/src/ui.js usa Math.max(0, st.aire) para mostrar el aire y ariaRepairOk para anunciar la reparación, no el resultado de victoria.

## [PLAY-TELEMETRIA-05] P2 · active · Prueba interactiva y propuestas
**Jerarquía de resultado distinta para victoria y derrota**
- Actual: SIN AIRE ofrece Siguiente Caso 1-3 como CTA grande y enfocado; Otra vez queda en segundo plano junto a Compartir.
- Instrucción: En derrota, convertir «Reintentar caso» en la acción primaria y situar allí el foco. Mantener «Elegir otro caso» como acción secundaria si el capítulo permite esa libertad; no presentar el caso fallido como superado. En victoria, conservar «Siguiente caso». Usar «Volver al menú» para ese destino.
- Copy: Reintentar caso
Elegir otro caso
Volver al menú
Siguiente caso
- Aceptación: Tras perder, Enter activa el reintento sólo si el botón correspondiente tiene el foco; no avanza al siguiente caso por una acción global inesperada. El intento fallido no se presenta como superado. Mantener la lógica de registrarProgreso: el mapa conserva la mejor marca previa mediante Math.max, por lo que una derrota no borra estrellas de una victoria anterior.
- Referencias: evidence/telemetria-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z

## [PLAY-TELEMETRIA-06] P2 · active · Prueba interactiva y propuestas
**Estrellas legibles, explicadas y accesibles**
- Actual: El resultado dibuja estrellas, pero el árbol de accesibilidad no informa cuántas; el mapa sí anuncia Caso 1-1, 3 ★. El resultado no explica cuánto aire exige cada estrella. Los capítulos bloqueados tienen texto muy tenue.
- Instrucción: Añadir un resumen visible y accesible con las estrellas realmente obtenidas. Mantener legibles los nombres y requisitos de los capítulos bloqueados. Explicar la métrica vigente como «Puntaje de decisiones», no como porcentaje de diagnósticos acertados ni como minutos de aire: compara la acción elegida con la mejor evaluada por el piloto según la información disponible antes de cada paso. El piloto realiza una búsqueda limitada; no describir su estimación como certeza ni como óptimo absoluto. Conservar el cálculo: arr es la suma de p.arrep; norm = Math.max(8, ini.V - ini.hoja); prec = Math.max(0, Math.min(100, Math.round(100 * (1 - arr / norm)))). Fuera de los tutoriales 1/2, una victoria obtiene 3 estrellas con prec >= 95, 2 con prec >= 80 y 1 en el resto; la derrota obtiene 0. Si se usó pista, aplicar Math.min(est, 2), no restar siempre una. En los tutoriales 1/2, mantener 3 estrellas por victoria y 0 por derrota; la pista está oculta y su función rechaza la activación, de modo que no se aplica allí el límite ordinario. Los textos de umbral deben corresponder a esta rama y a la victoria; no prometer 3 estrellas cuando se usó pista. Vincular el resumen al resultado calculado y actualizarlo cuando termine el análisis diferido, sin anunciar el valor provisional como definitivo.
- Copy: {estrellas} de 3 estrellas
Puntaje de decisiones: {prec}/100
Compara tus decisiones con las del piloto automático según la información disponible en cada paso; no es un porcentaje de diagnósticos acertados. Es una estimación.
Para {objetivo} estrellas: ganá el caso con al menos {umbral_precision}/100 en el puntaje de decisiones.
Ganá el caso para obtener al menos 1 estrella.
Si usás pista, podés obtener como máximo 2 estrellas.
En este tutorial, ganar otorga 3 estrellas.
Bloqueado: ganá {cantidad} casos del capítulo anterior.
- Aceptación: El lector anuncia las estrellas reales del resultado, no una cantidad fija por el mero hecho de ganar ni por el aire restante. Fuera de los tutoriales 1/2, comprobar ambos lados de los umbrales de prec, victoria, derrota y pista; en los tutoriales 1/2, conservar su resultado especial y la indisponibilidad de pista. Verificar que el análisis diferido actualice la cifra visible y la accesible de forma consistente. La ayuda explica que se trata de un puntaje comparativo de decisiones, no una tasa de aciertos. El mapa conserva la mejor marca previa mediante la regla vigente, sin borrar progreso por un intento posterior peor.
- Referencias: evidence/telemetria-pass1-result.jpg
evidence/telemetria-pass2-result.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z
Verificación de fuentes guardadas: telemetria/src/ui.js, líneas 811–829, calcula estrellas a partir de prec fuera de los tutoriales 1/2; líneas 399 y 743 ocultan y bloquean la pista en esos tutoriales; líneas 838–840 conservan las mejores marcas con Math.max. La mención de «qué aire exige cada estrella» en la observación identifica una expectativa de explicación, no una regla real del juego. telemetria/src/piloto.js, líneas 159–163, define arrep = Math.max(0, V - qExtra) al reconstruir la creencia anterior a cada acción. V estima la utilidad de la mejor acción evaluada; hoja es una referencia que repara por sospecha descendente sin nuevas lecturas. La utilidad usa aire final si se sobrevive y una penalización al perder.
Bindings propuestos: {prec} = G.res.prec; {umbral_precision} procede del umbral real correspondiente; {objetivo} se usa para metas de 2 o 3 estrellas en la rama no tutorial. La frase de 1 estrella y la frase especial de tutorial se muestran sólo en sus contextos. No mostrar null como puntaje, ni un umbral de aire inexistente.

## [PLAY-TELEMETRIA-07] P2 · active · Prueba interactiva y propuestas
**Semántica de selección y paneles modales**
- Actual: La selección exclusiva de sistemas se expone como casillas de verificación. Registro abre una hoja cuyo foco permanece en el botón del fondo, y la pausa mantiene expuesto el árbol de juego. Los cierres de ORA y Registro sólo se anuncian como ×.
- Instrucción: Usar radiogroup para la selección exclusiva o botones con aria-pressed coherente. Dar rol dialog a las hojas y los modales, gestionar su foco y volver inerte el fondo. Nombrar cada cierre según su contexto. Al cerrar, devolver el foco al control que abrió el panel.
- Copy: Seleccionar sistema
Cerrar registro
Cerrar consejo de ORA
- Aceptación: Con teclado y lector no se recorren acciones de la cabina detrás de Registro o Pausa. Exactamente un sistema se anuncia seleccionado.
- Referencias: evidence/telemetria-pass2-gameplay.jpg
- Notas: Ventana de observación: 2026-10-22T15:20:00Z/2026-10-22T15:26:00Z

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

## [SRC-TE01] P2 · active_source_finding · Texto, estados y flujo
**Medir/reparar y coste**
- Actual: Leer; {a} min de aire; Reparar; fallo −{x}
- Instrucción: Preservar los costes, el objetivo seleccionado y los motivos de deshabilitación que ya comunican los botones y sus aria-label. Mejorar su presentación visible y el texto junto al CTA cuando sea necesario, sin describir estas funciones como ausentes ni volver a implementarlas de cero. En medición, obtener el coste del sensor vigente. En reparación, mostrar dos costes totales alternativos: acierto = caso.R; error = caso.R + caso.Rx. No presentar el coste total del error como minutos adicionales al coste del acierto. Calcular ambos escenarios sólo con los costes visibles y el aire disponible, sin consultar ni revelar la avería real. Explicar que el aire se consume por acciones y no por el tiempo que se tarda en decidir. Mantener el motivo real de cada acción deshabilitada y las validaciones actuales.
- Copy: Medir · {c} min de aire
Reparar {sistema}
Si está averiado: −{coste_acierto} min. Si está sano: −{coste_error} min en total.
El aire se consume al actuar, no mientras pensás.
- Aceptación: Antes de actuar, el objetivo y los costes corresponden al sensor, sistema y caso vigentes. Una acción inválida no consume aire. En reparación se resta una sola vez el coste total de la rama resuelta: caso.R en acierto o caso.R + caso.Rx en error. Las advertencias no revelan qué sistema está realmente averiado. Medición y reparación no se confunden.
- Referencias: https://jetgames.fun/telemetria/ — final_revalidation/telemetria__telemetria__src__ui.js:480–503; textos.js (acciones)
- Notas: Recomendación de texto. Revalidación final HTTP de sólo lectura 2026-10-22 16:14–16:20 UTC. Precisión de alcance: funciones existentes que deben preservarse, no ausencia de implementación. Este revisor no jugó. La fuente confirma que ya se comunican costes, objetivo y motivos de deshabilitación en botones y aria-label.
Verificación adicional en las fuentes guardadas: NUCLEO.aplicar, telemetria/src/nucleo.js, líneas 189–202. La reparación calcula c = caso.R + (ok ? 0 : caso.Rx), resta c una vez y evalúa aire <= 0 antes de real === 0. Los costes cambian entre casos; no fijar los valores de una partida en las cadenas de interfaz.

## [SRC-TE02] P2 · active_source_finding · Texto, estados y flujo
**Resultados, pista, pausa**
- Actual: Siguiente; Otra vez; Repetición comentada; Mapa; Inicio; La pista cuesta la tercera estrella de este caso.
- Instrucción: Conservar el aviso del efecto real antes de usar una pista: limita el resultado a un máximo de 2 estrellas, no resta siempre 1 estrella. Preservar la regla Math.min(est, 2) y no modificar la puntuación por una mejora editorial. Presentar la comparación del piloto automático como estimación, no como certeza. Usar etiquetas de resultado específicas.
- Copy: Siguiente caso / Reintentar caso (derrota) / Repetir caso (victoria) / Ver análisis de decisiones / Ver campaña / Volver al menú / Ver pista · máximo 2 estrellas en este caso
- Aceptación: Victoria y derrota usan el verbo correcto. Antes de pedir una pista se muestra «Ver pista · máximo 2 estrellas en este caso». Probar puntuaciones originales de 0, 1, 2 y 3 estrellas: tras usar una pista resultan 0, 1, 2 y 2 respectivamente; no se resta una estrella de los resultados inferiores. Continuar desde el menú restaura caso y aire.
- Referencias: https://jetgames.fun/telemetria/src/textos.js?v=2 — es.next/again/replay/map/home/hintCost; https://jetgames.fun/telemetria/src/ui.js:828 — if(G.pista)est=Math.min(est,2)
- Notas: Recomendación de texto; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-TELEMETRIA-01] P2 · active_proposal · Dirección visual interna
**Separar selección, probabilidad y reparación en los nodos**
- Actual: .nodo.sel escala 1.15 y halo cian; .top borde ámbar; .rep también cian; .desc usa opacidad .45 y✕. Las filas ya escriben✓ Reparado y✕ Descartado; top depende de probabilidad, no certeza.
- Instrucción: Selección: anillo exterior cian fijo 2 px, sin escalar el nodo ni alterar su centro. Reparado: ✓ en pequeño sello interior inferior y relleno cian suave, sin anillo de selección salvo que también esté seleccionado. Mayor probabilidad: mantener borde ámbar y, sólo donde este estado ya se muestra y fuera de cualquier ocultación del modo Veterano, usar el rótulo «Mayor probabilidad» / «Highest probability» en el panel asociado. No añadir triángulo: ▲ ya significa respuesta/previsión de sensor «Alerta». No usar ✓ para probabilidad. Descartado: mantener ✕ y dashed, pero icono/nombre a opacidad .7 para poder revisarlo. Conservar las lámparas de respuesta como estado temporal separado.
- Copy: 
- Aceptación: Un nodo puede estar seleccionado y reparado sin confundirse con el más probable. Tras leer un sensor no se marca ningún sistema como reparado si no ocurrió una reparación. Criterio pendiente de validar mediante render real, no prueba realizada. Revisar .top junto a respuesta ▲ Alerta: ningún símbolo nuevo comparte ambos significados. En modo Veterano no aparece el rótulo ni una probabilidad que antes permanecía oculta.
- Referencias: file: ui_audit/source_review/current_1410/telemetria__telemetria__src__estilos.css
lines: 173–186
file: ui_audit/source_review/current_1410/telemetria__telemetria__src__ui.js
lines: 416–443
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No usar verde/✓ para una sospecha. No cambiar m[q], top, rep/desc ni ocultación del modo veterano; éste no debe revelar probabilidades nuevas.

## [VIS-TELEMETRIA-02] P2 · active_proposal · Dirección visual interna
**Hacer las barras de probabilidad comparables y tranquilas**
- Actual: .barra tiene12 px de alto, fill violeta, transición.45s y un fantasma de valor anterior que desvanece.8s; la cifra porcentual es opcional por body.pct. Las previsiones ya usan▲ ámbar y○ cian.
- Instrucción: Mantener la misma escala 0–100% en todas las filas y el ancho proporcional exacto. Cambiar el gradiente por violeta sólido #a46bff únicamente en barras normales. Conservar el ámbar semántico actual de .fila.top .barra .f para el sistema más probable; no cubrir esa regla con un selector general. Usar marcas discretas 0/50/100% sólo en la cabecera cuando body.pct permite mostrar porcentajes y body.vet NO oculta barras/previsiones. Si se ocultan, ocultar también estas marcas: no filtrar información mediante la cabecera. No repetir números diminutos en cada barra. Acortar transición a 220 ms y el fantasma anterior a 350 ms. Mantener ▲/○ para las previsiones y añadir su leyenda junto a la zona de sensores, no dentro de cada barra. No forzar porcentajes si la preferencia los oculta.
- Copy: 
- Aceptación: Dos sistemas con el mismo porcentaje tienen exactamente el mismo ancho. Una actualización de lectura permite comparar antes/después sin parpadeo; veterano sigue sin barras y previsiones ocultas según sus reglas. Criterio pendiente de validar mediante render real, no prueba realizada. Comprobar .fila.top ámbar frente a filas normales violetas y las cuatro combinaciones de body.pct / body.vet; nunca se muestran ticks numéricos cuando las reglas originales ocultan porcentajes o barras.
- Referencias: file: ui_audit/source_review/current_1410/telemetria__telemetria__src__estilos.css
lines: 199–239
file: ui_audit/source_review/current_1410/telemetria__telemetria__src__ui.js
lines: 425–438
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: La barra representa marginales del motor; no normalizarla por el máximo de la lista ni exagerar valores bajos. Preservar body.vet y body.pct.

## [VIS-TELEMETRIA-03] P2 · active_proposal · Dirección visual interna
**Bajar el fondo al plano de ambiente y subir la silueta técnica**
- Actual: CABINA dibuja 260 estrellas, ventanal, luces y Tierra; nave() usa rejilla violeta alpha .12, casco #1b1236, contorno dinámico y conexiones alpha .35. Los controles reales están en el DOM sobre el canvas.
- Instrucción: En modo juego aplicar una máscara de calma detrás de la lista/sensores: estrellas y luces decorativas al 35% de su alpha de menú. Mantener la silueta de la nave con contorno 1.5 px neutro; rejilla alpha .06 y cableado decorativo alpha .18, dejando los nodos como contraste dominante. No desplazar la nave por parallax mientras se elige un sistema. Mantener Tierra/ventanal más expresivos en inicio y victoria para conservar personalidad sin invadir la lectura diagnóstica.
- Copy: 
- Aceptación: A 320 y horizontal se distinguen casco, nodos y zona seleccionada sin recurrir al brillo. Cada botón DOM sigue coincidiendo con su posición dibujada antes/después de resize. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/telemetria__telemetria__src__cabina.js
lines: 13–22,52–86,140–177
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No mover geometria().pos ni zonasX, pues posicionan los nodos interactivos. Las conexiones de fondo no deben parecer resultados de un sensor.

## [VIS-TELEMETRIA-04] P2 · active_proposal · Dirección visual interna
**Usar una confirmación estable de lectura y una alarma de aire no intermitente**
- Actual: Aire bajo pulsa brightness1.5 cada1s; .lamp.on usa bombilla.9s con múltiples cambios de opacidad . lampara() ya muestra texto▲Alerta/○Normal y lo retira alrededor de 1s; body.rm conserva lámpara estática.
- Instrucción: Sustituir bombilla por aparición 120 ms, permanencia 700 ms y salida 180 ms, sin apagones intermedios. Mantener ▲/○ y texto completo; después la respuesta permanece en los chips históricos existentes. Aire bajo: borde rojo estable y símbolo de advertencia junto al número, con un único pulso de 200 ms al cruzar el umbral; no un latido continuo. Respetar la transición actual de anchura y el número de aire, sin agregar un falso cronómetro.
- Copy: 
- Aceptación: Con tres lecturas consecutivas se reconoce cada resultado y su orden sin flashes. En movimiento reducido y escala de grises se identifica aire bajo y tipo de lectura mediante texto/símbolo. Criterio pendiente de validar mediante render real, no prueba realizada.
- Referencias: file: ui_audit/source_review/current_1410/telemetria__telemetria__src__estilos.css
lines: 158–167,234–238,490–493
file: ui_audit/source_review/current_1410/telemetria__telemetria__src__ui.js
lines: 505–510
- Notas: Propuesta de estética y legibilidad basada en la fuente; no se observó el supuesto fallo visual en ejecución. Implementación y pruebas de aceptación pendientes.
- Preservar: No cambiar costes, umbrales o sensibilidad de sensores. ▲Alerta no significa fallo confirmado; ○Normal no significa reparación. El historial sigue siendo la evidencia permanente.

# Copys ES/EN aplicables
- COPY-common-menu [SRC-G03, SRC-A01, SRC-R01, SRC-S02, SRC-F01, SRC-M02, SRC-CN02, PLAY-ASTRO-02, RSP-SLALOM-04, PLAY-TELEMETRIA-05, PLAY-PORTADA-06, PLAY-FRENTES-02] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Pausa: reanudar el intento en memoria; menú: volver al menú del juego, nunca al catálogo. La orden maestra reemplaza Continuar/Seguir/Reanudar caso cuando designen pausa. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-continue-save [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Continuar partida» | en: «Continue game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['Continuar partida']
- COPY-common-newgame [SRC-G03, SRC-B02, SRC-CH02, SRC-TE02] es-AR: «Nueva partida» | en: «New game» | contexto: Continuar recupera un guardado; Nueva partida inicia sesión desde el estado inicial. No exige tablero ni semilla diferentes. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-measure [SRC-TE01] es-AR: «Medir · {c} min de aire» | en: «Measure · {c} min of air» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'c', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-repair [SRC-TE01] es-AR: «Reparar · {r} min de aire» | en: «Repair · {r} min of air» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'r', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-no-fault [SRC-TE01, PLAY-TELEMETRIA-03] es-AR: «Si no hay avería, consumís {x} min de aire en total.» | en: «If there is no fault, you use {x} min of air in total.» | contexto: Corrección por PLAY-TELEMETRIA-03: el coste de error es TOTAL, no adicional al coste base. {x} debe enlazarse al coste TOTAL real de reparar un sistema sano; si la variable histórica x era un incremento, no reutilizar ese binding. Mantener la regla de consumo, no cambiarla para justificar el texto anterior. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'x', 'binding': 'x = caso.R + caso.Rx: coste TOTAL de reparar un sistema sano. No enlazar sólo a Rx. Fuente: NUCLEO.aplicar, nucleo.js:189–202.'}] | citas actuales: []
- COPY-telemetria-selected [SRC-TE01] es-AR: «Objetivo seleccionado: {objetivo}» | en: «Selected target: {objetivo}» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'objetivo', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-choose-target [SRC-TE01] es-AR: «Elegí un objetivo para continuar.» | en: «Choose a target to continue.» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-insufficient [SRC-TE01] es-AR: «No tenés aire suficiente para esta acción.» | en: «You don’t have enough air for this action.» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-air-rule [SRC-TE01] es-AR: «El aire se consume al realizar acciones; no es una cuenta regresiva en tiempo real.» | en: «Air is used when you take actions; it is not a real-time countdown.» | contexto: Coste varía con sensor/objetivo. Texto del aire sólo si ésa es la regla vigente. Deshabilitado debe dar motivo correcto; acción inválida nunca consume aire. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-next [SRC-TE02, PLAY-TELEMETRIA-05] es-AR: «Siguiente caso» | en: «Next case» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-retry [SRC-TE02, PLAY-TELEMETRIA-05] es-AR: «Reintentar caso» | en: «Retry case» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-replay [SRC-TE02] es-AR: «Repetir caso» | en: «Replay case» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-analysis [SRC-TE02] es-AR: «Ver análisis de decisiones» | en: «View decision analysis» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-campaign [SRC-TE02] es-AR: «Ver campaña» | en: «View campaign» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-hint [SRC-TE02] es-AR: «Ver pista · máximo 2 estrellas en este caso» | en: «View hint · maximum 2 stars for this case» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: ['La pista cuesta la tercera estrella de este caso.']
- COPY-telemetria-autopilot [SRC-TE02] es-AR: «Estimación del piloto automático» | en: «Autopilot estimate» | contexto: Pista = hint. Mantener Math.min(est, 2): 0/1/2/3→0/1/2/2. Nunca escribir «resta una estrella». Análisis no afirma certeza contrafactual. Menú usa common-menu, guardado common-continue-save. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-fault-probability [PLAY-TELEMETRIA-01] es-AR: «Probabilidad de avería» | en: «Fault probability» | contexto: Barras de probabilidad, no salud ni diagnóstico seguro. {resultado} distingue ALERTA/NORMAL con la traducción vigente. La probabilidad acumulada no equivale a la última lectura. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-last-reading [PLAY-TELEMETRIA-01] es-AR: «Última lectura: {resultado}» | en: «Last reading: {resultado}» | contexto: Barras de probabilidad, no salud ni diagnóstico seguro. {resultado} distingue ALERTA/NORMAL con la traducción vigente. La probabilidad acumulada no equivale a la última lectura. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'resultado', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-reading-probability [PLAY-TELEMETRIA-01] es-AR: «{porcentaje} % de probabilidad según las lecturas» | en: «{porcentaje}% probability based on the readings» | contexto: Barras de probabilidad, no salud ni diagnóstico seguro. {resultado} distingue ALERTA/NORMAL con la traducción vigente. La probabilidad acumulada no equivale a la última lectura. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'porcentaje', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-selected-system [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Sistema seleccionado: {sistema}» | en: «Selected system: {sistema}» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'sistema', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-show-all-advice [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Mostrar todo» | en: «Show all» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-close-advice [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Cerrar consejo» | en: «Close advice» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-select-system [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Seleccionar sistema» | en: «Select a system» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-close-log [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Cerrar registro» | en: «Close log» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-close-ora [PLAY-TELEMETRIA-02, PLAY-TELEMETRIA-07] es-AR: «Cerrar consejo de ORA» | en: «Close ORA’s advice» | contexto: Nombres de sistemas localizados desde catálogo vigente; ORA conserva su nombre. Mostrar todo revela de inmediato el consejo completo. Cada cierre nombra el panel real y devuelve foco a su activador. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-repair-target [PLAY-TELEMETRIA-03, SRC-TE01] es-AR: «Reparar {sistema}» | en: «Repair {sistema}» | contexto: Ambos costes son TOTALES alternativos del sensor/sistema/regla vigente. No sumar coste base al coste de error: el caso observado 32→12 consumió 20 total, no 8+20. Esos valores de prueba no se fijan en UI. Hold usa duración real configurada sin inventar umbral. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'sistema', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-repair-total-costs [PLAY-TELEMETRIA-03, SRC-TE01] es-AR: «Si está averiado: −{coste_acierto} min. Si está sano: −{coste_error} min en total.» | en: «If faulty: −{coste_acierto} min. If healthy: −{coste_error} min in total.» | contexto: Ambos costes son TOTALES alternativos del sensor/sistema/regla vigente. No sumar coste base al coste de error: el caso observado 32→12 consumió 20 total, no 8+20. Esos valores de prueba no se fijan en UI. Hold usa duración real configurada sin inventar umbral. Fuente confirmada: NUCLEO.aplicar, nucleo.js:189–202; c=caso.R+(ok?0:caso.Rx). No fijar 8/20: otros casos usan costes diferentes. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'coste_acierto', 'binding': 'caso.R; coste total de reparación correcta.'}, {'name': 'coste_error', 'binding': 'caso.R + caso.Rx; coste total de reparación errónea. Se resta una sola vez.'}] | citas actuales: []
- COPY-telemetria-hold-confirm [PLAY-TELEMETRIA-03, SRC-TE01] es-AR: «Mantené pulsado para confirmar.» | en: «Press and hold to confirm.» | contexto: Ambos costes son TOTALES alternativos del sensor/sistema/regla vigente. No sumar coste base al coste de error: el caso observado 32→12 consumió 20 total, no 8+20. Esos valores de prueba no se fijan en UI. Hold usa duración real configurada sin inventar umbral. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-air-thinking [PLAY-TELEMETRIA-03, SRC-TE01] es-AR: «El aire se consume al actuar, no mientras pensás.» | en: «Air is used when you act, not while you think.» | contexto: Ambos costes son TOTALES alternativos del sensor/sistema/regla vigente. No sumar coste base al coste de error: el caso observado 32→12 consumió 20 total, no 8+20. Esos valores de prueba no se fijan en UI. Hold usa duración real configurada sin inventar umbral. Fuente actual ya tiene aria-label con coste, motivo de deshabilitado y objetivo: revisar coherencia/texto y preservar esa cobertura, no crearla como si faltara. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-repair-air-warning [PLAY-TELEMETRIA-04] es-AR: «Si el sistema está averiado, esta reparación dejaría {aire_final} min. Necesitás terminar con aire disponible.» | en: «If the system is faulty, this repair would leave {aire_final} min. You need to finish with air remaining.» | contexto: Acierto diagnóstico y supervivencia son estados distintos. ANTES de actuar, usar sólo aire y costes VISIBLES: aire_final=aire−R expresa la hipótesis explícita de avería; aire_final_acierto=aire−R y aire_final_error=aire−(R+Rx) presentan ambos escenarios. No elegir/mostrar una cifra ni disparar una advertencia según el estado oculto real. Avisar de riesgo cuando cualquiera de los escenarios públicos agote el aire. DESPUÉS de actuar, el resultado sí puede explicar la reparación real. NUCLEO.aplicar comprueba aire<=0 antes de real===0: reparación correcta con 0 pierde. ariaRepairOk anuncia reparación, no victoria. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'aire_final', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-repair-air-scenarios [PLAY-TELEMETRIA-04] es-AR: «Si hay avería, quedarían {aire_final_acierto} min. Si no hay avería, quedarían {aire_final_error} min. Llegar a 0 min o menos termina la partida.» | en: «If there is a fault, {aire_final_acierto} min would remain. If there is no fault, {aire_final_error} min would remain. Reaching 0 min or less ends the game.» | contexto: Acierto diagnóstico y supervivencia son estados distintos. ANTES de actuar, usar sólo aire y costes VISIBLES: aire_final=aire−R expresa la hipótesis explícita de avería; aire_final_acierto=aire−R y aire_final_error=aire−(R+Rx) presentan ambos escenarios. No elegir/mostrar una cifra ni disparar una advertencia según el estado oculto real. Avisar de riesgo cuando cualquiera de los escenarios públicos agote el aire. DESPUÉS de actuar, el resultado sí puede explicar la reparación real. NUCLEO.aplicar comprueba aire<=0 antes de real===0: reparación correcta con 0 pierde. ariaRepairOk anuncia reparación, no victoria. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'aire_final_acierto', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'aire_final_error', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-fault-repaired [PLAY-TELEMETRIA-04] es-AR: «Avería reparada: {sistema}.» | en: «Fault repaired: {sistema}.» | contexto: Acierto diagnóstico y supervivencia son estados distintos. ANTES de actuar, usar sólo aire y costes VISIBLES: aire_final=aire−R expresa la hipótesis explícita de avería; aire_final_acierto=aire−R y aire_final_error=aire−(R+Rx) presentan ambos escenarios. No elegir/mostrar una cifra ni disparar una advertencia según el estado oculto real. Avisar de riesgo cuando cualquiera de los escenarios públicos agote el aire. DESPUÉS de actuar, el resultado sí puede explicar la reparación real. NUCLEO.aplicar comprueba aire<=0 antes de real===0: reparación correcta con 0 pierde. ariaRepairOk anuncia reparación, no victoria. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'sistema', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-repair-no-air [PLAY-TELEMETRIA-04] es-AR: «Reparaste {sistema}, pero agotaste el aire.» | en: «You repaired {sistema}, but ran out of air.» | contexto: Acierto diagnóstico y supervivencia son estados distintos. ANTES de actuar, usar sólo aire y costes VISIBLES: aire_final=aire−R expresa la hipótesis explícita de avería; aire_final_acierto=aire−R y aire_final_error=aire−(R+Rx) presentan ambos escenarios. No elegir/mostrar una cifra ni disparar una advertencia según el estado oculto real. Avisar de riesgo cuando cualquiera de los escenarios públicos agote el aire. DESPUÉS de actuar, el resultado sí puede explicar la reparación real. NUCLEO.aplicar comprueba aire<=0 antes de real===0: reparación correcta con 0 pierde. ariaRepairOk anuncia reparación, no victoria. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'sistema', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-other-case [PLAY-TELEMETRIA-05] es-AR: «Elegir otro caso» | en: «Choose another case» | contexto: Sólo si capítulo/reglas permiten elegir otro caso. Derrota: Reintentar caso primario y enfocado, no Siguiente caso como falsa aprobación. Victoria: Siguiente caso. Inicio del juego usa Volver al menú. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-earned-stars [PLAY-TELEMETRIA-06] es-AR: «{estrellas} de 3 estrellas» | en: «{estrellas} of 3 stars» | contexto: Estrellas NORMALES después de ganar: puntaje de decisiones 95–100→3, 80–94→2, 0–79→1; derrota→0. NO dependen de umbrales de minutos de aire. Para tut1/2, victoria→3 y derrota→0 sin este análisis; no mostrar metas normales allí. Fuera de tut1/2, pista aplica Math.min(est,2): no prometer 3 alcanzables si se usó pista. Requisitos de desbloqueo del capítulo se leen de la regla vigente y son otra métrica. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'estrellas', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-star-threshold [PLAY-TELEMETRIA-06] es-AR: «Para {objetivo} estrellas: ganá el caso y alcanzá un puntaje de decisiones de al menos {umbral_precision}/100.» | en: «For {objetivo} stars: win the case and reach a decision score of at least {umbral_precision}/100.» | contexto: Estrellas NORMALES después de ganar: puntaje de decisiones 95–100→3, 80–94→2, 0–79→1; derrota→0. NO dependen de umbrales de minutos de aire. Para tut1/2, victoria→3 y derrota→0 sin este análisis; no mostrar metas normales allí. Fuera de tut1/2, pista aplica Math.min(est,2): no prometer 3 alcanzables si se usó pista. Requisitos de desbloqueo del capítulo se leen de la regla vigente y son otra métrica. | condición: Sólo casos fuera de tut1/2, con objetivo=2 y umbral_precision=80, u objetivo=3 y umbral_precision=95. Se requiere victoria. Si G.pista=true, no presentar objetivo3 como alcanzable; mostrar límite2. No derivar umbral de aire ni leer verdad oculta. | params: [{'name': 'objetivo', 'binding': '2 o 3 estrellas según umbral real de ui.js827; no nueva constante configurable inventada.'}, {'name': 'umbral_precision', 'binding': '80 para 2 estrellas, 95 para 3, ui.js827. No minutos ni porcentaje de diagnósticos acertados.'}] | citas actuales: []
- COPY-telemetria-one-star-threshold [PLAY-TELEMETRIA-06] es-AR: «Para 1 estrella: ganá el caso.» | en: «For 1 star: win the case.» | contexto: Estrellas NORMALES después de ganar: puntaje de decisiones 95–100→3, 80–94→2, 0–79→1; derrota→0. NO dependen de umbrales de minutos de aire. Para tut1/2, victoria→3 y derrota→0 sin este análisis; no mostrar metas normales allí. Fuera de tut1/2, pista aplica Math.min(est,2): no prometer 3 alcanzables si se usó pista. Requisitos de desbloqueo del capítulo se leen de la regla vigente y son otra métrica. | condición: Sólo fuera de tut1/2; victoria con puntaje0–79 da1. Victoria con puntaje superior obtiene más estrellas según reglas. Derrota0, por alto que sea el puntaje. | params: [] | citas actuales: []
- COPY-telemetria-chapter-locked [PLAY-TELEMETRIA-06] es-AR: «Bloqueado: ganá {cantidad} casos del capítulo anterior.» | en: «Locked: win {cantidad} cases in the previous chapter.» | contexto: Estrellas NORMALES después de ganar: puntaje de decisiones 95–100→3, 80–94→2, 0–79→1; derrota→0. NO dependen de umbrales de minutos de aire. Para tut1/2, victoria→3 y derrota→0 sin este análisis; no mostrar metas normales allí. Fuera de tut1/2, pista aplica Math.min(est,2): no prometer 3 alcanzables si se usó pista. Requisitos de desbloqueo del capítulo se leen de la regla vigente y son otra métrica. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'cantidad', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-telemetria-one-case-unlock [PLAY-TELEMETRIA-06] es-AR: «Bloqueado: ganá 1 caso del capítulo anterior.» | en: «Locked: win 1 case in the previous chapter.» | contexto: Estrellas NORMALES después de ganar: puntaje de decisiones 95–100→3, 80–94→2, 0–79→1; derrota→0. NO dependen de umbrales de minutos de aire. Para tut1/2, victoria→3 y derrota→0 sin este análisis; no mostrar metas normales allí. Fuera de tut1/2, pista aplica Math.min(est,2): no prometer 3 alcanzables si se usó pista. Requisitos de desbloqueo del capítulo se leen de la regla vigente y son otra métrica. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-air-risk-even-correct [PLAY-TELEMETRIA-04] es-AR: «Esta acción agota el aire incluso si acertás.» | en: «This action uses up your air even if you repair the faulty system.» | contexto: Sólo si aire visible<=caso.R. Se deduce del mínimo coste público, sin consultar avería oculta. No es un mensaje de resultado ni revela si el sistema elegido está averiado. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-decision-score [PLAY-TELEMETRIA-06] es-AR: «Puntaje de decisiones: {prec}/100» | en: «Decision score: {prec}/100» | contexto: Fuente ui.js811–829 y piloto.js159–167. Evaluador aproximado, profundidad limitada. arrep=max(0,V−qExtra), pérdida de valor esperado frente a mejor acción evaluada con la información previa del paso. arr=sum(arrep); norm=max(8,ini.V−ini.hoja); prec=clamp(round(100*(1−arr/norm)),0,100). hoja es política de reparar por sospecha descendente sin más lecturas. No es tasa de diagnósticos ni porcentaje de aire conservado; no cambiar fórmula por copy. | condición: Sólo cuando G.res.prec es numérico y análisis disponible, fuera de tut1/2. No formatear null como0 ni como100. | params: [{'name': 'prec', 'binding': 'prec = G.res.prec, entero0–100 calculado tras análisis asíncrono; mantener {prec} en ambos idiomas.'}] | citas actuales: []
- COPY-telemetria-decision-score-help [PLAY-TELEMETRIA-06] es-AR: «Compara tus decisiones con las opciones evaluadas por el piloto automático según la información disponible en cada paso. Es una estimación, no un porcentaje de diagnósticos acertados.» | en: «Compares your decisions with the options evaluated by the autopilot using the information available at each step. It is an estimate, not the percentage of correct diagnoses.» | contexto: Fuente ui.js811–829 y piloto.js159–167. Evaluador aproximado, profundidad limitada. arrep=max(0,V−qExtra), pérdida de valor esperado frente a mejor acción evaluada con la información previa del paso. arr=sum(arrep); norm=max(8,ini.V−ini.hoja); prec=clamp(round(100*(1−arr/norm)),0,100). hoja es política de reparar por sospecha descendente sin más lecturas. No es tasa de diagnósticos ni porcentaje de aire conservado; no cambiar fórmula por copy. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-telemetria-decision-score-pending [PLAY-TELEMETRIA-06] es-AR: «Calculando puntaje de decisiones…» | en: «Calculating decision score…» | contexto: Fuente ui.js811–829 y piloto.js159–167. Evaluador aproximado, profundidad limitada. arrep=max(0,V−qExtra), pérdida de valor esperado frente a mejor acción evaluada con la información previa del paso. arr=sum(arrep); norm=max(8,ini.V−ini.hoja); prec=clamp(round(100*(1−arr/norm)),0,100). hoja es política de reparar por sospecha descendente sin más lecturas. No es tasa de diagnósticos ni porcentaje de aire conservado; no cambiar fórmula por copy. | condición: Sólo mientras el análisis real está pendiente; no mostrar cifra/estrellas de análisis como definitivas antes de resolver. No añadir análisis a tut1/2. | params: [] | citas actuales: []
- COPY-telemetria-tutorial-stars [PLAY-TELEMETRIA-06] es-AR: «En este tutorial: 3 estrellas si ganás; 0 si perdés.» | en: «In this tutorial: 3 stars if you win; 0 if you lose.» | contexto: Fuente ui.js811–829 y piloto.js159–167. Evaluador aproximado, profundidad limitada. arrep=max(0,V−qExtra), pérdida de valor esperado frente a mejor acción evaluada con la información previa del paso. arr=sum(arrep); norm=max(8,ini.V−ini.hoja); prec=clamp(round(100*(1−arr/norm)),0,100). hoja es política de reparar por sospecha descendente sin más lecturas. No es tasa de diagnósticos ni porcentaje de aire conservado; no cambiar fórmula por copy. | condición: Sólo G.tpl.tut===1 o ===2. Estos tutoriales usan victoria3/derrota0 y ocultan/impiden pista; no aplicarles las metas95/80. | params: [] | citas actuales: []
- COPY-telemetria-highest-probability [VIS-TELEMETRIA-01] es-AR: «Mayor probabilidad» | en: «Highest probability» | contexto: Rótulo del estado top ya expuesto por la UI, no confirmación de avería/reparación. Conservar m[q], top y empates según modelo visible, sin calcular una solución nueva. No usar✓ ni▲ como marca de probabilidad: representan otros estados. | condición: Sólo donde ese estado ya se muestra y fuera de cualquier ocultación de Veterano. No revelar una probabilidad o clasificación oculta a través de nombre accesible, leyenda, tooltip o texto. | params: [] | citas actuales: []
- COPY-telemetria-alert-legend [VIS-TELEMETRIA-02] es-AR: «▲ Alerta» | en: «▲ Alert» | contexto: Leyenda del significado existente de los símbolos de previsión/respuesta del sensor; no convertir▲ en mayor probabilidad ni○ en sistema reparado. No añade valores, porcentajes ni diagnósticos. | condición: Junto a la zona de sensores cuando las previsiones correspondientes están permitidas. Conservar body.vet/body.pct; no usar leyenda ni ticks para filtrar información que el modo oculta. | params: [] | citas actuales: []
- COPY-telemetria-normal-legend [VIS-TELEMETRIA-02] es-AR: «○ Normal» | en: «○ Normal» | contexto: Leyenda del significado existente de los símbolos de previsión/respuesta del sensor; no convertir▲ en mayor probabilidad ni○ en sistema reparado. No añade valores, porcentajes ni diagnósticos. | condición: Junto a la zona de sensores cuando las previsiones correspondientes están permitidas. Conservar body.vet/body.pct; no usar leyenda ni ticks para filtrar información que el modo oculta. | params: [] | citas actuales: []
