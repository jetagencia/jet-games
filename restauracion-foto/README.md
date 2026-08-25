# Restauración de foto antigua a color 4K

Restauración de una foto familiar en sepia, muy deteriorada por humedad, llevada a color y resolución 4K (2585x3840, lado largo 3840 px).

## Archivos

- `original.jpg`. La foto de partida, escaneo de 1077x1600 con viraje sepia, manchas de humedad, hongos y rayas de revelado.
- `foto_restaurada_4k.jpg`. Resultado final en JPEG calidad 95.
- `foto_restaurada_4k.png`. El mismo resultado sin pérdida.
- `scripts/pipeline_v2.py`. El pipeline completo y reproducible, con todos los parámetros.

## Proceso

Todo el trabajo se hizo con Python sobre modelos de código abierto. El daño no se difuminó con filtros, se eliminó regenerando la imagen debajo de cada mancha.

1. Limpieza en escala de grises. Estirado de histograma por percentiles y CLAHE suave, sin denoise en esta etapa.
2. Máscara manual de daño (10,6% del área). Mancha blanca de papel adherido, rayas diagonales de revelado, moteado denso del pecho, velo del hombro derecho y hongos del pantalón. Cara, camisa, corbata, pañuelo y manos quedan protegidos.
3. Inpainting profundo con LaMa (big-lama). Regenera pared, red, saco y pantalón debajo de cada mancha.
4. Colorización con la red siggraph17 de Zhang et al. y post-proceso solo de croma. Suavizado bilateral de a/b, tope de croma y balance de blancos anclado en los claros.
5. Denoise real con SCUNet (variante GAN), entrenado para ruido complejo. Elimina el grano grueso y el moho fino sin efecto acuarela.
6. Segunda pasada de LaMa para el residuo de rayas y las motas claras chicas.
7. Aplanado tonal del traje con filtro pasabanda de luminancia restringido a la silueta. Borra los parches de humedad de frecuencia media que sobreviven al denoise.
8. Neutralización cromática del fantasma sepia de la derecha (doble exposición del positivado). Su croma cálido se lleva al gris de la pared y pasa a leerse como sombra fuera de foco.
9. Superresolución x4 con realesr-general-x4v3, reconstrucción del rostro con GFPGAN v1.3, reescalado a lado largo 3840, microcontraste, nitidez fina y un grano fotográfico sutil para acabado de cámara actual.

## Fuentes de los modelos

El entorno bloquea Hugging Face y Dropbox. Los pesos salieron de GitHub releases (big-lama de Sanster/models, SCUNet de cszn/KAIR, Real-ESRGAN y GFPGAN de sus repos oficiales) y del S3 del autor de la colorización (colorizers.s3.us-east-2.amazonaws.com).
