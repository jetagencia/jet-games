# crater: 17 registros del catálogo, 35 copys

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

## [VIS-CRATER-01] P1 · active_proposal · Dirección visual interna
**Plano de la base: sustituir el aspecto de prototipo sin redibujar el grafo**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano(ronda,lado,lang,dpr)
ui_audit/source_review/current_1410/crater__crater__src__gen.js :: genBase
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: MOD
Estado identificado en la revisión: Referencia visual exacta: ui_audit/reference/image(20261022-142307).png. Es Cráter ronda base, NO Estación Silencio. plano usa fondo #0b0620; rejilla menor rgba(119,0,244,.13) con 20 divisiones, mayor .26 con 4; pasillos de .05*s en #2a1f4a, .03*s en #3d2f6b y centro cian discontinuo; módulos repetidos #2e2356→#171030 con borde #8a78c9 a max(1.2,.005*s). La imagen muestra la misma solución. La uniformidad de contornos intensos, cuadrícula, chips negros y grandes halos aplana la jerarquía; esto es juicio de dirección de arte, no defecto funcional.
- Instrucción: Crear constantes MAP_ART locales a mapa.js y sustituir únicamente pintura de plano, no generación. Orden: (1) fondo #0B1220; (2) viñeta negra máxima .20, sin textura aleatoria nueva; (3) conservar exactamente divisiones y coordenadas de rejilla, menor #8FA9BD con alfa .045 y mayor alfa .085, ambas 1 CSS px; (4) pasillos; (5) sombra y cuerpos; (6) detalles existentes; (7) etiquetas; (8) estados en dibujar. Mantener clara diferencia entre fondo, estructura y estado. Prohibido aplicar filtro de color al canvas completo. En plano, s/lado son píxeles del backing canvas; CSSW=s/dpr. Todo valor de trazo tipográfico especificado en CSS px debe multiplicarse por dpr; coordenadas normalizadas siguen multiplicadas por s. Versionar MAP_ART, incluir versión en key de CACHE y limpiar caché al cambiar tema.
- Copy: 
- Aceptación: Renderizar la misma ronda con artVersion antigua/nueva y exportar JSON op+pasillos: igualdad profunda exacta.
Recrear captura del usuario y compararla a 390/768/1180 CSS px, DPR 1 y DPR 2. Las 6 etiquetas, 6 módulos y 5 pasillos de ESA imagen permanecen, sin imponer estos recuentos a otras semillas.
Verificar que mayor contraste pertenece a módulos/texto/estado, no a rejilla; ninguna estrella o textura nueva puede parecer un destino.
No desplegar nuevo arte sobre ronda activa con votos anteriores sin estrategia de versión/cohorte aprobada.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano(ronda,lado,lang,dpr)
ui_audit/source_review/current_1410/crater__crater__src__gen.js :: genBase
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: MOD
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No tocar ronda.op, ronda.pasillos, semilla, micro, orden de opciones, x/y/w/h/forma/mod/puerta, textos ni RNG. No regularizar posiciones a cuadrícula nueva. Cráter es un juego de coordinación por saliencia: el aspecto también influye en votos; no mezclar estadísticas de dos artVersion en una misma comparación. No inferir iconografía por el nombre: las formas se sortean y Hangar puede ser torre.

## [VIS-CRATER-02] P1 · active_proposal · Dirección visual interna
**Pasillos: infraestructura legible, no carretera punteada**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // pasillos
Estado identificado en la revisión: Dos bandas lilas con ancho .05*s/.03*s y línea central rgba(0,242,207,.35), dash [.012*s,.014*s], ancho max(1,.004*s).
- Instrucción: Conservar el trazado de cada segmento exactamente entre A y B, incluidas diagonales. Dibujar banda exterior #172638 al mismo ancho .05*s y banda interior #273C50 al mismo ancho .03*s; reducir saturación, no anchura/topología. Sustituir guiones cian por una línea central continua #8097A8 de 1 CSS px y alfa .32. No animar ni poner flechas de flujo. LineCap round y lineJoin round. El corredor termina visualmente bajo el módulo como ahora; no añadir uniones o ramales. Si el equipo determina que la línea discontinua es señal semántica, conservar su dash actual y cambiar solo color/alfa a #8097A8/.32.
- Copy: 
- Aceptación: Para cada [a,b], comprobar extremos de centerline contra ronda.op; diferencia 0 en coordenadas.
Ningún segmento cruza por encima de cuerpos o etiquetas después del orden de capas.
En blanco y negro siguen distinguiéndose corredor y módulo; no sugerir dirección de viaje.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // pasillos
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Preservar número de conexiones, ángulos, intersecciones y distancia relativa. No confundir cruces sin nodo con nuevas conexiones. No desplazar caminos para embellecer.

