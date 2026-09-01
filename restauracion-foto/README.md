# Restauración de foto antigua a color 4K

Restauración de una foto familiar en sepia, dañada por humedad y por un velo de luz, llevada a color y resolución 4K (2585x3840).

## Archivos

- `original.jpg`. El escaneo de partida, 1077x1600.
- `foto_restaurada_4k.jpg` y `foto_restaurada_4k.png`. El resultado final.
- `base_limpia.png`. La versión reparada a 1077x1600, antes del escalado.
- `scripts/`. El proceso, paso por paso.

## Qué estaba mal en las versiones anteriores

Las dos primeras pasadas fallaron por un error de lectura de la imagen. La banda gris a la derecha del hombre es su sombra proyectada sobre la pared blanca, y quedó con el mismo tono que el traje, así que el conjunto leía como un cuerpo deformado. El velo de luz que cruza la foto se había comido el hombro y el brazo superior, dejando un hueco entre el hombro y el antebrazo. Y las manchas de humedad se habían disimulado con filtros de suavizado, lo que produjo el acabado de acuarela.

## Proceso de la versión final

1. Separación de la sombra. Se detecta el borde derecho del cuerpo fila por fila y se levanta la luminancia de la banda de sombra con la curva `0.45*L + 108.5`, para que lea como pared en sombra (`arreglo.py`).
2. Reconstrucción del hombro y el brazo superior con inpainting LaMa sobre el hueco que dejó el velo de luz (`arreglo2.py`).
3. Limpieza de textura por regiones con filtro guiado, implementado a mano porque el ximgproc de este OpenCV viene vacío. Radio 26 y eps 750 en el traje, que mata las manchas de frecuencia media y conserva solapas, bolsillo y raya del pantalón. El grano fino se reinyecta al 35% para que la tela lea como género (`arreglo3.py`).
4. Eliminación del velo marrón sobre la pared, detectado por croma cálido, y aplanado de la desigualdad de tono del traje contra su propia mediana (`arreglo4.py`).
5. Reconstrucción de la pared del borrón por convolución normalizada, usando como fuente únicamente píxeles de pared limpia. El contorno del hombro y del brazo se mide sobre el gris original, donde el velo es claro y el cuerpo oscuro, en vez de trazarse a mano (`arreglo6.py`).
6. Reparación del rostro. La mitad derecha de la cara estaba destruida por el daño. El moteado se detecta por desvío local y se rellena con LaMa, y el ojo derecho, fundido con la ceja en una sola mancha, se reemplaza por el ojo izquierdo sano espejado. Sin ese arreglo, el modelo de rostro interpretaba la mancha como un armazón de anteojos.
7. Superresolución x4 con realesr-general-x4v3, rostro con GFPGAN v1.3, reescalado a lado largo 3840, curva en S suave, saturación al 108% y grano fotográfico (`final.py`).

## Límites

El contorno del hombro y del brazo superior está reconstruido, porque el velo de luz borró esa información en el negativo. La mitad derecha de la cara también. Son reconstrucciones plausibles apoyadas en lo que sí se ve, no en información recuperada.

## Fuentes de los modelos

El entorno bloquea Hugging Face, Dropbox, Replicate y Azure. Los pesos salieron de GitHub releases (big-lama de Sanster/models, SCUNet de cszn/KAIR, Real-ESRGAN y GFPGAN de sus repos oficiales) y del S3 del autor de la colorización.
