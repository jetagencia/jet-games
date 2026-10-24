# Caja Negra · matriz de implementación (auditoría 22-oct-2026)

22 registros: 20 implementados, 1 ya corregido y verificado (SRC-G02), 1 no aplicable (SRC-G01, home).

Hecho
- Capas modales con pila: inert en el fondo y en capas inferiores, aria-labelledby, foco inicial, Escape por capa y retorno al activador (Ajustes, pausa, diálogo, historial, lupa, apertura).
- Tab vuelve al navegador; flechas/Enter de fichas sólo con foco dentro del informe; Enter/Espacio sobre botones no disparan órdenes del juego.
- Banco: primero la categoría del campo activo con «Ver todas las categorías»; «Ampliar registro» / «Volver al caso»; tocar una respuesta ya puesta la selecciona, vaciar es explícito y tiene «Deshacer cambio».
- Historial «Intentos anteriores» con copia de cada hipótesis, «Ver informe de este intento» y comparación neutra contra el informe actual; nunca contrasta con la solución; «3 o más» no revela el número exacto.
- Apertura con botón enfocado («Omitir animación» / «Abrir expediente»), fondo inerte, cronómetro desde que el caso es visible.
- Textos canónicos: Verificar informe, Intentos anteriores/de verificación, Reanudar partida, Volver al menú, Caso archivado sin resolver, Ver solución y cerrar el caso (+ aviso de racha), Palabras disponibles, campos por completar.
- Borrado con diálogo explícito (Cancelar enfocado, botón peligro, datos enumerados). Compartir con éxito veraz y fallback persistente con «Copiar texto».
- Estado de carga antes del JS con error recuperable («Volver a cargar», «Volver a los juegos»).
- Dirección visual: tokens CN_ART de superficie, telemetría con trazos técnicos, foto con acabado separado de la evidencia (RNG visual propio, sin aberración), marcas a .18–.25 con patrones intactos, flash sin filtro de contraste.

Pendiente / riesgos
- PLAY-CAJA-04: «1 parche / 2 parche» es el identificador del parche (parche nº 3), no un recuento; no se aplicó el plural «{cantidad} parches» para no cambiar el significado. Badge numérico aria-hidden.
- Copys con voseo adaptados a tú (el juego habla de tú en todo su i18n): «Elige un campo…», «Selecciona y copia…», «Puedes volver a intentarlo».
- Line-height del informe bajó de 2.15 a 1.6 por VIS-CAJA-01; los campos inline marcan el ritmo de línea. Revisar con texto grande (html.grande) en dispositivos reales.
- No probado: fallo real de portapapeles, bloqueo de un módulo para el estado de error, lector de pantalla, igualdad píxel a píxel foto con/sin acabado (sólo garantizada por construcción).
