#!/usr/bin/env python3
"""Quita el velo marrón sobre la pared y aplana la desigualdad de tono del traje."""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/34_textura.png")
h, w = img.shape[:2]
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
Ls = cv2.GaussianBlur(L, (11, 11), 0)

# --- velo marrón sobre la pared, a la derecha de la cabeza ---
zona = np.zeros((h, w), np.uint8)
cv2.rectangle(zona, (472, 0), (1000, 262), 255, -1)
Ab = cv2.GaussianBlur(A, (0, 0), 5)
Bb = cv2.GaussianBlur(B, (0, 0), 5)
velo = ((zona > 0) & ((Bb > 131.5) | (Ab > 130.5)) & (Ls > 120)).astype(np.uint8) * 255
cv2.rectangle(velo, (0, 0), (478, 250), 0, -1)     # proteger la cabeza
velo = cv2.morphologyEx(velo, cv2.MORPH_CLOSE, np.ones((21, 21), np.uint8))
velo = cv2.dilate(velo, np.ones((5, 5), np.uint8))
cv2.imwrite(f"{S}/out/35_velo_mask.png", velo)
ov = img.copy()
ov[velo > 0] = (0, 0, 255)
cv2.imwrite(f"{S}/out/35_overlay.png", ov)
print("velo %:", round(float((velo > 0).mean()) * 100, 2))

from iopaint.model.lama import LaMa
from iopaint.schema import InpaintRequest, HDStrategy
lama = LaMa("cpu")
res = lama(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), velo, InpaintRequest(hd_strategy=HDStrategy.ORIGINAL))
img = np.clip(res, 0, 255).astype(np.uint8)
cv2.imwrite(f"{S}/out/36_sin_velo.png", img)

# --- aplanado de baja frecuencia del traje ---
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L = lab[:, :, 0]
Ls = cv2.GaussianBlur(L, (11, 11), 0)
per = np.zeros((h, w), np.uint8)
cv2.rectangle(per, (195, 30), (985, 1545), 255, -1)
per = ((per > 0) & (Ls < 122)).astype(np.uint8)
per = cv2.morphologyEx(per, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
n, lb, st, _ = cv2.connectedComponentsWithStats(per, 8)
i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
per = (lb == i).astype(np.float32)
per[1180:, :330] = 0
perb = cv2.GaussianBlur(per, (0, 0), 8)

# tendencia de baja frecuencia calculada solo con pixeles del traje
num = cv2.GaussianBlur(L * per, (0, 0), 55)
den = cv2.GaussianBlur(per, (0, 0), 55) + 1e-6
tend = num / den
objetivo = float(np.median(L[per > 0.5]))
lab[:, :, 0] = np.clip(L - (tend - objetivo) * 0.55 * perb, 0, 255)

res = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
cv2.imwrite(f"{S}/out/37_plano.png", res)
print("aplanado listo, mediana traje:", round(objetivo, 1))
