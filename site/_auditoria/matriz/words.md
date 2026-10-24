# Words · matriz de la auditoría (22 registros: 16 propios + 6 comunes)

Estados: 18 implementado · 2 ya_corregido_verificado · 2 no_aplicable · 0 pendiente_decision · 0 bloqueado.
Archivo tocado: `site/words/index.html` (CSS + script inline). `palabras.js`, `musica.js` y `jet-idioma.js` sin cambios. `site/jetwords` no se tocó.

Hecho
- Teclado virtual con click como única activación, roving tabindex y flechas; el teclado físico ya no secuestra Enter/Espacio cuando el foco está en botones o enlaces; eliminado el blur forzado del header (RSP-WORDS-01).
- Nombres accesibles por casilla («Intento n, posición p, L: estado»), filas group, anuncio único por evaluación en región exclusiva, estado agregado del teclado separado («descartada según los intentos revelados»), marcas ✓ • – no cromáticas (RSP-WORDS-02, PLAY-WORDS-01/02, VIS-WORDS-02).
- Modales con fondo inerte, foco inicial, Tab encerrado, foco devuelto y safe-area (RSP-WORDS-03).
- Validación en región polite con singular/plural real, vaciada al corregir (PLAY-WORDS-05); estadísticas con «Partidas», «Victorias consecutivas», título por modalidad e idioma y distribución titulada (PLAY-WORDS-04, VIS-WORDS-03).
- Cabecera ≤419 px en filas, áreas 44×44, idioma y estadísticas en Ajustes (RSP-WORDS-04); zoom permitido (RSP-GLOBAL-01).
- Compartir con fallback persistente de texto íntegro (SRC-W02/G06); estado de error de carga recuperable (SRC-G05).
- SRC-W01 verificado como regresión: práctica restaurada tras cambio de modo, de idioma y recarga.

Verificación: `node --check` de los dos scripts inline; `smoke.mjs words` sin errores; `site/_auditoria/_smoke/words_test.mjs` 47/47 (capturas words-320-test.png, words-error-test.png).

Pendiente / riesgos
- El atributo `inert` y `clip-path` requieren navegadores modernos (Chromium 102+, Safari 15.5+, Firefox 112+); hay fallback de pointer-events pero no de foco.
- Las pruebas con lector de pantalla real (VoiceOver/TalkBack) no se ejecutaron; se verificó el árbol accesible por DOM.
- El copy «Estadísticas de {modalidad} · {idioma}» se aplicó a los dos modos (el repertorio sólo traía la variante de práctica).
