# JETJump para Unreal Engine 5 — plugin `JETJumpSim`

Arregla la jugabilidad del proyecto **JETJumpWorld** sin tocar su contenido: la simulación
completa del juego web (aires, trancos, batida, balística del salto, rehúses, reglamento FEI
Tabla A / Tabla C, desempate, rivales) portada a C++ puro, más un Pawn con cámara que **no se
mete adentro del caballo**, GameMode, HUD y constructor de pistas. Todo gratis: no usa ningún
asset del marketplace.

## Qué trae

| Clase | Para qué |
|---|---|
| `UJetRideComponent` | La simulación. Se agrega a cualquier actor; expone velocidad, aire, fase de tranco, salto, cabeceo para el Animation Blueprint. |
| `AJetHorsePawn` | Pawn jugable: malla, spring arm con colisión y 5 cámaras (seguimiento, lejana, a bordo, lateral, TV), teclado y mando. |
| `UJetHorseAnimInstance` | Base para el AnimBP del caballo: variables `Speed`, `Gait`, `StridePhase`, `bJumping`, `JumpProgress`, `CyclePlayRate`. |
| `AJetCourseActor` | Construye la pista (postes, barras a rayas, muro, ría, liverpool, tranquera, banderas) con formas del motor. Barras que caen con física. |
| `AJetGameMode` | Arranca el recorrido, tira barras, mensajes, sonidos opcionales, simula rivales y arma la tabla. |
| `AJetHUD` | HUD con Canvas: próxima valla, trancos, medidor de batida, tiempo vs TA, faltas, velocidad, energía, minimapa, resultados. |
| `UJetSimLibrary` | Funciones para Blueprints: `BuildCourse`, `SimulateRival`, `CourseToWorld`. |

La simulación en C++ da los mismos resultados que la web (90 rondas de IA por pista: mismas
tasas de llegadas, limpias, barras y rehúses).

## Instalación (5 minutos)

1. Cerrá el editor. Copiá la carpeta `JETJumpSim` a
   `C:\Users\Juli\Desktop\Juli\JETGames\jetjump\JETJumpWorld\Plugins\JETJumpSim`
   (creá `Plugins` si no existe).
2. Si el proyecto es solo Blueprints, convertilo a C++: en el editor **Tools → New C++ Class**,
   cualquier clase vacía, aceptar. Eso genera la solución. (Hace falta Visual Studio 2022 con la
   carga de trabajo *Game development with C++*; es gratis, edición Community.)
3. Click derecho en `JETJumpWorld.uproject` → **Generate Visual Studio project files**.
4. Abrí el `.sln`, configuración **Development Editor / Win64**, compilá (Ctrl+Shift+B). Abrí el proyecto.
5. En **Edit → Plugins** verificá que *JETJump Sim* esté activo.

## Configuración automática (recomendada)

1. **Edit → Plugins** → activar *Python Editor Script Plugin* (viene con el motor) → reiniciar el editor.
2. Abrir el mapa del juego. **Tools → Execute Python Script** → elegir `Setup_JETJump.py` (está al lado de la carpeta del plugin).
3. Play.

El script busca el Skeletal Mesh del caballo y sus clips (idle, walk, trot, canter, gallop, jump), crea
`BP_JetCaballo` y `BP_JetGameMode` en `/Game/JETJump`, pone el GameMode en el mapa y agrega un Player Start
si falta. Lo que encontró y lo que no queda en el *Output Log* con el prefijo `[JETJump]`. Si eligió mal un
clip, abrí `BP_JetCaballo` y cambialo en la categoría *Animacion simple*.

## Animación sin Animation Blueprint (modo simple)

Si el Mesh no tiene Anim Class, o si `Force Simple Animation` está activo, el Pawn reproduce los clips
asignados en *Animacion simple* según la simulación:

- el ciclo de cada aire corre a la frecuencia real del tranco (`Strides Per Clip` dice cuántos trancos trae cada clip),
- el clip de salto se recorre siguiendo la parábola (batida, ápice, recepción), con `Jump Clip Air Start/End`
  marcando qué parte del clip es vuelo,
- si falta un clip se usa el más parecido (por ejemplo galope por galope largo).

Con eso el caballo del proyecto se mueve bien sin abrir el Animation Blueprint. Para transiciones suaves
entre aires, usar el modo con AnimBP de abajo.

## Conectar el caballo a mano (sin tocar la malla)

