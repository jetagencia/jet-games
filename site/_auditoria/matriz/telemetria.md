# Matriz Telemetría

- implementado: 19
- ya_corregido_verificado: 1 (SRC-G02)
- no_aplicable: 1 (SRC-G01)

## Hecho
Overlays y hoja de Registro con rol dialog, nombre, inert, ciclo Tab y retorno de foco; confirmaciones explícitas (reiniciar, borrar); cabecera «Probabilidad de avería» con porcentajes por defecto y lectura separada del historial; cabina en tres zonas con banda de información y ORA con «Mostrar todo»; costes de reparación como dos totales alternativos (R / R+Rx) con escenarios de aire y la regla «el aire se consume al actuar»; explicación de la reparación correcta que agota el aire sin tocar la precedencia de NUCLEO.aplicar; jerarquía de resultado distinta en derrota (Reintentar caso con foco) y victoria; estrellas accesibles con puntaje de decisiones, umbrales reales (80/95), pista máx. 2 y tutoriales 1/2; radiogroup de sistemas; viewport ampliable y sin bloqueos globales de gestos; dirección visual (nodos, barras, fondo calmado, lámpara y alarma de aire estables); bootstrap de carga; compartir con fallback.

## Pendiente / decisiones
- PDEF.pct pasó a true (porcentajes visibles por defecto) por PLAY-TELEMETRIA-01; las preferencias guardadas prevalecen y Veterano sigue ocultándolos. Confirmar como decisión de producto.
- Tono: textos previos en «tú»; los copys del catálogo (voseo) se aplicaron tal cual y las cadenas nuevas siguen ese voseo.
- Contradicción corregida en texto, no en regla: el antiguo «La pista cuesta la tercera estrella» no describía Math.min(est,2); ahora «máximo 2 estrellas».

## Riesgos
- src/piloto.worker.js falta en esta copia: el 404 es esperado y el worker cae al cálculo local; no se inventó el archivo.
- En vertical corto (≤700 px) la línea de escenarios de aire (.ri-s) se oculta visualmente; el texto completo queda en el aria-label de Reparar.
- Versiones subidas (textos v5, cabina v4, ui v8, css v5): publicar juntas.
