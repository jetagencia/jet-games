# Escudos · matriz de la auditoría (26 registros: 19 propios + 7 comunes)

Estados: 23 implementado · 1 ya_corregido_verificado · 2 no_aplicable · 0 pendiente_decision · 0 bloqueado.
Archivos tocados: `site/escudos/index.html`, `site/escudos/i18n.js` (cadenas ES/EN nuevas), `site/escudos/pelotas.js` (sólo compartir). `data/` sin cambios.

Hecho
- Simulación no destructiva: «Simular resultados pendientes» conserva elecciones en fútbol y F1 (los podios sólo completan puestos vacíos); «Volver a simular todo» separado con confirmación; «Deshacer simulación»/«Deshacer» por snapshot; resumen «Campeón de tu simulación: {equipo}» + «Ver la final» (SRC-E01, PLAY-ESCUDOS-03).
- Cambiar un resultado ya no vacía la llave: se invalidan sólo cruces dependientes (DB.ko guarda los equipos del cruce) y, si se pierden elecciones, se avisa con el número real y se confirma (SRC-E02).
- Equipos, empate y lados de la llave como botones con aria-pressed y nombre; detalle del cruce en botón aparte; foco conservado tras cada render; modal KO como diálogo con fondo inerte, Tab encerrado, Escape y foco devuelto (RSP-ESCUDOS-01/02, PLAY-ESCUDOS-02).
- Borrado con diálogo explícito y nombre real de la competición (PLAY-ESCUDOS-06, SRC-G04); errores de carga diferenciados 404/red con reintento y «Ver competiciones», estado «Cargando…» y guardia si falla i18n (SRC-E03, SRC-G05).
- Tablas: nombres completos, abbr con títulos y leyenda PJ/G/E/P/PT, ceros legibles, puntos jerarquizados, símbolos de clasificación, fila compacta ≤419 px, grupos de 420 px mínimo (PLAY-ESCUDOS-01, RSP-ESCUDOS-04, VIS-ESCUDOS-03).
- Llave: vista por ronda / llave completa, «Ver campeón», contador de cruces decididos, conectores SVG por vínculos reales, halo del campeón reducido (PLAY-ESCUDOS-04, VIS-ESCUDOS-04).
- F1: tres puestos rotulados, ayuda de orden y de quitar, «Podios completos», puntos reales (PLAY-ESCUDOS-05). Blancos de 44 px en podio, pestañas, rondas, sonido y ES/EN; cabecera en dos filas ≤419 (RSP-ESCUDOS-03, RSP-LANGUAGE-TARGETS-01). Popover de audio sin blur y con aria-expanded sincronizado (RSP-AUDIO-01). Soporte de escudos unificado y rival sin apagar (VIS-ESCUDOS-01/02). Compartir de Pelotas con fallback (SRC-G06).

Verificación: `node --check` de i18n.js, pelotas.js y scripts inline; `smoke.mjs escudos` (único error: 404 de data/*.json de la portada, esperable); `site/_auditoria/_smoke/escudos_test.mjs` 49/49 con fixtures sintéticos (copa de 8 grupos y F1 de 3 carreras servidos sólo por el servidor de prueba); capturas escudos-320-test.png, escudos-390-ko-test.png, escudos-1180-ko-test.png.

Pendiente / riesgos
- Los `data/*.json` reales no están en el repo: formatos worldcup48 (WC_T3/tercero puesto), league, league_ko y zones/season_playoffs no se ejecutaron; la lógica es común (render0/pruneKo/requestChange) pero conviene una pasada con datos reales.
- Tono: Escudos usa tuteo («Elige», «Toca») y las cadenas canónicas del catálogo vienen en voseo («Elegí», «Tocá», «Deslizá»). Se usaron las cadenas exactas; el resto del juego sigue en tuteo. Contradicción a resolver por el coordinador.
- Pelotas (trivia) no tiene `pelotas.json` en el repo: el compartir con fallback se verificó sólo por sintaxis.
- Conectores de la llave dependen de la geometría del DOM (se recalculan en resize); `display:contents` e `inert` requieren navegadores modernos.
