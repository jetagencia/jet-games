# Salchidrez. Prototipo v0.2

Ajedrez de perros salchicha. Reglas completas del ajedrez, pero cada pieza es un salchicha: cuanto más importante la pieza, más larga la salchicha. Cuando se mueve, el perro estira el cuerpo hasta la casilla destino y después la cola lo alcanza.

## Cómo probar

1. Abrí `index.html` en Chrome móvil o devtools mobile.
2. Elegí modo (**Vs IA** o **2 jugadores**), dificultad y color.
3. Tocá un perro para elegirlo. Los **huesitos** marcan adónde puede ir; el **marco rosa** marca una captura.
4. Tocá el destino. Si un cachorro llega al fondo, elegís en qué se convierte.

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

Bandos: **Crema** (blancas, glow cian) vs **Chocolate** (negras, glow magenta).

## Estado del prototipo

✅ Implementado:
- Motor de ajedrez completo: enroque, captura al paso, promoción con elección, jaque, jaque mate, ahogado
- Tablas por triple repetición, regla de 50 movidas y material insuficiente
- Motor validado con perft contra 6 posiciones estándar (inicial d4, Kiwipete d3, etc.)
- IA negamax + alpha-beta + quiescence, 3 niveles: Cachorro (d1 + ruido), Salchicha (d2), Campeón (iterativo hasta d4, 1.6 s)
- Perros dibujados por código en Canvas2D (sin assets): cola que mueve, orejas que se balancean, parpadeo
- Animación de "salchicha estirada" al moverse, salto del caballo, capturado que sale volando con "¡GUAU!"
- Los perros se dan vuelta según hacia dónde caminaron
- Deshacer (en Vs IA deshace tu jugada y la de la IA)
- Bandejas de capturas con diferencia de material
- Música original, "Milonga del Salchicha": la menor, 96 bpm, bajo de milonga 3-3-2, acordes en contratiempo, melodía punteada y un "guau" al cierre de cada frase. Se sintetiza en vivo con WebAudio, sin archivos de audio
- Sonidos sintetizados con WebAudio (ladrido en captura y jaque, aullido al final). Música y sonidos se prenden y apagan por separado y la preferencia se guarda
- Interfaz pensada para el teléfono: tablero de ancho completo, perros con más cabeza y sombreros más grandes, tarjetas de jugador con avatar, estado y capturas, barra inferior con íconos grandes
- Victorias por dificultad persistentes (localStorage)
- Estética neón consistente con el resto del portfolio JET

🔜 Próximas iteraciones:
- IA en Web Worker para no bloquear el hilo en Campeón
- Multijugador online / pasar y jugar con tablero girado
- Puzzles diarios de mate ("¿Dónde está el hueso?")
- Skins de razas (salchicha de pelo largo, arlequín)
- Iconos PWA
