#!/usr/bin/env python3
"""Aplana el halo residual de la pared, escala a 4K y da el acabado."""
import numpy as np
import cv2

S = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad"
img = cv2.imread(f"{S}/out/41_pared.png")
h, w = img.shape[:2]

# contorno del cuerpo, igual que en el paso anterior
g = cv2.GaussianBlur(cv2.imread(f"{S}/out/10_gris.png", 0), (13, 13), 0).astype(int)
top = np.full(w, np.nan)
for x in range(535, 950):
    col = g[:430, x]
    for y in range(150, 420):
        if col[y] < 118 and (col[y:y + 15] < 130).all():
            top[x] = y
            break
idx = np.where(~np.isnan(top))[0]
top[535:950] = np.interp(np.arange(535, 950), idx, top[idx])
serie = top[535:950].astype(np.float32)
pad = np.pad(serie, 10, mode="edge")
serie = np.array([np.median(pad[i:i + 21]) for i in range(len(serie))], np.float32)
top[535:950] = cv2.GaussianBlur(serie.reshape(-1, 1), (1, 41), 0).ravel()
top[950:] = 300.0

lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
ys, xs = np.mgrid[0:h, 0:w]

# zona de pared a dejar pareja, sin tocar el alambrado
zonaA = (xs >= 500) & (xs <= 805) & (ys < top[None, :] - 7)
zonaB = (xs > 805) & (ys < 112)
zona = (zonaA | zonaB)
Ls = cv2.GaussianBlur(L, (9, 9), 0)
src = ((~zona) & (Ls > 205) & (ys < 470)).astype(np.float32)


def extrap(c, s=95):
    return cv2.GaussianBlur(c * src, (0, 0), s) / (cv2.GaussianBlur(src, (0, 0), s) + 1e-6)


muestra = L[420:700, 60:260]
std = float((muestra - cv2.GaussianBlur(muestra, (0, 0), 2.0)).std())
rng = np.random.default_rng(11)
grano = cv2.GaussianBlur(rng.normal(0, max(std, 2.0), (h, w)).astype(np.float32), (0, 0), 0.8)
m = cv2.GaussianBlur(zona.astype(np.float32), (0, 0), 4)[..., None]
lab = lab * (1 - m) + np.dstack([extrap(L) + grano, extrap(A), extrap(B)]) * m
img = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
cv2.imwrite(f"{S}/out/42_base.png", img)
print("pared pareja lista")

# --- superresolucion x4 y rostro ---
from basicsr.archs.srvgg_arch import SRVGGNetCompact
from realesrgan import RealESRGANer
from gfpgan import GFPGANer
W = "/root/.cache/weights"
model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type="prelu")
up = RealESRGANer(4, [f"{W}/realesr-general-x4v3.pth", f"{W}/realesr-general-wdn-x4v3.pth"],
                  model=model, tile=400, tile_pad=10, half=False, device="cpu", dni_weight=[0.7, 0.3])
fe = GFPGANer(model_path=f"{W}/GFPGANv1.3.pth", upscale=4, arch="clean",
              channel_multiplier=2, bg_upsampler=up, device="cpu")
_, _, sr = fe.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
print("sr listo", sr.shape[1], "x", sr.shape[0], flush=True)

s = 3840 / max(sr.shape[:2])
final = cv2.resize(sr, (round(sr.shape[1] * s), round(sr.shape[0] * s)), interpolation=cv2.INTER_AREA)

# --- acabado fotografico ---
lab = cv2.cvtColor(final, cv2.COLOR_BGR2LAB).astype(np.float32)
Lf = lab[:, :, 0]
# curva en S suave: mas negro real y blancos contenidos
x = np.arange(256, dtype=np.float32) / 255.0
curva = np.clip(x + 0.042 * np.sin((x - 0.48) * np.pi * 1.9), 0, 1) * 255
lab[:, :, 0] = cv2.LUT(np.clip(Lf, 0, 255).astype(np.uint8), curva.astype(np.uint8)).astype(np.float32)
final = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

hsv = cv2.cvtColor(final, cv2.COLOR_BGR2HSV).astype(np.float32)
hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.08, 0, 255)
final = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

blur = cv2.GaussianBlur(final, (0, 0), 1.2)
final = cv2.addWeighted(final, 1.20, blur, -0.20, 0)
rng = np.random.default_rng(5)
gr = cv2.GaussianBlur(rng.normal(0, 1.5, final.shape[:2]).astype(np.float32), (0, 0), 0.7)
final = np.clip(final.astype(np.float32) + gr[:, :, None], 0, 255).astype(np.uint8)

cv2.imwrite(f"{S}/out/43_final_4k.png", final)
cv2.imwrite(f"{S}/out/43_final_4k.jpg", final, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("final:", final.shape[1], "x", final.shape[0])
