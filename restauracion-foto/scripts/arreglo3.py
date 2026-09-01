#!/usr/bin/env python3
"""Limpieza de textura por regiones con filtro guiado.

Quita las manchas de frecuencia media (los parches de humedad) conservando
los bordes reales (solapas, bolsillo, raya del pantalón) y devuelve un grano
fino parejo para que la tela lea como género.
"""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/33_hombro.png")
h, w = img.shape[:2]


def guided(p, I, r, eps):
    k = (2 * r + 1, 2 * r + 1)
    mI = cv2.boxFilter(I, -1, k)
    mp = cv2.boxFilter(p, -1, k)
    cov = cv2.boxFilter(I * p, -1, k) - mI * mp
    var = cv2.boxFilter(I * I, -1, k) - mI * mI
    a = cov / (var + eps)
    b = mp - a * mI
    return cv2.boxFilter(a, -1, k) * I + cv2.boxFilter(b, -1, k)


lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
Ls = cv2.GaussianBlur(L, (11, 11), 0)

# --- mascaras de region ---
persona = np.zeros((h, w), np.uint8)
cv2.rectangle(persona, (195, 30), (985, 1545), 255, -1)
persona = ((persona > 0) & (Ls < 122)).astype(np.uint8)
persona = cv2.morphologyEx(persona, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
n, lb, st, _ = cv2.connectedComponentsWithStats(persona, 8)
i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
persona = (lb == i).astype(np.float32)
persona[1180:, :330] = 0        # pasto, que conserva su textura
persona = cv2.GaussianBlur(persona, (0, 0), 6)

pared = cv2.GaussianBlur((Ls > 168).astype(np.float32), (0, 0), 6)

# --- limpieza ---
det = L - guided(L, L, 3, 120.0)                # grano fino que se conserva
plano_fuerte = guided(L, L, 26, 750.0)          # traje: mata las manchas
plano_medio = guided(L, L, 14, 420.0)           # pared
plano_suave = guided(L, L, 5, 200.0)            # resto

Lc = plano_suave.copy()
Lc = Lc * (1 - pared) + plano_medio * pared
Lc = Lc * (1 - persona) + plano_fuerte * persona
Lc = Lc + det * (0.35 * persona + 0.30 * pared + 0.75 * (1 - np.maximum(persona, pared)))

# croma parejo en el traje y en la pared
for ch, arr in ((1, A), (2, B)):
    suave = cv2.GaussianBlur(arr, (0, 0), 14)
    lab[:, :, ch] = arr * (1 - np.maximum(persona, pared)) + suave * np.maximum(persona, pared)

lab[:, :, 0] = np.clip(Lc, 0, 255)
res = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
cv2.imwrite(f"{S}/out/34_textura.png", res)
print("textura lista")
