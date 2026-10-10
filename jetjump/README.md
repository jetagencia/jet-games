# JETJump v0.1

Simulación de salto ecuestre para mobile (landscape) y desktop. Reglamento FEI simplificado, física de galope y salto propia, carrera con establo, cuidadores que ascienden, caballos que se entrenan y envejecen, seis formas de jugar.

Ver `../docs/DESIGN-JETJUMP.md` para el diseño completo, el estado del arte visual y el plan hacia producción.

## Cómo probar

1. Serví la carpeta `jet-games/` con cualquier servidor estático (`npx http-server -p 8765`) y abrí `http://localhost:8765/jetjump/`. Los módulos ES y el worker no funcionan desde `file://`.
2. Jugá en horizontal. Teclado en desktop: A/D o flechas giran, W/S ritmo, espacio salta.
3. Táctil: arrastrar en la mitad izquierda gira (arriba/abajo cambia el ritmo); botones `+` y `−` para pierna y rienda; `SALTAR` cuando el botón brilla.

## Modos

| Modo | Qué es |
|---|---|
| **Carrera** | Establo con dinero, semanas, caballos, personal (caballerizo, entrenador, veterinario, herrador, nutricionista), mercado, jinete con habilidades y 7 categorías desde Escuela 1.00 hasta Gran Premio 1.60. |
| **Concurso rápido** | Tabla A con desempate contra 9 rivales simulados. |
| **Contrarreloj** | Tabla C: cada barra suma 4 segundos, un rehúse 6. |
| **Potencia** | Un muro que sube de 1.50 a 2.30 m. Quedan los que no fallan. |
| **Entrenamiento** | Pista libre, sin reloj ni faltas, con asistente que califica cada distancia. |
| **Desafío del día** | Pista y altura derivadas de la fecha; se guarda el mejor resultado. |

## Reglas implementadas (Tabla A)

- 4 faltas por barra derribada, pie en la ría o desobediencia (rehúse/escape).
- Segunda desobediencia, caída o error de recorrido: eliminación.
- 1 falta por segundo iniciado por encima del tiempo acordado. Tiempo límite = 2 × TA.
- En las combinaciones, tras un rehúse se retoma desde el primer elemento.
- Desempate: pista acortada, barras +5 cm, TA al 80 %.

## Arquitectura

```
jetjump/
  index.html            página, CSS, HUD y controles
  src/sim.js            física: aires, trancos, balística del salto, reglas, piloto IA
  src/courses.js        diseños de pista (Clásico, Gran Premio con ría, Indoor) y constructor
  src/horse.js          caballo y jinete procedurales (metaballs + cadenas articuladas)
  src/scene.js          mundo three.js: pista, vallas, público, cielo, HDRI, GTAO, cámaras
  src/game.js           partida: input, HUD, eventos → audio/efectos
  src/audio.js          audio procedural WebAudio (cascos, barra, agua, campana, público)
  src/data.js           razas, estadísticas, personal, categorías, economía, entrenamiento
  src/save.js           perfil y ajustes en localStorage
  src/ui.js             menú, establo, modos, reconocimiento de pista, resultados
  src/rivals-worker.js  simula rivales en un Web Worker
  vendor/               three.js 0.160 + addons usados (sin CDN, listo para Capacitor)
  assets/hdr, assets/tex  HDRIs y texturas (repositorio three.js, licencia MIT)
  dev/horse-viewer.html visor del modelo de caballo para iterar poses
```

Sin dependencias de build: HTML + módulos ES. Los tests de calibración viven como scripts de Node que importan `src/sim.js` directamente (ver diseño).

## Estado

✅ Jugable de punta a punta: menú → carrera o modo rápido → reconocimiento → recorrido 3D → desempate → resultados → progresión.
⚠ Arte provisional: caballo y público procedurales. Para el acabado fotorrealista se necesita un modelo de caballo con esqueleto y licencia comercial (ver diseño, sección "Pipeline de assets").
