#!/usr/bin/env python3
"""Corrige los dos defectos reales: la sombra fundida con el cuerpo y la
textura moteada del traje. Trabaja a 1077x1600 sobre 18_limpia.png."""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/18_limpia.png")
h, w = img.shape[:2]
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[:, :, 0].copy(), lab[:, :, 1].copy(), lab[:, :, 2].copy()
Ls = cv2.GaussianBlur(L, (9, 9), 0)


def guided(p, I, r, eps):
    """Filtro guiado de He et al. p y I en float32."""
    k = (2 * r + 1, 2 * r + 1)
    mI = cv2.boxFilter(I, -1, k)
    mp = cv2.boxFilter(p, -1, k)
    mIp = cv2.boxFilter(I * p, -1, k)
    cov = mIp - mI * mp
    mII = cv2.boxFilter(I * I, -1, k)
    var = mII - mI * mI
    a = cov / (var + eps)
    b = mp - a * mI
    return cv2.boxFilter(a, -1, k) * I + cv2.boxFilter(b, -1, k)


# ---------- 1. borde derecho del cuerpo y banda de sombra ----------
edge = np.zeros(h, np.float32)
wall = np.zeros(h, np.float32)
for y in range(h):
    seg = Ls[y, 600:790]
    dark = np.where(seg < 60)[0]
    edge[y] = 600 + (dark[-1] if len(dark) else 60)
    bright = np.where(Ls[y, 660:830] > 172)[0]
    wall[y] = 660 + (bright[0] if len(bright) else 100)
edge = cv2.GaussianBlur(edge.reshape(-1, 1), (1, 81), 0).ravel()
wall = cv2.GaussianBlur(wall.reshape(-1, 1), (1, 81), 0).ravel()
wall = np.maximum(wall, edge + 20)

xs = np.arange(w)[None, :]
band = ((xs >= edge[:, None] + 3) & (xs <= wall[:, None] + 6)).astype(np.float32)
band[:560] = 0                       # arriba está el brazo extendido, no sombra
band[1560:] = 0
band = cv2.GaussianBlur(band, (0, 0), 9)

# levantar la sombra para que lea como pared en sombra
Lnew = np.clip(0.45 * L + 108.5, 0, 255)
L = L * (1 - band) + Lnew * band
A = A * (1 - band) + (A * 0.3 + 128 * 0.7) * band
B = B * (1 - band) + (B * 0.3 + 128 * 0.7) * band

lab[:, :, 0], lab[:, :, 1], lab[:, :, 2] = L, A, B
img = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
cv2.imwrite(f"{S}/out/30_sombra.png", img)

# ---------- 2. máscara de la persona ----------
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L = lab[:, :, 0]
Ls = cv2.GaussianBlur(L, (11, 11), 0)
zona = np.zeros((h, w), np.uint8)
cv2.rectangle(zona, (185, 30), (990, 1545), 255, -1)
oscuro = ((Ls < 118) & (zona > 0) & (band < 0.15)).astype(np.uint8)
oscuro = cv2.morphologyEx(oscuro, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lb, st, _ = cv2.connectedComponentsWithStats(oscuro, 8)
if n > 1:
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    persona = (lb == i).astype(np.uint8) * 255
else:
    persona = oscuro * 255
persona = cv2.morphologyEx(persona, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cv2.imwrite(f"{S}/out/31_persona.png", persona)
ov = img.copy()
ov[persona > 0] = (0, 0, 255)
cv2.imwrite(f"{S}/out/31_overlay.png", cv2.addWeighted(img, 0.6, ov, 0.4, 0))
print("persona %:", round(float((persona > 0).mean()) * 100, 1))