## [VIS-CRATER-03] P1 · active_proposal · Dirección visual interna
**Módulos: profundidad delicada y familia de materiales, no nuevos símbolos**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // módulos
Estado identificado en la revisión: Formas domo/torre son círculos; resto rr con radio .016*s. Mismo degradado diagonal; sombra blur .02*s y offset .006*s. Domo conserva dos círculos interiores y cruceta; torre antena y punto rojo; rect tiene exactamente tres ventanas; grande una división horizontal.
- Instrucción: Conservar siluetas y dimensiones al píxel lógico. Cambiar relleno a degradado vertical #26384A→#162433. Cambiar borde normal a #7693A8, 1.5 CSS px, no 0.5% del tablero; añadir SOLO un reflejo interior superior de .75 CSS px, blanco alfa .14, recortado a la silueta, sin nuevos objetos. Sombra negra alfa .28, blur 8 CSS px y desplazamiento Y 3 CSS px igual en todos. Radio existente intacto. Ventanas conservan 3 posiciones/tamaños y color cian funcional, pero evitar glow añadido. Domo: mismos dos anillos/cruceta al mismo radio/posición; trazos 1 CSS px #9DB4C4 alfa .35, reflejo radial máximo .18 en lugar de .45. Torre: mismo extremo/ángulo de antena; línea 1.5 CSS px #C7D7E2 y punto rojo #ff4466 sin halo. Grande mantiene división a y+h*.18. Puerta amarilla conserva dirección, tamaño y color originales. No agregar pictogramas de cama, pesas, caja o planeta por nombre: serían nuevas saliencias.
- Copy: 
- Aceptación: Comparar sólo la máscara geométrica de cuerpos/path SIN stroke, sombra ni reflejos: cobertura exactamente igual. Verificar por separado que borde, sombra y reflejo cumplen los nuevos parámetros; no exigir igualdad raster del acabado que se está cambiando.
Snapshots con todas las formas y puertas N/S/E/O; ninguna marca desaparece.
Revisar que la primera propuesta no haga el domo tan tenue que deje de distinguirse del rectángulo; validar distribución por artVersion antes de publicar.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // módulos
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No reducir el tamaño del Observatorio/domo aunque parezca radar excesivo: diámetro y unicidad son parte de la elección. No igualar todas las formas ni convertir torre en hangar literal. No alterar número de anillos, ventanas, líneas internas o puertas.

## [VIS-CRATER-04] P1 · active_proposal · Dirección visual interna
**Etiquetas del plano: rotulación cartográfica sin parches negros**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // nombres
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: MOD
Estado identificado en la revisión: Texto Poppins 600, fz=clamp(s/dpr*.038,11,15)*dpr. Cada línea tiene rect negro rgba(5,1,8,.78) con padding 5*dpr/4*dpr, texto #e9e3ff; oculta todos los nombres si s/dpr<170; salto de línea basado en 27% de s.
- Instrucción: Mantener exactamente fuente de nombres BAN.MOD y traducciones, sin abreviarlos. Rotular Poppins 600 a clamp(CSSW*.038,12,15) CSS px (firma local clamp(valor,mínimo,máximo), no sintaxis CSS), #E7EFF5, interlínea 1.25. Separación del edificio a etiqueta 8 CSS px, alineación centrada en el mismo x. Fondo único por etiqueta multilínea, no un chip por renglón: #0B1220 alfa .82, radio 4 CSS px, padding horizontal 6 y vertical 3 CSS px, SIN borde ni glow. Es una superficie de respaldo discreta que solo se dibuja si hay corredor/edificio bajo el texto; sobre fondo limpio usar texto directo con sombra 0 1 px 2 px negro .35. Mantener el punto de anclaje y no mover el módulo. Aplicar collision check de cajas de etiquetas: si no cabe texto completo, permitir dos líneas conservando palabras y aumentar área disponible del mapa, no ocultar una etiqueta ni cambiar por icono. Para captura: Hangar; Puente de mando; Gimnasio; Almacén; Observatorio; Dormitorios. Puente de mando puede partirse en «Puente de» / «mando», no reescribirse.
- Copy: 
- Aceptación: Los seis nombres de referencia coinciden carácter por carácter; comprobar acento en Almacén.
ES y EN, todos los 12 MOD y semillas 6–9 módulos: ni recorte ni solapamiento etiqueta-etiqueta; ningún título pegado a otro destino.
Contraste medido de texto normal mínimo 4.5:1 sobre el píxel de fondo compuesto, no solo hexadecimal nominal.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: plano, bloque // nombres
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: MOD
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Textos y correspondencia módulo→nombre permanecen; etiquetas son información del juego. No suprimir nombres pequeños con nueva lógica; si el modo mini original los oculta, mantener mini y ofrecer representación textual equivalente en el modo de selección, sin añadir pistas.

