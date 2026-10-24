# Cráter · matriz de implementación (auditoría 22-oct-2026)

23 registros: 21 implementados, 1 ya corregido y verificado (SRC-G02), 1 no aplicable (SRC-G01, home).

Hecho
- Pila modal con inert, roles, foco inicial y retorno al activador (Cómo jugar, Por qué, Ajustes, Pausa, Compartir, Borrar); Escape cierra sólo la capa superior.
- Enter/Espacio sobre botones y radios activan el control; Enter confirma sólo con el mapa enfocado, sin repetición.
- Confirmación explícita: el mapa/lista sólo selecciona; «Confirmar aterrizaje» + «Elegiste: {opción}. Una vez confirmada, no podrás cambiarla.»; sin doble toque ni doble clic. La red (RED.votar en modo hoy) no se tocó ni se simuló.
- Ensayo: «Resultado del ensayo · datos simulados», elección propia y mayoría en texto, «Rivales de práctica: 200», y salidas «Repetir ensayo» / «Volver al menú»; «Saltar ensayo» va al menú.
- Revelación: «Resultado provisional/final», cierre con fecha, hora y zona horaria; «Respuestas reales: {n}» y «Rivales de práctica: {m}» como unidades separadas; «Tu elección» y «La opción más elegida» en texto; leyenda con muestras.
- Compartir con fallback persistente (texto íntegro, «Copiar texto», «Cerrar»); borrado con diálogo explícito que conserva audio/vibración/movimiento.
- Estado de carga con error recuperable antes del JS.
- Plano de la base con MAP_ART v2 (fondo, rejilla, pasillos, módulos, etiquetas cartográficas con colisión y fondo sólo sobre estructura), estados foco > selección > hover, corona con halo 6 px; terreno con microcráteres más tenues y estrellas suaves durante la elección; consigna y plataformas con material sobrio.

Pendiente / riesgos
- PLAY-CRATER-01: la práctica local completa de siete rondas («Practicar sin enviar respuestas») queda pendiente_decision por la orden maestra; sólo se corrigió el onboarding.
- VIS-CRATER-05: «Foco de teclado» no se muestra porque el juego no distingue foco de selección (st.foco nunca se asigna); VIS-CRATER-06 mantiene la exclusión 1.25× (1.6× requiere comparativa de saliencia).
- Nuevo arte MAP_ART v2 en el plano: las estadísticas de rondas base ya votadas con el arte anterior no deberían mezclarse con las nuevas sin estrategia de versión (se dejó la versión en la clave de caché; no hay cohorte en servidor).
- Copys con voseo adaptados a tú (el juego habla de tú): «no podrás cambiarla», «Selecciona y copia», «Puedes volver a intentarlo».
- No probado: cambio de día real, revelación en vivo con datos del servidor, lector de pantalla, bloqueo de un módulo para el estado de error.
