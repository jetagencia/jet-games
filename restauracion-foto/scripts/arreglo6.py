#!/usr/bin/env python3
"""Reconstruye la pared usando el contorno real del hombro y el brazo.

El contorno se mide sobre el gris original, donde el velo de luz es claro y el
cuerpo es oscuro, así que el límite no lo define una recta inventada.
"""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/37_plano.png")
h, w = img.shape[:2]

# --- contorno superior del cuerpo medido en el original ---
g = cv2.GaussianBlur(cv2.imread(f"{S}/out/10_gris.png", 0), (13, 13), 0).astype(int)
top = np.full(w, np.nan)
for x in range(535, 950):
    col = g[:430, x]
    for y in range(150, 420):                    # arranca en 150 para saltear el pelo
        if col[y] < 118 and (col[y:y + 15] < 130).all():
            top[x] = y
            break
val = ~np.isnan(top)
idx = np.where(val)[0]
top[535:950] = np.interp(np.arange(535, 950), idx, top[idx])
serie = top[535:950].astype(np.float32)
pad = np.pad(serie, 10, mode="edge")
serie = np.array([np.median(pad[i:i + 21]) for i in range(len(serie))], np.float32)
serie = cv2.GaussianBlur(serie.reshape(-1, 1), (1, 41), 0).ravel()
top[535:950] = serie
top[950:] = 300.0
top[:535] = 0.0
print("contorno x=560:", round(top[560]), " x=650:", round(top[650]),
      " x=720:", round(top[720]), " x=850:", round(top[850]))

# --- hueco a reconstruir: pared por encima del contorno ---
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
Ls = cv2.GaussianBlur(L, (9, 9), 0)
ys, xs = np.mgrid[0:h, 0:w]
lim = top[None, :] - 7
hueco = (xs >= 535) & (xs <= 1010) & (ys < lim) & (Ls < 208)
hueco = cv2.morphologyEx(hueco.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((19, 19), np.uint8))
hueco = cv2.dilate(hueco, np.ones((5, 5), np.uint8)).astype(bool)

src = ((~hueco) & (Ls > 205) & (ys < 470)).astype(np.float32)
print("hueco px:", int(hueco.sum()))


def extrap(c, s=95):
    return cv2.GaussianBlur(c * src, (0, 0), s) / (cv2.GaussianBlur(src, (0, 0), s) + 1e-6)


muestra = L[60:360, 830:1060]
std = float((muestra - cv2.GaussianBlur(muestra, (0, 0), 2.0)).std())
rng = np.random.default_rng(3)
grano = cv2.GaussianBlur(rng.normal(0, std, (h, w)).astype(np.float32), (0, 0), 0.8)

m = cv2.GaussianBlur(hueco.astype(np.float32), (0, 0), 4)[..., None]
nuevo = np.dstack([extrap(L) + grano, extrap(A), extrap(B)])
lab = lab * (1 - m) + nuevo * m
res = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
cv2.imwrite(f"{S}/out/41_pared.png", res)
print("pared lista")