## [VIS-CRATER-05] P1 · active_proposal · Dirección visual interna
**Leyenda y estados: distinguir foco, elección y resultado sin saturar el mapa**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: dibujar / anillo / coronita
ui_audit/source_review/current_1410/crater__crater__src__estilo.css :: .leyenda, .res, .plat.sel, .plat.gana
Estado identificado en la revisión: hover lila 2 px+5; foco cian 2 px+9 dash[5,4]; seleccionado pulso 2.5+kpx halo 10–20; ganador halo 18/corona; propio amarillo punteado a 12. .leyenda ya existe para revelación.
- Instrucción: Definir tabla de estados, aplicada solo cuando el estado existente sea real: reposo sin halo; hover borde #9FB5C6 1.5 px offset 4; foco teclado anillo exterior blanco 2 px+offset 8 y dash[4,3]; seleccionado cian original 2.5 px offset 4, relleno cian alfa .06 y marca visual de elección en panel textual; resultado ganador conservar corona cian pero halo máximo 6 px; elección propia mantener amarillo original punteado para que difiera de ganador. Evitar acumular 5 anillos: prioridad visual foco > selección > hover, pero no ocultar el marcador de ganador/propio en revelación. Añadir en el panel de ronda una leyenda pequeña con muestras y textos «Tu elección»/«Foco de teclado» solo cuando corresponda; la revelación puede mostrar «Tu elección»/«Más elegido». No usar leyenda de hábitats ni categorías que indique dónde elegir. Mantener etiquetas a salvo del astronauta, la corona y los porcentajes.
- Copy: 
- Aceptación: Probar reposo/hover/foco/selección/revelación/mio≠ganador/múltiples ganadores.
Teclado y puntero activan el mismo índice antes/después; ejecutar elegirEn con una malla de puntos y comparar resultados exactos.
Con reduced-motion: selección estática 2.5 px sin pulso, sin eliminar marca de elección.
Leyenda no tapa el mapa ni introduce texto de pista.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: dibujar / anillo / coronita
ui_audit/source_review/current_1410/crater__crater__src__estilo.css :: .leyenda, .res, .plat.sel, .plat.gana
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No crear ganador antes de revelación ni dar información de mayoría prematura. No modificar st.sel/hover/foco/ganadores/mio ni condiciones de activación. No pintar otras opciones como deshabilitadas cuando aún se pueden elegir.

## [PLAY-CRATER-01] P2 · active · Prueba interactiva y propuestas
**Separar práctica completa y participación diaria**
- Actual: La primera visita abre un ensayo de una sola ronda. Tras el resultado la única acción principal es Jugar el día #1. Inicio no ofrece modo de práctica de siete rondas y Archivo está vacío hoy.
- Instrucción: Separar dos alcances. Corrección del onboarding actual: mantener «Repetir ensayo» para la introducción corta y añadir «Volver al menú» al terminarla; no convertir automáticamente un ensayo en participación diaria. Propuesta opcional de producto, pendiente de decisión: una práctica completa, explícitamente local, con todas las familias de ronda y resultados simulados claramente separados del día. Esa práctica no es un modo existente que pueda habilitarse cambiando una etiqueta, ni un requisito para corregir la interfaz actual. Ofrecer «Practicar sin enviar respuestas» sólo si se aprueba, implementa y valida el nuevo flujo local.
- Copy: Practicar sin enviar respuestas
Repetir ensayo
Volver al menú
Jugar el día #{día}
- Aceptación: Onboarding actual: «Repetir ensayo» vuelve a la introducción y «Volver al menú» regresa al menú sin iniciar el día. Sólo si se aprueba e implementa la práctica completa opcional: recorrer sus siete rondas sin POST de votos ni cola de envío. La corrección de la interfaz existente no depende de aprobar ese modo nuevo.
- Referencias: evidence/crater-rehearsal-result.jpg
evidence/crater-pass2-rehearsal-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:58:00Z/2026-10-22T15:04:00Z
La práctica local completa es una ampliación funcional opcional y pendiente de decisión; no es un requisito para corregir el onboarding existente ni una función o prueba ya disponible.

