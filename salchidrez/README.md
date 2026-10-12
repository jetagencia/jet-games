# Salchidrez. Prototipo v0.6

Ajedrez de perros salchicha. Reglas completas del ajedrez, pero cada pieza es un salchicha disfrazado de lo que representa. Cuando se mueve, el perro estira el cuerpo hasta la casilla destino y después la cola lo alcanza. El caballero salta.

## Cómo probar

Conviene servirlo por http (la música, cuando esté, se carga con `fetch`). Desde esta carpeta:

```
python3 -m http.server 8000
```

y abrir `http://localhost:8000` en Chrome móvil o devtools mobile.

Para subirlo a Hostinger alcanza con `index.html`, `manifest.json`, `sw.js` y `card.png` (imagen para la tarjeta de la home y para compartir el link), más `musica.mp3` si se suma música.

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

Tablero de pasto en tonos medios para que contrasten los perros claros y los oscuros. Cada perro tiene una base del color de su equipo y una medallita con el símbolo clásico (♔ contorno para Crema, ♚ relleno para Chocolate). La medallita se puede ocultar desde el menú.

## Música

Pendiente. La música sintetizada por código no quedó a la altura y se sacó. El juego ya está preparado: si en la carpeta hay un archivo `musica.mp3`, suena en loop y aparece el botón de música; si no está, el botón no se muestra.

Los efectos (ladridos, olfateos, pasitos, boing del caballero, nube de pelea, gritito del rey, fanfarria de guitarra al ganar) se sintetizan en vivo con WebAudio.

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
- El perro que va a ser comido se da cuenta: se da vuelta, salta, tiembla y grita "¡Ay no!" antes de la pelea
- Coronación: el cachorro crece entre rayos dorados y estrellitas y anuncia "¡Ahora soy Reina!"
- Enroque: rey y torre chocan los cinco ("¡Me escondo!", "¡Yo te cubro!")
- La compu tiene personalidad: comenta algunas jugadas, se burla cuando come, se queja cuando le comés algo, piensa en voz alta y su cara cambia según cómo viene la partida (confiada, enojada, asustada). Tu avatar también cambia de cara
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
