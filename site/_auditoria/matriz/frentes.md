# Frentes · matriz de implementación (auditoría 22-oct-2026)

23 registros: 21 implementados, 1 ya corregido y verificado (SRC-G02), 1 no aplicable (SRC-G01, home).

Hecho
- Hojas inferiores con hidden + inert cerradas, roles de diálogo y retorno de foco; superposiciones con pila inert, foco en el título y vuelta al activador.
- Pausa residual corregida: goHome/boardSetup/closeAllOv limpian G.paused; la pausa real se mantiene con el modal abierto; «La animación está pausada.» y «Ver resultado» sólo con resultado calculado; «Reanudar partida».
- Fin del tutorial como estado «Tutorial completado»: sin Lanzar flota ni Saltar tutorial; destinos «Ver el frente de hoy» (sólo informe), «Practicar una ronda», «Volver al menú».
- Rendimiento con un solo formato (fmtRend) en resultado, análisis, historial y récord; titular «Rendimiento frente a estos rivales: {p}%», regla 1 / 0,5, victorias·empates·derrotas separados, «Mejor reparto encontrado» con cantidades por planeta, criterios de medalla (Math.round, 50/75/90, Mando perfecto sólo fuera de Ronda rápida).
- Práctica ≠ oficial: títulos y análisis derivados del modo; confirmación diaria explica el carácter definitivo; «Tu reparto se comparó con {n} rivales de práctica.»
- Controles de reparto con nombre de planeta, reserva en el slider, total asignado, pista de arrastre, explicación cuando no hay reserva; leyendas de promedio/vacío y de la gráfica.
- Compartir con fallback persistente y rec.sh sólo tras éxito; borrado con diálogo explícito; estado de carga con error recuperable; Enter/Espacio respetan los botones.
- Dirección visual: fondo de partida propio, paneles opacos, columnas de precisión, planetas con atmósfera .22 y selección en cuatro segmentos, chevrones con borde, zona de batalla con línea base, CTA sin sweep, lluvia de victoria acotada.

Pendiente / riesgos
- Las cadenas con voseo del catálogo se adaptaron al tú que usa el juego («Arrastra hacia arriba…», «Selecciona y copia…», «no podrás cambiar», «supera el rendimiento…»).
- El titular del resultado deja de decir «Venciste al X %» (claim de victoria estricta) y pasa a «Rendimiento…»; el texto compartido también. Revisar con dirección editorial si se prefiere conservar la frase de marca en portada/tagline (no se tocó).
- La leyenda «Foco de teclado» no aplica: el juego no distingue foco y selección de planeta.
- No probado: lanzamiento diario real (POST api.php; no se ejecutó para no publicar), lector de pantalla, bloqueo de un módulo para el estado de error.