## [PLAY-CRATER-02] P2 · active · Prueba interactiva y propuestas
**Distinguir selección y confirmación irreversible**
- Actual: El tutorial dice Confirma con «Aterrizar» (o tocando otra vez). Tu elección queda registrada y no se cambia. El mismo toque selecciona y un segundo toque confirma, con riesgo de doble clic accidental.
- Instrucción: Usar el mapa exclusivamente para seleccionar una opción o cambiar la selección. Confirmar sólo mediante un botón explícito, indicando la opción y la consecuencia antes del registro o envío correspondiente al modo. Si se conserva Enter, impedir que confirme por repetición de tecla o por un foco heredado.
- Copy: Confirmar aterrizaje
Elegiste: {opción}. Una vez confirmada, no vas a poder cambiarla.
- Aceptación: El doble clic y el doble toque sobre una opción no confirman ni envían una respuesta. La confirmación explícita registra una única respuesta por el mecanismo del modo correspondiente. Ensayo y diario comunican sus diferencias de persistencia.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:58:00Z/2026-10-22T15:04:00Z

## [PLAY-CRATER-03] P2 · active · Prueba interactiva y propuestas
**Aclarar origen y fecha de los porcentajes**
- Actual: Ensayo muestra 65 % eligió el cráter grande y porcentajes en mapa. Inicio dice Aún somos pocos · rivales de práctica activos. Ajustes ofrece Ver solo jugadores reales sin explicar cómo cambia resultados. Tutorial dice A medianoche sin zona horaria.
- Instrucción: En el ensayo, etiquetar los porcentajes como simulados. Cuando se mezclen datos reales y simulados, separar sus conteos y explicar el filtro sin prometer una población inexistente. Respuestas registradas y participantes únicos no son equivalentes: usar la unidad que realmente devuelvan y documenten los datos, sin inventar un recuento de personas únicas. Vincular cada etiqueta propuesta a esa unidad; no llamar «jugadores» a un conteo de respuestas ni a la inversa. Mostrar la hora de cierre con zona horaria y fecha completa, no sólo «medianoche».
- Copy: Resultado del ensayo · datos simulados
Respuestas reales: {n}
Rivales de práctica: {n}
La revelación se habilita el {fecha} a las {hora} ({zona}).
- Aceptación: El 65 % observado en el ensayo no se interpreta como un voto mundial real. Al cambiar el filtro, se entiende el denominador usado. La fecha y hora de cierre son inequívocas para usuarios en distintas zonas horarias.
- Referencias: evidence/crater-rehearsal-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:58:00Z/2026-10-22T15:04:00Z

## [PLAY-CRATER-04] P2 · active · Prueba interactiva y propuestas
**Resultado propio y mayoritario diferenciados**
- Actual: En la segunda pasada se eligió la opción con 9 %, pero la tarjeta usa la misma marca turquesa y enfatiza sólo el 65 % de la mayoría; la coincidencia de la elección propia sólo se lee en el mapa.
- Instrucción: Mostrar en la tarjeta la selección propia, su porcentaje de coincidencia y la opción mayoritaria, con textos neutrales y no sólo un icono de éxito. Mantener la geometría del mapa y las áreas relativas de los cráteres, que forman parte de la regla.
- Copy: Tu elección: {opción} · coincidencia {porcentaje} %
La opción más elegida: {mayoría} · {porcentajeMayoría} %
Ensayo completado
- Aceptación: Ambos resultados se entienden sin depender del color ni de localizar al astronauta en el mapa. No se altera el peso visual de las pistas.
- Referencias: evidence/crater-pass2-rehearsal-result.jpg
- Notas: Ventana de observación: 2026-10-22T14:58:00Z/2026-10-22T15:04:00Z

## [PLAY-CRATER-05] P2 · active · Prueba interactiva y propuestas
**Diálogos y avisos accesibles sin contexto obsoleto**
- Actual: El árbol de accesibilidad mantiene los botones de opción y los controles del fondo durante Ajustes/Pausa. El aviso Nueva tarjeta en tu Cuaderno: El gigante seguía en ese árbol durante el segundo ensayo, aunque ya no era visible.
- Instrucción: Marcar inert el fondo del diálogo y restaurar el foco al cerrarlo. Limpiar o actualizar los mensajes transitorios al cambiar de pantalla. Conservar el historial de tarjetas en Perfil/Cuaderno, no como un aviso activo indefinidamente.
- Copy: Nueva tarjeta: {nombre}
Ver en el cuaderno
- Aceptación: El lector no interactúa con el mapa detrás del diálogo ni vuelve a anunciar una tarjeta anterior al iniciar otro ensayo.
- Referencias: 
- Notas: Ventana de observación: 2026-10-22T14:58:00Z/2026-10-22T15:04:00Z

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

