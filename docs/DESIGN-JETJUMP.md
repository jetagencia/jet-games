# JETJump — Design Doc 1.0

**Estado**: v0.1 jugable, octubre 2026. **Para revisión de**: Julián.

## Qué es

Simulación de salto ecuestre con ambición de referencia del género en mobile. La promesa: montar de verdad. Elegir la distancia, el ritmo y la línea decide el resultado; el caballo tiene carácter y límites; el reloj y las barras castigan como en un concurso real.

Tres pilares:

1. **Simulación creíble**. Aires, trancos, balística del salto y reglamento FEI, no un endless runner con caballo.
2. **Progresión viva**. Caballos, jinete y cuidadores evolucionan; el establo es un juego de gestión por semanas.
3. **UX de deporte televisado**. HUD legible a 60 fps, reconocimiento de pista, cámaras de transmisión, público que reacciona.

## Simulación (src/sim.js)

- **Aires**: parado, paso, trote, galope, galope largo. Frecuencia de tranco en función de la velocidad; secuencia de apoyos por aire (mano derecha o izquierda) alimenta la animación y el audio de cascos.
- **Control del jinete**: `pace` 0..1 se traduce a velocidad objetivo (0 → 10.5-12 m/s según el caballo). Giro limitado por radio mínimo dependiente de la velocidad; en el galope, girar hacia el pie contrario reduce el giro hasta que el caballo cambia de pie.
- **Distancia**: en cada tranco el caballo "busca" la valla: ajusta la longitud del tranco dentro de un margen que depende de su manejo, del ojo del jinete y del asistente. El jugador influye con el ritmo.
- **Salto**: el centro de masa sigue una parábola. Manos y pies se evalúan con la báscula del caballo en cada plano de la valla (vertical: 1 plano; oxer: 2; triple barra: 3; ría: seto + zona de agua). El solver elige la altura mínima que pasa limpio con margen; si la potencia no alcanza, la probabilidad de derribo crece con la invasión del plano. Despegue largo baja los pies en el plano trasero; despegue profundo baja las manos en el delantero.
- **Desobediencias**: rehúse si la valla supera la potencia, falta impulso, el ángulo es malo o el jinete pide fuera de tiempo; escape si la línea no entra en la valla.
- **Energía**: el fondo cae con el galope y los saltos; la potencia efectiva baja con la fatiga. La forma física del establo fija el punto de partida.
- **Reglas** (Tabla A): 4 faltas por barra, agua o desobediencia; 1 falta por segundo iniciado sobre el tiempo acordado; segunda desobediencia, caída o error de recorrido eliminan; tiempo límite 2 × TA; en combinaciones se retoma desde el primer elemento. Tabla C: barra +4 s, rehúse +6 s. Desempate: recorrido reducido, barras +5 cm, TA 80 %.

Calibración: con un caballo de potencia 1.55 m sobre 1.40 m, 90 recorridos de IA terminan 75 veces, 20 limpios, 3.6 faltas de media. Sobre 1.60 m con potencia 1.65, 1 limpio en 90. Los scripts de calibración importan `sim.js` desde Node sin render.

## Pistas (src/courses.js)

Tres diseños reutilizables con alturas 1.00-1.60 y velocidad 325-400 m/min: **Clásico** (96 × 64 m, 11 esfuerzos, doble y combinación), **Gran Premio** (ría de 3-4.2 m, triple), **Indoor** (74 × 44 m, giros cortos). Cada diseño tiene su variante de desempate. Tiempo acordado = longitud de la línea ideal × 1.08 / velocidad.

## Progresión (src/data.js, src/ui.js)

- **Caballos**: siete estadísticas (potencia en metros, técnica, cuidado, velocidad, manejo, coraje, fondo) con potencial oculto por raza (KWPN, Selle Français, Holsteiner, BWP, Silla Argentino, Pura Sangre). Forma, ánimo, salud y lesiones. Entrenamiento semanal por tipo (plano, gimnasia, recorrido, galope de campo, descanso) con rendimiento según edad, ánimo y entrenador. A partir de los 13 años pierden estadísticas. Valor de mercado derivado.
- **Jinete**: XP por concurso, niveles cuadráticos, puntos para ojo, equilibrio, temple y giros. Cada habilidad toca la simulación (ventana de distancia, barras, rehúses, radio de giro).
- **Cuidadores**: caballerizo (bienestar), entrenador (rendimiento), veterinario (lesiones), herrador (cuidado en la barra), nutricionista (fondo y forma). Cinco niveles (Aprendiz → Leyenda) por experiencia semanal y resultados; el salario sube con el nivel. Candidatos nuevos cada 3 semanas.
- **Economía**: €60.000 iniciales, pensión por caballo, salarios, inscripciones y premios por categoría. Mercado renovado cada 4 semanas; venta al 85 % del valor.
- **Categorías**: Escuela 1.00 → Local 1.10 → Regional 1.20 → Nacional 1.30 → CSI2* 1.40 → CSI4* 1.50 → Gran Premio 1.60. Un top 5 desbloquea la siguiente.
- **Rivales**: binomios generados con habilidad por categoría, simulados en un Web Worker con el mismo motor que el jugador.

