#!/usr/bin/env python3
"""Pipeline v2 de restauración completo, el que produjo el resultado final.

Uso: python3 pipeline_v2.py <foto_entrada> <dir_salida>
Requiere: torch, opencv, iopaint (LaMa), realesrgan, gfpgan, basicsr,
el repo richzhang/colorization y el repo cszn/SCUNet en el PYTHONPATH,
y estos pesos en ~/.cache/weights: big-lama.pt (en ~/.cache/torch/hub/checkpoints),
scunet_color_real_gan.pth, realesr-general-x4v3.pth, realesr-general-wdn-x4v3.pth,
GFPGANv1.3.pth. La colorización baja sus pesos sola del S3 del autor.
"""
import os
import sys

import numpy as np
import cv2
import torch

SRC, OUT = sys.argv[1], sys.argv[2]
W = os.path.expanduser("~/.cache/weights")
os.makedirs(OUT, exist_ok=True)

# --- 1. gris limpio, sin denoise ---
gray = cv2.cvtColor(cv2.imread(SRC), cv2.COLOR_BGR2GRAY)
lo, hi = np.percentile(gray, (0.5, 99.5))
gray = np.clip((gray.astype(np.float32) - lo) * (255.0 / max(hi - lo, 1)), 0, 255).astype(np.uint8)
gray = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8)).apply(gray)
h, w = gray.shape

# --- 2. mascara manual de daño (coordenadas para 1077x1600) ---
mask = np.zeros((h, w), np.uint8)
cv2.ellipse(mask, (762, 220), (100, 90), -20, 0, 360, 255, -1)   # papel blanco
cv2.ellipse(mask, (570, 1100), (105, 95), 0, 0, 360, 255, -1)    # hongos pantalon
cv2.ellipse(mask, (575, 955), (52, 47), 0, 0, 360, 255, -1)
for p1, p2, t in [((470, 5), (705, 220), 24), ((455, 55), (668, 245), 20),
                  ((520, 0), (760, 170), 18), ((445, 0), (525, 65), 34),
                  ((610, 150), (740, 250), 14), ((462, 45), (700, 215), 26),
                  ((448, 100), (660, 262), 22), ((440, 155), (600, 290), 18),
                  ((830, 0), (905, 110), 20), ((845, 5), (900, 95), 16)]:
    cv2.line(mask, p1, p2, 255, t)                               # rayas de revelado
pts = np.array([[478, 255], [730, 262], [665, 490], [560, 525], [480, 430]], np.int32)
cv2.fillPoly(mask, [pts], 255)                                   # moteado pecho der
pts = np.array([[268, 285], [362, 270], [382, 420], [300, 445]], np.int32)
cv2.fillPoly(mask, [pts], 255)                                   # moteado pecho izq
box = cv2.boxPoints(((690, 400), (130, 230), 15))
cv2.fillPoly(mask, [box.astype(np.int32)], 255)                  # velo hombro
excl = np.zeros_like(mask)
cv2.rectangle(excl, (325, 55), (485, 240), 255, -1)              # cara
cv2.rectangle(excl, (382, 222), (470, 432), 255, -1)             # camisa y corbata
cv2.rectangle(excl, (512, 328), (600, 372), 255, -1)             # pañuelo
cv2.rectangle(excl, (878, 265), (980, 365), 255, -1)             # mano derecha
cv2.rectangle(excl, (175, 775), (272, 935), 255, -1)             # mano izquierda
mask[excl > 0] = 0
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))

# --- 3. LaMa ---
from iopaint.model.lama import LaMa
from iopaint.schema import InpaintRequest, HDStrategy
lama = LaMa("cpu")
cfg = InpaintRequest(hd_strategy=HDStrategy.ORIGINAL)
res = lama(cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB), mask, cfg)
inpainted = np.clip(res, 0, 255).astype(np.uint8)

