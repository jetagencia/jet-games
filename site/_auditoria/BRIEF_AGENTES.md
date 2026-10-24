# Brief para los agentes de implementación (JETGames, auditoría 22-oct-2026)

Trabajás dentro del repositorio `/home/user/jet-games`. La carpeta `site/` es una copia fiel del código
publicado de jetgames.fun al 22 de octubre de 2026 (22 juegos + home). Tu tarea: aplicar al/los juego(s)
asignados los cambios del catálogo de auditoría, **por ID**, editando los archivos en `site/<juego>/`.

## Qué leer antes de tocar código
1. `site/_auditoria/ORDEN_MAESTRA_PARA_CLAUDE.txt` entera (reglas, prioridades, decisiones que prevalecen).
2. `site/_auditoria/por_juego/<juego>.md`: todos los registros del catálogo de ese juego, con instrucción,
   copy, aceptación y referencias, más los copys ES/EN aplicables.
3. `site/_auditoria/por_juego/comun.md`: registros comunes (SRC-G01…G06). Aplicalos también a tu juego
   donde correspondan (botones de pausa/menú, borrado con confirmación, estados de carga, compartir, etc.).
4. El código del juego: `site/<juego>/index.html` y `site/<juego>/src/*` (algunos juegos son un solo HTML).
   Rutas viejas: ball=`site/jetball`, rocket=`site/rocket` (también existe `site/jetrocket` puente, no tocar),
   slalom=`site/slalom`, flow=`site/flow`, match=`site/match`, words=`site/words`, box=`site/box`,
   jump=`site/jetjump`. Los demás usan su propio nombre.

## Reglas duras
- No cambiar reglas de puntuación, dificultad, física, economía, desbloqueo, semillas ni tableros fijos.
  Si un ID exige eso, marcalo `pendiente_decision` con el motivo.
- Conservar i18n: si el juego ya tiene ES/EN (módulo i18n, data-t, jet-idioma), agregá las cadenas en los
  dos idiomas. Si NO tiene inglés, sólo español; no inventes soporte EN. Español es-AR (voseo donde el juego ya
  lo use; respetar su tono).
- Usar las cadenas exactas de los copys (`text.es-AR` / `text.en`), con parámetros reales `{n}` etc.; nunca
  hardcodear números observados en la auditoría.
- Etiquetas canónicas: pausa = «Reanudar partida»; guardado = «Continuar partida»; «Volver al menú» (menú del
  juego) y «Volver a los juegos» (catálogo). Verbos de dominio se conservan (Despegar, Imprimir, Reparar…).
- Borrado de progreso: confirmación explícita (diálogo con Cancelar enfocado al abrir y botón peligro «Borrar
  progreso»), nunca doble clic temporal; enumerar lo que se borra; no borrar idioma/audio si no se promete.
- Estados de carga (SRC-G05) en juegos con módulos externos: título visible antes del JS, error recuperable con
  «Volver a cargar» y «Volver a los juegos», sin spinner infinito ni botones vacíos; loading/error/ready excluyentes.
- Diálogos/overlays: `role="dialog"` + `aria-modal` + nombre; foco inicial dentro; Escape cierra; al cerrar el
  foco vuelve al control que lo abrió; lo cerrado tiene `hidden`/`inert` (no sólo opacity) y no recibe Tab.
- Teclado: Enter/Espacio sobre botones enfocados no deben disparar acciones de juego (saltar, pausar, etc.);
  no capturar Tab; flechas en sliders quedan para el slider.
- Responsive: respetar safe-area (`env(safe-area-inset-*)`), no solapar HUD y controles; probar 320/390/768/1280.
- `prefers-reduced-motion`: desactivar animaciones no esenciales.
- No agregar autoplay audible. No añadir red/publicación: las acciones «Compartir» sólo por acción del usuario.
- VIS-*: mejoras visuales (fondos, tableros, líneas, materiales, tipografía) **sin alterar colores que codifican
  reglas, conteos, posiciones o estados**. Implementar con CSS/canvas del propio juego, sin filtros globales
  ni assets externos. Si un VIS requiere arte nuevo que no podés generar con código, marcá `pendiente_decision`.
- Si un ID ya está corregido en la fuente (el catálogo lo indica como preservar/regresión), verificá y marcá
  `ya_corregido_verificado` sin tocar.
- No tocar archivos de otros juegos ni la home (`site/index.html`) salvo que tu asignación lo diga.
- **No hagas commits ni push**: el coordinador integra. No borres ni renombres archivos existentes.
- No edites `site/_auditoria/*` salvo tu matriz.

## Verificación obligatoria
- Sintaxis: `node --check` para cada `.js` modificado (los módulos ESM: `node --check --input-type=module < archivo`
  o `node -e "import('file:///ruta')"`); para HTML con scripts inline, extraelos y verificá, o al menos cargá la página.
- Prueba de humo: `cd /home/user/jet-games && node site/_auditoria/herramientas/smoke.mjs <juego>` (carpeta del juego,
  p. ej. `jetball`, `rocket`, `senal`). Debe cargar sin errores nuevos de consola; mirá las capturas en
  `site/_auditoria/_smoke/<juego>-390.png` y `-1280.png` con la herramienta Read. Los 404 de `sw.js`, `api.php`,
  imágenes, audio y GLB son esperables en este entorno.
- Donde sea razonable, probá la interacción con Playwright (abrir pausa, Tab, Escape, confirmaciones) con un
  script propio en `/tmp/claude-0/.../scratchpad` o en `site/_auditoria/_smoke/`. No dejes scripts dentro de `site/<juego>/`.

## Entregable
Escribí `site/_auditoria/matriz/<juego>.json`: lista de objetos
`{"id","estado","archivos":[...],"detalle","verificacion"}` con `estado` ∈
`implementado | ya_corregido_verificado | pendiente_decision | bloqueado | no_aplicable`, **uno por cada ID**
del archivo `por_juego/<juego>.md` (incluidos los comunes aplicables, con el prefijo del juego en `detalle`).
`detalle` dice qué se cambió exactamente y dónde; `verificacion` qué prueba corriste y su resultado.
Y un resumen corto `site/_auditoria/matriz/<juego>.md` (10 a 20 líneas) con lo hecho, lo pendiente y riesgos.
Al terminar, reportá en tu mensaje final: conteo por estado, archivos tocados y cualquier contradicción
encontrada entre catálogo y código vigente.