1. **Pawn**: Content Browser → click derecho → Blueprint Class → buscar `JetHorsePawn` → `BP_Caballo`.
   - En el componente `Mesh` asigná tu Skeletal Mesh y tu Anim Class.
   - Si el caballo no mira hacia +X: `Mesh Yaw Offset` (por ejemplo -90). Si flota o se hunde:
     `Mesh Z Offset`. `Withers Height Cm` = altura de la cruz del modelo (escala la cámara).
2. **Animación**: abrí tu Animation Blueprint → Class Settings → **Parent Class** =
   `JetHorseAnimInstance`. En el AnimGraph usá:
   - `Gait` (0 parado, 1 paso, 2 trote, 3 galope, 4 galope largo) en un Blend Poses by Int.
   - `CyclePlayRate` como Play Rate de los ciclos (multiplicado por 1 / duración del clip en segundos),
     o `StridePhase` como Explicit Time para sincronía exacta de los cascos.
   - `bJumping` + `JumpProgress` (0 batida, 0.5 ápice, 1 recepción) para el clip de salto.
   - El cabeceo del cuerpo en el aire lo pone el Pawn; si tu clip ya cabecea, bajá `Jump Pitch Scale`.
3. **GameMode**: Blueprint Class hijo de `JetGameMode` → `BP_JetGameMode`. En *Default Pawn Class*
   poné `BP_Caballo`. En **World Settings** del mapa → *GameMode Override* = `BP_JetGameMode`.
4. Un **Player Start** en el mapa (en cualquier lado: la simulación teletransporta al caballo a la salida).
5. Play. Si no hay `JetCourseActor` en el mapa, el GameMode arma la pista *Clásico* a 1,30 m en el
   origen del mundo. Para elegir el lugar, arrastrá un `JetCourseActor` al mapa (su posición es el
   centro de la pista) y configurá *Layout*, *Height*, *Speed MPM*, *Jump Off* y *Seed*.

### Controles

| Acción | Teclado | Mando |
|---|---|---|
| Girar | A / D o ← / → | stick izquierdo |
| Ritmo (más / menos) | W / S o ↑ / ↓ | stick izquierdo arriba/abajo |
| Pedir la batida | Espacio / Enter | A |
| Cambiar cámara | C | Y |
| Otra vuelta | R | botón Start |

La cuenta atrás es de 45 s: cruzá la línea de salida antes de la campana o arranca solo.
El medidor de abajo muestra si llegás corto o largo a la próxima valla; cuando dice **¡SALTÁ!**
estás en la zona de batida. Con *Assist* activado (por defecto) el caballo acomoda el tranco.

### Parámetros del binomio (en `BP_JetGameMode`)

`Horse Stats`: Scope (altura máxima cómoda en m), Tech, Care, Speed, Ride, Bold, Stamina, 0..1.
`Rider Skills`: Eye, Balance, Nerve, Turns, 0..1. `Mode`: Tabla A, Tabla C, Entrenamiento, Potencia.
`Num Rivals`, `Rival Skill Min/Max`: la tabla de resultados.

### Sonido

En `BP_JetGameMode` → Sonido: asigná cualquier `SoundWave` o `MetaSound` a casco, barra, roce,
campana, aplausos, "ooh", chapoteo y resoplido. Vacío = silencio. Los cascos se reproducen con
el volumen según la velocidad y cada apoyo real del tranco.

## Si hacés tus propias vallas

En el `JetCourseActor` podés asignar `Rail Mesh`, `Post Mesh`, `Block Mesh` y materiales; la
barra se escala a lo largo de su eje Z para medir el ancho de la valla, el poste también.
Las barras superiores caen con física cuando la simulación marca la falta.

## Sistema de coordenadas

Simulación en metros con X este, Z sur, Y arriba. Unreal: `UE.X = X·100`, `UE.Y = Z·100`,
`UE.Z = Y·100`, yaw = heading en grados. El `JetRideComponent` hace la conversión con
`Arena Origin` (posición del `JetCourseActor`).

## Problemas típicos

- **No compila "JetHUD.generated.h"**: el plugin no está en `Plugins/` del proyecto o no se
  regeneraron los archivos de la solución (paso 3).
- **El caballo no se mueve**: el mapa no tiene `BP_JetGameMode` como GameMode Override, o el
  Pawn no es hijo de `JetHorsePawn`.
- **La cámara sigue adentro del caballo**: tu Blueprint tiene su propia cámara además de la del
  Pawn; borrala. El spring arm del plugin prueba colisión contra el mundo y nunca entra en la malla
  (la malla no tiene colisión por diseño).
- **Mira para otro lado**: `Mesh Yaw Offset`.
- **Patas deslizando**: usá `StridePhase` como Explicit Time del ciclo en vez de Play Rate.