## [SRC-CR01] P2 · active_source_finding · Texto, estados y flujo
**Revelación diaria y humanos/simulados**
- Actual: Tu primera revelación llega a medianoche; En vivo: ... cierra a las {h}; Aún somos pocos...
- Instrucción: Mostrar fecha, hora y zona horaria calculadas por la lógica vigente, junto al contador y estado provisional/final. No confundir medianoche local con cierre por otras zonas horarias. Mantener la etiqueta de rivales simulados junto al resultado y en el texto compartido, sin modificar la ventana de juego.
- Copy: Revelación: {fecha} a las {hora} ({zona horaria}) / Resultado provisional / {n} jugadores reales · {m} rivales simulados
- Aceptación: Alrededor del cambio de día y zona horaria, fecha, contador y estado concuerdan. Un resultado completado con bots siempre lo indica. El filtro de jugadores reales vacío no muestra una mayoría inventada.
- Referencias: https://jetgames.fun/crater/src/textos.js?v=3 — firstReveal/how3/live/liveShort/few
- Notas: Recomendación de texto y estado; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [SRC-CR02] P2 · active_source_finding · Texto, estados y flujo
**compartir catch**
- Actual: Si falla el copiado se muestra el texto completo en un toast de 5 segundos.
- Instrucción: Ofrecer texto seleccionable persistente, no un toast efímero. Como recomendación adicional, la confirmación de aterrizaje debe recordar que no se puede cambiar y evitar que el doble toque accidental fije una elección.
- Copy: Compartir resultado / No pudimos copiarlo automáticamente. Seleccioná y copiá este texto.
- Aceptación: Con clipboard bloqueado se puede copiar el resultado completo. Cancelar el diálogo nativo no muestra error ni éxito. Arrastrar para explorar no confirma accidentalmente una elección.
- Referencias: https://jetgames.fun/crater/src/ui.js?v=5 —360–366
- Notas: Riesgo confirmado en fuente; Revalidación HTTP de sólo lectura 2026-10-22 14:10–14:15 UTC. Las fuentes iniciales permanecen intactas. No se jugó desde este revisor.

## [VIS-CRATER-06] P2 · active_proposal · Dirección visual interna
**Terreno lunar y planetario: conservar las pistas y rebajar ruido ambiental**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: terreno, dibCrater, fondo
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: PLANETAS
Estado identificado en la revisión: Terreno usa PAL_LUNA suelo #211b2e/#3a3150/#5e5577 y cráter #1a1526; noise96 px/3 octavas, microcráteres 180/240/380; excluye opciones a radio 1.25. Rasgos oval/rayos/oscuro/hielo/doble/pico y cañón son pistas dibujadas explícitamente. Fondo estrellas hasta 420, Luna grande, fugaces.
- Instrucción: No sustituir terreno por una imagen IA no verificable. Mantener paletas PLANETAS por mundo y pistas de dibCrater intactas. Reducir solo amplitud/opacidad de microcráteres decorativos: globalAlpha .10–.20 en vez de .18–.43; excluirlos a 1.6×radio de opciones en lugar de 1.25× si tests confirman que no suprime pistas. Luz coherente desde arriba-izquierda, conservar sombras internas como ahora. Mantener trazos diagnósticos de hielo/doble/rayos/oval; no homogeneizar colores. En fondo durante elección, fijar estrellas en alfa .18–.38 y tamaño máximo 1.2 px, sin fugaces durante interacción; permitir animación leve en portada o transición. No alterar Luna/terreno al redimensionar una misma ronda: caché por semilla/tamaño/arte.
- Copy: 
- Aceptación: Misma semilla produce mismos centros/radios/rasgos/cañón; exportación datos idéntica.
Comparar cada rasgo en miniatura y zoom: sigue reconocible, sin nuevas marcas que parezcan opción.
Reducir movimiento respeta revelación/cobertura de polvo y no adelanta información.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__mapa.js :: terreno, dibCrater, fondo
ui_audit/source_review/current_1410/crater__crater__src__bancos.js :: PLANETAS
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: No quitar ni recolorear rasgos jugables, no inventar cráteres seleccionables, no cambiar radios o desigualdades de tamaño. No tocar los colores de ronda tipo color. La exclusión decorativa requiere comparativa porque también puede afectar saliencia.

