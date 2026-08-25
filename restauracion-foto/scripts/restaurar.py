#!/usr/bin/env python3
"""Restauración y colorización de foto antigua.

Pipeline:
 1. Limpieza: escala de grises (elimina el viraje sepia), CLAHE, denoise.
 2. Colorización con la red siggraph17 de Zhang et al. (y eccv16 como alternativa).
 3. Post-proceso: balance, saturación, curva de tono.
Guarda resultados intermedios en el directorio de salida.
"""
import sys
import numpy as np
import cv2

sys.path.insert(0, "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad/colorization")
import torch
import colorizers as C

SRC = "/root/.claude/uploads/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/1b9bc13a-image.jpg"
OUT = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad/out"

import os
os.makedirs(OUT, exist_ok=True)

# --- 1. limpieza en escala de grises ---
bgr = cv2.imread(SRC)
gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

# recuperar contraste global: estirar histograma con percentiles
lo, hi = np.percentile(gray, (0.5, 99.5))
gray = np.clip((gray.astype(np.float32) - lo) * (255.0 / max(hi - lo, 1)), 0, 255).astype(np.uint8)

# contraste local suave
clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
gray = clahe.apply(gray)

# denoise conservador (grano de película + ruido de escaneo)
gray = cv2.fastNlMeansDenoising(gray, None, h=7, templateWindowSize=7, searchWindowSize=21)

cv2.imwrite(f"{OUT}/01_limpia_gris.png", gray)

# --- 2. colorización ---
rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

def colorize(model, rgb_img):
    tens_l_orig, tens_l_rs = C.preprocess_img(rgb_img.astype(np.float64) / 255.0 * 255, HW=(256, 256))
    with torch.no_grad():
        out_ab = model(tens_l_rs)
    return C.postprocess_tens(tens_l_orig, out_ab)

# preprocess_img espera uint8 RGB
tens_l_orig, tens_l_rs = C.preprocess_img(rgb, HW=(256, 256))

sig = C.siggraph17(pretrained=True).eval()
ecc = C.eccv16(pretrained=True).eval()

with torch.no_grad():
    out_sig = C.postprocess_tens(tens_l_orig, sig(tens_l_rs).cpu())
    out_ecc = C.postprocess_tens(tens_l_orig, ecc(tens_l_rs).cpu())

for name, out in (("siggraph17", out_sig), ("eccv16", out_ecc)):
    img8 = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    cv2.imwrite(f"{OUT}/02_color_{name}.png", cv2.cvtColor(img8, cv2.COLOR_RGB2BGR))

print("colorización lista")