# --- 4. colorizacion siggraph17 + post de croma ---
import colorizers as C
rgb = cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB)
tl_orig, tl_rs = C.preprocess_img(rgb, HW=(256, 256))
sig = C.siggraph17(pretrained=True).eval()
with torch.no_grad():
    out = C.postprocess_tens(tl_orig, sig(tl_rs).cpu())
bgr = cv2.cvtColor((np.clip(out, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
L, a, b = cv2.split(lab)
a = cv2.medianBlur(cv2.bilateralFilter(a, 15, 35, 15), 5)
b = cv2.medianBlur(cv2.bilateralFilter(b, 15, 35, 15), 5)
af, bf = a.astype(np.float32) - 128, b.astype(np.float32) - 128
ch = np.sqrt(af**2 + bf**2)
f = np.where(ch > 34, 34 / np.maximum(ch, 1e-6), 1.0) * np.where(ch < 12, 1.15, 1.0)
a = np.clip(af * f + 128, 0, 255).astype(np.uint8)
b = np.clip(bf * f + 128, 0, 255).astype(np.uint8)
bgr = cv2.cvtColor(cv2.merge([L, a, b]), cv2.COLOR_LAB2BGR)
imgf = bgr.astype(np.float32)
m = L > 170
means = [imgf[:, :, c][m].mean() for c in range(3)]
t = float(np.mean(means))
for c in range(3):
    imgf[:, :, c] *= t / means[c]
color = np.clip(imgf, 0, 255).astype(np.uint8)

# --- 5. SCUNet GAN por mosaicos ---
from models.network_scunet import SCUNet
net = SCUNet(in_nc=3, config=[4, 4, 4, 4, 4, 4, 4], dim=64)
net.load_state_dict(torch.load(f"{W}/scunet_color_real_gan.pth"), strict=True)
net.eval()
inp = torch.from_numpy(cv2.cvtColor(color, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0)
tile, ov = 384, 32
acc, wgt = torch.zeros_like(inp), torch.zeros_like(inp)
with torch.no_grad():
    for y in range(0, h, tile - ov):
        for x in range(0, w, tile - ov):
            y1, x1 = min(y + tile, h), min(x + tile, w)
            y0, x0 = max(0, y1 - tile), max(0, x1 - tile)
            acc[:, :, y0:y1, x0:x1] += net(inp[:, :, y0:y1, x0:x1])
            wgt[:, :, y0:y1, x0:x1] += 1
den = (acc / wgt).squeeze(0).permute(1, 2, 0).numpy()
den = cv2.cvtColor((np.clip(den, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)

# --- 6. segunda pasada LaMa: residuo de rayas y motas claras ---
g = cv2.cvtColor(den, cv2.COLOR_BGR2GRAY)
mask2 = np.zeros((h, w), np.uint8)
for p1, p2, t in [((540, 35), (705, 195), 26), ((500, 85), (645, 225), 20),
                  ((575, 0), (690, 105), 22), ((455, 25), (545, 110), 20)]:
    cv2.line(mask2, p1, p2, 255, t)
med = cv2.medianBlur(g, 11)
big = cv2.GaussianBlur(g, (61, 61), 0)
cand = (((g.astype(np.int16) - med.astype(np.int16)) > 9) & (big < 120)).astype(np.uint8) * 255
n, labels, stats, _ = cv2.connectedComponentsWithStats(cand, 8)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] <= 220:
        mask2[labels == i] = 255
mask2[excl > 0] = 0
mask2 = cv2.dilate(mask2, np.ones((3, 3), np.uint8))
res = lama(cv2.cvtColor(den, cv2.COLOR_BGR2RGB), mask2, cfg)
limpia = np.clip(res, 0, 255).astype(np.uint8)

# --- 7. aplanado tonal del traje (pasabanda en L, silueta por croma neutro) ---
lab = cv2.cvtColor(limpia, cv2.COLOR_BGR2LAB)
L = lab[:, :, 0].astype(np.float32)
a = lab[:, :, 1].astype(np.float32)
b = lab[:, :, 2].astype(np.float32)
mm = ((cv2.GaussianBlur(L, (0, 0), 25) < 120)
      & (np.abs(cv2.GaussianBlur(a, (0, 0), 15) - 128) < 7)
      & (np.abs(cv2.GaussianBlur(b, (0, 0), 15) - 128) < 9)).astype(np.float32)
sil = np.zeros_like(mm)
sil[0:1500, 185:765] = 1.0
mm = mm * cv2.GaussianBlur(sil, (0, 0), 20)
mm = cv2.GaussianBlur(mm, (0, 0), 15)
band1 = cv2.GaussianBlur(L, (0, 0), 8) - cv2.GaussianBlur(L, (0, 0), 30)
band2 = cv2.GaussianBlur(L, (0, 0), 18) - cv2.GaussianBlur(L, (0, 0), 70)
lab[:, :, 0] = np.clip(L - (band1 * 0.9 + band2 * 0.75) * mm, 0, 255).astype(np.uint8)
plano = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# --- 8. neutralizar el fantasma sepia de la derecha ---
lab = cv2.cvtColor(plano, cv2.COLOR_BGR2LAB).astype(np.float32)
L, a, b = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
warm = ((cv2.GaussianBlur(b, (0, 0), 9) - 128 > 4)
        | (cv2.GaussianBlur(a, (0, 0), 9) - 128 > 3)).astype(np.float32)
boxm = np.zeros_like(warm)
boxm[0:1250, 430:w] = 1.0
excl2 = np.zeros_like(warm)
cv2.rectangle(excl2, (320, 50), (500, 250), 1.0, -1)
cv2.rectangle(excl2, (870, 255), (990, 380), 1.0, -1)
mn = cv2.GaussianBlur(warm * boxm * (1 - excl2), (0, 0), 12)
lab[:, :, 1] = a + (128 - a) * 0.8 * mn
lab[:, :, 2] = b + (128 - b) * 0.8 * mn
neutra = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

# --- 9. SR x4 + GFPGAN + acabado ---
from basicsr.archs.srvgg_arch import SRVGGNetCompact
from realesrgan import RealESRGANer
from gfpgan import GFPGANer
model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type="prelu")
up = RealESRGANer(4, [f"{W}/realesr-general-x4v3.pth", f"{W}/realesr-general-wdn-x4v3.pth"],
                  model=model, tile=400, tile_pad=10, half=False, device="cpu", dni_weight=[0.6, 0.4])
fe = GFPGANer(model_path=f"{W}/GFPGANv1.3.pth", upscale=4, arch="clean",
              channel_multiplier=2, bg_upsampler=up, device="cpu")
_, _, sr = fe.enhance(neutra, has_aligned=False, only_center_face=False, paste_back=True)
scale = 3840 / max(sr.shape[:2])
final = cv2.resize(sr, (round(sr.shape[1] * scale), round(sr.shape[0] * scale)), interpolation=cv2.INTER_AREA)
lab = cv2.cvtColor(final, cv2.COLOR_BGR2LAB)
lab[:, :, 0] = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(10, 10)).apply(lab[:, :, 0])
final = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
blur = cv2.GaussianBlur(final, (0, 0), 1.4)
final = cv2.addWeighted(final, 1.4, blur, -0.4, 0)
rng = np.random.default_rng(7)
grano = cv2.GaussianBlur(rng.normal(0, 1.6, final.shape[:2]).astype(np.float32), (0, 0), 0.6)
final = np.clip(final.astype(np.float32) + grano[:, :, None], 0, 255).astype(np.uint8)

cv2.imwrite(f"{OUT}/foto_restaurada_4k.png", final)
cv2.imwrite(f"{OUT}/foto_restaurada_4k.jpg", final, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("final:", final.shape[1], "x", final.shape[0])