## [VIS-CRATER-07] P2 · active_proposal · Dirección visual interna
**Plataformas, panel de consigna y revelación con jerarquía editorial**
- Actual: Base de evidencia: sólo fuente, salvo que se cite explícitamente una captura.
Ubicación de implementación: ui_audit/source_review/current_1410/crater__crater__src__estilo.css :: .consigna, .plat, .plat .n, .plat .w, .plat .baliza, .res, .rev .veredicto, .mini
Estado identificado en la revisión: Consigna radio 18 px, padding 11/14/12; plataformas degradado #2a1f4a→#160f2c y glow cian en pseudoelmento; .plat .baliza glow22 px en var(--c); número peso 800, palabra 700; porcentajes y astronauta reposicionan contenido al seleccionar.
- Instrucción: Panel de consigna: #132130 con borde #304454 de 1 px, radio 14 px y padding 14–16 px; título 18/1.3 peso 650 (usar 600 si fuente no ofrece 650), explicación 14/1.5 #B4C3CE. Tarjetas de número/palabra mismo material #172838→#101D2B, borde 1 px #3C5366, radio 12 px; eliminar halo de .plat::after en reposo, conservar sombra 0 4 px 10 px negro .18. No cambiar font-size relativo entre números/palabras si forma parte de saliencia hasta revisarlo; mantener actuales tamaños como base. Balizas retienen exactamente var(--c) y círculos iguales; glow reposo 8 px a .25, borde neutro 1 px; no usar saturate/filter. Resultado: una sola cifra dominante (24–28 px mono), texto 15 px y separación 12 px, no sucesión de tarjetas brillantes. Espaciado 8/12/16 px consistente y máximo un CTA primario visual en panel. Mantener superficie seleccionada inequívoca sin mover el texto encima del astronauta.
- Copy: 
- Aceptación: Snapshots num/color/palabra/base/gran antes y después, con y sin selección.
Todos los valores se leen completos al 200% de zoom; porcentajes y cifras conservan decimales/redondeos actuales.
Rendimiento: ningún shadowBlur por fotograma nuevo en fondo; paneles no activan layout de toda la escena.
- Referencias: ui_audit/source_review/current_1410/crater__crater__src__estilo.css :: .consigna, .plat, .plat .n, .plat .w, .plat .baliza, .res, .rev .veredicto, .mini
- Notas: Propuesta de dirección visual, no un fallo funcional confirmado. Implementación y pruebas de aceptación pendientes.
- Preservar: Valores numéricos, palabras, colores, tamaños relativos, posiciones y orden idénticos. No convertir un color en CTA o favorecerlo por distinta sombra.

