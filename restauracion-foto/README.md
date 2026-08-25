# Restauración de foto antigua a color 4K

Restauración de una foto familiar en sepia, muy deteriorada, llevada a color y resolución 4K (2585x3840, lado largo 3840 px).

## Archivos

- `original.jpg`. La foto de partida, escaneo de 1077x1600 con viraje sepia, hongos y manchas de revelado.
- `foto_restaurada_4k.jpg`. Resultado final en JPEG calidad 95.
- `foto_restaurada_4k.png`. El mismo resultado sin pérdida.
- `scripts/`. Los tres scripts de Python del proceso.

## Proceso

Todo el trabajo se hizo con Python sobre modelos de código abierto.

1. Limpieza en escala de grises. Estirado de histograma por percentiles, CLAHE suave y denoise no local (`restaurar.py`).
2. Colorización con la red siggraph17 de Zhang et al. (repo richzhang/colorization, pesos oficiales). Se probó también eccv16 y se descartó por dominante amarilla.
3. Post-proceso de color (`postproceso.py`). Suavizado bilateral de los canales a/b, tope de croma, balance de blancos gray-world anclado en la pared, curva en S.
4. Despeckle en dos rondas contra la mediana local y atenuación de manchas guiada por densidad de outliers, para las zonas con hongos del traje.
5. Superresolución x4 con Real-ESRGAN (RealESRGAN_x4plus) y reconstrucción del rostro con GFPGAN v1.3 (`sr_gfpgan.py`), en CPU con procesado por mosaicos.
6. Acabado. Microcontraste, vibrance leve y máscara de enfoque fino, con reescalado a lado largo 3840.

## Límites

El original tiene daño químico severo en el pecho y hombros del saco. Esa zona quedó pareja pero conserva variaciones de tono que en una foto moderna no existirían. Eliminarlas del todo pediría repintado generativo, fuera del alcance de estos modelos.
