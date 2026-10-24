# Home: resumen de la matriz (22-oct-2026)

Hecho: SRC-G01 implementado. Las 22 tarjetas abren en la misma pestaña (se quitó target="_blank" de 21 anclas); Ctrl/Cmd+clic y menú contextual siguen funcionando porque son enlaces nativos sin manejador JS. No se tocó el arte de las tarjetas ni los atributos rel.
Verificado sin tocar: SRC-G02. El selector ES/EN existente (.lang-sw con aria-pressed) y JETIdioma inline respetan la prioridad ?lang > cookie compartida/localStorage > navegador; la elección sobrevive a la recarga.

Pruebas: Playwright con locales es-AR y en-US, con y sin ?lang; Ctrl+clic abre pestaña nueva y el clic normal navega en la misma; smoke de la home sin errores de consola.

Pendiente: abrir las 22 tarjetas y regresar desde cada juego comprobando idioma y scroll (sólo se comprobó la mecánica del enlace); bloqueo real de cookies no simulado (fallback a localStorage verificado por código). Riesgo: los juegos en subdominios (jetball.jetgames.fun, jetrocket.jetgames.fun) dependen de la cookie de dominio .jetgames.fun para conservar el idioma; en localhost la cookie no lleva dominio y cada origen usa su localStorage.