## UX

- Reconocimiento de pista: mapa con sentido de cada valla, distancias en metros y trancos en las combinaciones, tiempo acordado y longitud.
- HUD: próxima valla (número, tipo, altura, metros, trancos), reloj con barra hacia el TA, faltas, velocidad en m/min y aire, medidor de distancia (corto / perfecto / largo), botón de salto que brilla en la ventana correcta, minimapa con el recorrido y el caballo, barra de fondo.
- Tutorial de tres tarjetas la primera vez; asistente opcional que califica cada salto.
- Pausa con cambio de cámara (seguimiento, TV, a bordo) y abandono.
- Resultados con tabla completa, desempate separado, premios, XP y desbloqueos.

## Visual y audio

- three.js 0.160 con ACES, sombras PCF 4K, iluminación por imagen (HDRI de three.js), GTAO, bloom suave, SMAA y gradación final (viñeta + grano). Tres niveles de calidad.
- Pista de arena con normal map procedural, césped con textura y normal, ladrillo real en los muros, agua con normal animado, público instanciado (cuerpo + cabeza) que salta al festejar, tribuna, palco de jurado, carteles JET Games, árboles con copas irregulares, pabellón cubierto para Indoor.
- Caballo procedural v2: tronco, cuello y cabeza por barrido de secciones elípticas sobre curvas, con proporciones de un caballo de 1,68 m; patas y cola articuladas; crin y cola con tarjetas de pelo; montura, cabezada, riendas que unen manos y filete; jinete en dos puntos durante el salto. Seis capas con moteado de tordillo, estrella y calcetines. Cargador GLB con mezcla de clips por aire para reemplazarlo por un modelo con licencia.
- Luz de hora dorada: sol bajo y cálido tomado del HDRI, sombras largas, cielo procedural con disco solar, niebla cálida.
- Siete cámaras de juego más la cámara orbital de repetición, con profundidad de campo (Bokeh) en las cámaras de transmisión.
- Repetición automática en cámara lenta (0,33×) de cada salto o solo de las faltas: buffer de poses y de barras caídas, ducking de audio y música propia.
- Audio 100 % procedural por capas: cascos por aire y velocidad, respiración por tranco, cuero, filete, barra (doble golpe), roce, agua, campana, aplausos, "ooh", resoplido, viento y murmullo. Locutor con síntesis de voz del sistema.
- Música original generativa: secuenciador de semicorcheas con seis estados (menú, establo, previa, repetición, victoria, derrota), pad, arpegios, bajo, cuerdas, metales, timbales, percusión suave y reverb de convolución generada.

### Estado del arte y límite honesto

Lo que hay es coherente y corre en mobile, pero **no es fotorrealista** y no lo va a ser con geometría generada por código. El techo lo pone el modelo del caballo. Para el acabado de película hacen falta assets con licencia comercial:

| Asset | Fuente recomendada | Costo orientativo | Integración |
|---|---|---|---|
| Caballo con esqueleto y animaciones (paso, trote, galope, salto, parado) | Sketchfab Store / CGTrader / TurboSquid, formato GLB con skinning | 60-300 USD | `GLTFLoader` ya está en `vendor/`. `HorseModel` expone `update(pose)`: se reemplaza por un `AnimationMixer` que mezcla clips con los mismos pesos de aire, fase y `jumpT`. |
| Jinete | Mixamo (gratis con cuenta Adobe) o el mismo paquete | 0-80 USD | Igual, montado al hueso de la montura. |
| Público | Paquetes low-poly animados (Synty, Quaternius) | 0-60 USD | Reemplaza las cápsulas instanciadas. |
| HDRI 2K y texturas PBR | Poly Haven (CC0) | 0 | Misma ruta `assets/`. |

Con esos cuatro reemplazos el pipeline actual (HDRI, GTAO, sombras, gradación, cámaras) ya está preparado. El trabajo es de integración, no de motor.

## Rendimiento

Objetivo 60 fps en gama media de 2023. Presupuesto por frame: caballo ~25k triángulos, pista + vallas ~60k, público 2 draw calls instanciados, post-proceso solo en calidad alta. El worker de rivales simula 9 recorridos en ~0.7 s en desktop.

## Monetización (propuesta, no implementada)

Freemium coherente con el portfolio: carrera gratis hasta Nacional 1.30; pase Premium desbloquea CSI y Gran Premio, cuadras extra y aires de cámara; cosméticos (chaquetas, mantillas, botas) sin efecto en la simulación; anuncio recompensado para repetir el desafío del día. Sin loot boxes.

## Roadmap

- **v0.2** Modelo de caballo GLB + rig, público animado, repetición del salto con cámara lenta.
- **v0.3** Clima y hora (lluvia, tarde), pisada en césped, más diseños de pista (8) y un editor interno.
- **v0.4** Temporada con calendario, ranking mundial, patrocinadores, lesiones con diagnóstico, cría.
- **v0.5** Audio con samples reales, locutor sintetizado, música de ceremonia.
- **v1.0** Capacitor, Play Billing, AdMob recompensado, Firebase, localización en/pt.
