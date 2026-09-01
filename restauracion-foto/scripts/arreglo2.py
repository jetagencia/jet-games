#!/usr/bin/env python3
"""Reconstruye el hombro/brazo comido por el velo de luz y limpia la textura."""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/30_sombra.png")
h, w = img.shape[:2]
L = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)[:, :, 0]
Ls = cv2.GaussianBlur(L, (11, 11), 0)

# hueco del brazo superior: poligono entre hombro y antebrazo
gap = np.zeros((h, w), np.uint8)
poly = np.array([[652, 240], [700, 258], [778, 328], [790, 468],
                 [712, 488], [670, 400], [646, 300]], np.int32)
cv2.fillPoly(gap, [poly], 255)
# solo donde realmente esta lavado (claro)
gap = ((gap > 0) & (Ls > 105)).astype(np.uint8) * 255
gap = cv2.morphologyEx(gap, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))

# resto del velo sobre la cabeza y arriba a la derecha
velo = np.zeros((h, w), np.uint8)
cv2.ellipse(velo, (620, 90), (180, 110), 10, 0, 360, 255, -1)
cv2.ellipse(velo, (800, 150), (150, 120), 0, 0, 360, 255, -1)
velo = ((velo > 0) & (Ls > 150)).astype(np.uint8) * 255
cv2.rectangle(velo, (330, 40), (500, 250), 0, -1)   # proteger la cabeza

mask = cv2.dilate(cv2.bitwise_or(gap, velo), np.ones((3, 3), np.uint8))
cv2.imwrite(f"{S}/out/32_mask.png", mask)
ov = img.copy()
ov[mask > 0] = (0, 0, 255)
cv2.imwrite(f"{S}/out/32_overlay.png", ov)
print("mask %:", round(float((mask > 0).mean()) * 100, 2))

from iopaint.model.lama import LaMa
from iopaint.schema import InpaintRequest, HDStrategy
lama = LaMa("cpu")
res = lama(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), mask, InpaintRequest(hd_strategy=HDStrategy.ORIGINAL))
out = np.clip(res, 0, 255).astype(np.uint8)
cv2.imwrite(f"{S}/out/33_hombro.png", out)
print("inpaint hombro listo")
