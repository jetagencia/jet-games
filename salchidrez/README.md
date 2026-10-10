# Salchidrez. Prototipo v0.4

Ajedrez de perros salchicha. Reglas completas del ajedrez, pero cada pieza es un salchicha disfrazado de lo que representa. Cuando se mueve, el perro estira el cuerpo hasta la casilla destino y después la cola lo alcanza. El caballero salta.

## Cómo probar

Hace falta servirlo por http (la música se carga con `fetch`). Desde esta carpeta:

```
python3 -m http.server 8000
```

y abrir `http://localhost:8000` en Chrome móvil o devtools mobile.

Para subirlo a Hostinger alcanza con estos archivos: `index.html`, `manifest.json`, `sw.js` y `milonga.mp3`. La carpeta `tools/` no se sube.

## Cómo se juega

- Elegí contra quién (la compu o un amigo en el mismo teléfono), la dificultad y tus perros.
- **Tocá** un perro y aparecen huesitos donde puede ir, o **arrastralo**: la cabeza sigue al dedo y la salchicha se estira. Si lo soltás en una casilla que no vale, vuelve a su lugar.
- Comer abre una nube de pelea de dibujito animado; el comido sale volando.
- **Pista** busca una buena jugada y la marca con huellitas y una casilla dorada.
- **Deshacer** vuelve atrás (contra la compu deshace tu jugada y la de ella).

## La jauría

| Pieza | Nombre | Cómo reconocerlo |
|---|---|---|
| Rey | Rey Salchichón | corona con cruz arriba y capa roja de armiño |
| Reina | Reina Longaniza | corona de puntas con perlas, collar de perlas y pestañas |
| Torre | Torre | sombrero de torre de castillo con almenas, ventanita y banderín |
| Alfil | Obispo Chorizo | mitra con la ranura del alfil, báculo dorado y alzacuello |
| Caballo | Caballero | yelmo con penacho, armadura y caballito de palo; salta en vez de estirarse |
| Peón | Cachorro | pañuelo, el más chiquito |

Opcional: símbolo clásico (♔♕♖♗♘♙) en la esquina de cada casilla, se activa desde el menú.

## Música

"Milonga del Salchicha", original. Trío de bandoneón, guitarra criolla y contrabajo en la menor y do mayor, 2/4, 88 bpm, 32 compases (43,6 s en loop sin costura).

- La partitura y la síntesis están en `tools/milonga.js`: guitarra y contrabajo con síntesis de cuerda pulsada (Karplus-Strong), bandoneón con lengüetas desafinadas, formante y vibrato, reverb de sala por convolución.
- `tools/render-music.js` la renderiza con Chromium (Playwright) y ffmpeg a `milonga.mp3`:

```
NODE_PATH=$(npm root -g) node salchidrez/tools/render-music.js
```

Los efectos (ladridos, olfateos, pasitos, boing del caballero, nube de pelea, fanfarria de guitarra al ganar) se sintetizan en vivo con WebAudio.

## Estado del prototipo

✅ Implementado:
- Motor de ajedrez completo: enroque, captura al paso, promoción con elección, jaque, jaque mate, ahogado
- Tablas por triple repetición, regla de 50 movidas y material insuficiente
- Motor validado con perft contra 6 posiciones estándar
- IA negamax + alpha-beta + quiescence, 3 niveles: Cachorro, Salchicha y Campeón
- Perros dibujados por código en Canvas2D (sin imágenes), con vestuario por pieza
- Arrastrar para estirar, salto del caballero, huellitas en el camino, nube de pelea con sacudón, onomatopeyas
- Escena de jaque: el perro que ataca se da vuelta, se estira hacia el rey y ladra con la boca abierta (cejas fruncidas, colmillos, ondas de ladrido); una línea roja marca la amenaza. El rey pega un salto del susto, abre los ojos, para las orejas, tiembla, transpira y grita ("¡Socorro, guardias!", "¡No me muerdas!"). Si zafa, suspira ("¡Uf, zafé!"); si se come al atacante, "¡Tomá, por ladrar!"
- Jaque mate: tres ladridos, el rey dice "¡Me rindo!" y se desmaya patas para arriba con ojos en X y estrellitas
- Globitos de diálogo según la pieza, perros que saltan y olfatean mientras esperan
- Menú ilustrado con tarjetas, logo con salchichas que caminan como oruga
- Pantalla final con el ganador bailando, papel picado y huesitos, estadísticas de la partida
- Tarjetas de jugador con avatar, estado y capturas; barra con deshacer, pista, música, sonidos y menú
- Preferencias y victorias guardadas en el teléfono (localStorage)

🔜 Próximas iteraciones:
- IA en Web Worker para no bloquear el hilo en Campeón
- Multijugador online
- Puzzles diarios de mate
- Skins de razas (pelo largo, arlequín)
- Iconos PWA