# Copys ES/EN aplicables
- COPY-common-cancel [SRC-G04, SRC-R02, SRC-AN01, SRC-E02, SRC-BE01, SRC-BE02, RSP-MODALS-01, RSP-BALIZAS-02, PLAY-BALIZAS-05] es-AR: «Cancelar» | en: «Cancel» | contexto: Cancelación real: no cobrar, borrar, publicar, fusionar ni sustituir estado. Foco inicial en confirmaciones destructivas. Rocket: confirmación actual queda armada con resetState===1, numérico y sin timeout; abrir Ajustes restablece0. Sustituirla por diálogo explícito/cancelable, no referirse a resetConfirm inexistente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-share [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Compartir resultado» | en: «Share result» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-failed [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «No pudimos copiarlo automáticamente. Seleccioná y copiá este texto.» | en: «We couldn’t copy it automatically. Select and copy this text.» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copy-text [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Copiar texto» | en: «Copy text» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-close [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Cerrar» | en: «Close» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-common-copied [SRC-G06, SRC-W02, SRC-CR02, SRC-FR02, SRC-BA02] es-AR: «Texto copiado» | en: «Text copied» | contexto: Fallback persistente con resultado íntegro seleccionable. Éxito sólo tras confirmación de la operación; cancelar share no muestra error ni éxito. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-reveal-time [SRC-CR01, SRC-CR02] es-AR: «Revelación: {fecha} a las {hora} ({zona horaria})» | en: «Reveal: {fecha} at {hora} ({zona horaria})» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'fecha', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'hora', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'zona horaria', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-provisional [SRC-CR01, SRC-CR02] es-AR: «Resultado provisional» | en: «Provisional result» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-final [SRC-CR01, SRC-CR02] es-AR: «Resultado final» | en: «Final result» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-player-mix [SRC-CR01, SRC-CR02] es-AR: «{n} jugadores reales · {m} rivales simulados» | en: «{n} real players · {m} simulated opponents» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. Usar jugadores reales sólo si los datos devuelven/documentan jugadores únicos. Un conteo de respuestas no demuestra ese conteo: en ese caso usar Respuestas reales: {n}, sin deducir personas únicas. | condición: Sólo cuando n y m no son 1. En singular componer con las ramas crater-one-real/crater-one-simulated y separador ·; no mostrar 1 jugadores/1 rivales. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'm', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-one-real [SRC-CR01, SRC-CR02] es-AR: «1 jugador real» | en: «1 real player» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. Usar jugadores reales sólo si los datos devuelven/documentan jugadores únicos. Un conteo de respuestas no demuestra ese conteo: en ese caso usar Respuestas reales: {n}, sin deducir personas únicas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-many-real [SRC-CR01, SRC-CR02] es-AR: «{n} jugadores reales» | en: «{n} real players» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. Usar jugadores reales sólo si los datos devuelven/documentan jugadores únicos. Un conteo de respuestas no demuestra ese conteo: en ese caso usar Respuestas reales: {n}, sin deducir personas únicas. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-one-simulated [SRC-CR01, SRC-CR02] es-AR: «1 rival simulado» | en: «1 simulated opponent» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. Confirmar que la unidad del dato es rival simulado; no sustituir automáticamente un conteo de respuestas simuladas por rivales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-many-simulated [SRC-CR01, SRC-CR02] es-AR: «{m} rivales simulados» | en: «{m} simulated opponents» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. Confirmar que la unidad del dato es rival simulado; no sustituir automáticamente un conteo de respuestas simuladas por rivales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'm', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-confirm-title [SRC-CR01, SRC-CR02] es-AR: «¿Confirmar este aterrizaje?» | en: «Confirm this landing?» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-confirm-body [SRC-CR01, SRC-CR02] es-AR: «Después de confirmar, no vas a poder cambiar tu elección.» | en: «Once confirmed, you won’t be able to change your choice.» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-confirm [SRC-CR01, SRC-CR02] es-AR: «Confirmar aterrizaje» | en: «Confirm landing» | contexto: Fecha/zona/contador desde lógica vigente, no medianoche local asumida. Formar mix con ramas plurales si n/m=1. Confirmación aterrizaje es recomendación adicional, sólo para elección irreversible real; no cambiar ronda.op/ronda.pasillos. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-new-local-practice [PLAY-CRATER-01] es-AR: «Practicar sin enviar respuestas» | en: «Practice without submitting answers» | contexto: Ensayo actual: introducción de una ronda Luna. Base no tiene hoy ruta local. «Practicar sin enviar respuestas» requiere implementar un modo NUEVO local completo y probar que no envíe POST de votos ni encole envíos. No obtenerlo renombrando Ensayo. | condición: AMPLIACIÓN OPCIONAL DE PRODUCTO, PENDIENTE DE DECISIÓN. No es condición para corregir la UI actual. Sólo si se adopta, implementar y validar las siete rondas locales sin POST de votos ni cola offline antes de habilitar esta etiqueta. No renombrar el ensayo actual para simular la función. | params: [] | citas actuales: []
- COPY-crater-replay-rehearsal [PLAY-CRATER-01] es-AR: «Repetir ensayo» | en: «Replay rehearsal» | contexto: Ensayo actual: introducción de una ronda Luna. Base no tiene hoy ruta local. «Practicar sin enviar respuestas» requiere implementar un modo NUEVO local completo y probar que no envíe POST de votos ni encole envíos. No obtenerlo renombrando Ensayo. | condición: Conectar al ensayo corto vigente o su salida real; no iniciar participación diaria automáticamente ni esperar al nuevo modo local completo. | params: [] | citas actuales: []
- COPY-crater-menu-after-rehearsal [PLAY-CRATER-01] es-AR: «Volver al menú» | en: «Back to menu» | contexto: Ensayo actual: introducción de una ronda Luna. Base no tiene hoy ruta local. «Practicar sin enviar respuestas» requiere implementar un modo NUEVO local completo y probar que no envíe POST de votos ni encole envíos. No obtenerlo renombrando Ensayo. | condición: Conectar al ensayo corto vigente o su salida real; no iniciar participación diaria automáticamente ni esperar al nuevo modo local completo. | params: [] | citas actuales: []
- COPY-crater-play-day [PLAY-CRATER-01] es-AR: «Jugar el día #{día}» | en: «Play day #{día}» | contexto: Ensayo actual: introducción de una ronda Luna. Base no tiene hoy ruta local. «Practicar sin enviar respuestas» requiere implementar un modo NUEVO local completo y probar que no envíe POST de votos ni encole envíos. No obtenerlo renombrando Ensayo. | condición: Participación diaria real; el botón no promete ausencia de envíos. No condicionarlo a que exista el nuevo modo local. | params: [{'name': 'día', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-choice-warning [PLAY-CRATER-02] es-AR: «Elegiste: {opción}. Una vez confirmada, no vas a poder cambiarla.» | en: «You chose: {opción}. Once confirmed, you won’t be able to change it.» | contexto: Selección en mapa no envía. Confirmar aterrizaje requiere acción nueva; en diario intenta POST y encola offline. Explicar persistencia diaria frente a ensayo; no llamar local al diario. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'opción', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-rehearsal-data [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «Resultado del ensayo · datos simulados» | en: «Rehearsal result · simulated data» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-real-responses [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «Respuestas reales: {n}» | en: «Real responses: {n}» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. Etiqueta para conteo de respuestas, no jugadores únicos. Confirmar la unidad del dato; no convertir entre respuestas y personas sin identidad/documentación suficiente. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-practice-opponents [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «Rivales de práctica: {n}» | en: «Practice opponents: {n}» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. Confirmar que la unidad del dato es rival simulado; no sustituir automáticamente un conteo de respuestas simuladas por rivales. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'n', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-reveal-enabled [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «La revelación se habilita el {fecha} a las {hora} ({zona}).» | en: «The reveal becomes available on {fecha} at {hora} ({zona}).» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'fecha', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'hora', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'zona', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-own-choice [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «Tu elección: {opción} · coincidencia {porcentaje} %» | en: «Your choice: {opción} · match rate {porcentaje}%» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'opción', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'porcentaje', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-majority [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «La opción más elegida: {mayoría} · {porcentajeMayoría} %» | en: «Most chosen option: {mayoría} · {porcentajeMayoría}%» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'mayoría', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}, {'name': 'porcentajeMayoría', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-rehearsal-complete [PLAY-CRATER-03, PLAY-CRATER-04] es-AR: «Ensayo completado» | en: «Rehearsal completed» | contexto: «Rivales de práctica activos» en el día describe origen de rivales, NO modo local. Denominador de porcentajes debe corresponder al filtro y no simular mayoría real inexistente. No fijar 65% ni 9%. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-new-card [PLAY-CRATER-05] es-AR: «Nueva tarjeta: {nombre}» | en: «New card: {nombre}» | contexto: Aviso de evento actual; limpiar al cambiar pantalla. Historial queda en Perfil/Cuaderno, no en live region obsoleta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [{'name': 'nombre', 'binding': 'Valor real del estado/configuración vigente; mantener el nombre del parámetro. No es un ejemplo fijo ni un pedido de renombrar variables del código.'}] | citas actuales: []
- COPY-crater-notebook [PLAY-CRATER-05] es-AR: «Ver en el cuaderno» | en: «View in notebook» | contexto: Aviso de evento actual; limpiar al cambiar pantalla. Historial queda en Perfil/Cuaderno, no en live region obsoleta. | condición: Sólo en el estado/acción descritos; enlazar al comportamiento real vigente. | params: [] | citas actuales: []
- COPY-crater-your-choice [VIS-CRATER-05] es-AR: «Tu elección» | en: «Your choice» | contexto: Leyenda de estados reales del panel, no categoría que sugiera dónde elegir. Tu elección corresponde a selección propia; foco a control realmente enfocado. Más elegido sólo después de revelar el resultado y con datos vigentes de la ronda. No confundir más elegido con mayoría absoluta, respuesta correcta o jugador único. | condición: Sólo si hay selección propia real, durante elección o revelación según el flujo; no elegir por el usuario ni mostrar votos ajenos antes de tiempo. | params: [] | citas actuales: []
- COPY-crater-keyboard-focus [VIS-CRATER-05] es-AR: «Foco de teclado» | en: «Keyboard focus» | contexto: Leyenda de estados reales del panel, no categoría que sugiera dónde elegir. Tu elección corresponde a selección propia; foco a control realmente enfocado. Más elegido sólo después de revelar el resultado y con datos vigentes de la ronda. No confundir más elegido con mayoría absoluta, respuesta correcta o jugador único. | condición: Sólo foco de teclado realmente activo/visible; no atribuir foco a hover, selección o resultado. | params: [] | citas actuales: []
- COPY-crater-most-chosen [VIS-CRATER-05] es-AR: «Más elegido» | en: «Most chosen» | contexto: Leyenda de estados reales del panel, no categoría que sugiera dónde elegir. Tu elección corresponde a selección propia; foco a control realmente enfocado. Más elegido sólo después de revelar el resultado y con datos vigentes de la ronda. No confundir más elegido con mayoría absoluta, respuesta correcta o jugador único. | condición: Sólo resultado ya revelado con datos válidos y máximo único. No mostrar en empate, antes de revelación ni sin muestra válida; usar crater-most-chosen-tie para empate. | params: [] | citas actuales: []
- COPY-crater-most-chosen-tie [VIS-CRATER-05] es-AR: «Más elegidos · empate» | en: «Most chosen · tie» | contexto: Leyenda de estados reales del panel, no categoría que sugiera dónde elegir. Tu elección corresponde a selección propia; foco a control realmente enfocado. Más elegido sólo después de revelar el resultado y con datos vigentes de la ronda. No confundir más elegido con mayoría absoluta, respuesta correcta o jugador único. | condición: Sólo resultado ya revelado con datos válidos y más de una opción empatada en máximo. Marcar todas las empatadas reales, sin elegir una ganadora arbitraria. | params: [] | citas actuales: []
