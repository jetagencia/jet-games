#!/usr/bin/env python3
"""Post-proceso del color: balance, limpieza cromática y tono moderno."""
import numpy as np
import cv2

OUT = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad/out"

img = cv2.imread(f"{OUT}/02_color_siggraph17.png")

# 1. limpiar manchas cromáticas: suavizar fuerte los canales a/b conservando L
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
L, a, b = cv2.split(lab)
a = cv2.bilateralFilter(a, 15, 35, 15)
b = cv2.bilateralFilter(b, 15, 35, 15)
a = cv2.medianBlur(a, 5)
b = cv2.medianBlur(b, 5)

# 2. moderar saturaciones extremas (mano naranja, manchas)
af = a.astype(np.float32) - 128.0
bf = b.astype(np.float32) - 128.0
chroma = np.sqrt(af ** 2 + bf ** 2)
cap = 34.0  # tope de croma
factor = np.where(chroma > cap, cap / np.maximum(chroma, 1e-6), 1.0)
# y una vibrance leve para los tonos apagados
factor = factor * np.where(chroma < 12, 1.18, 1.0)
a = np.clip(af * factor + 128.0, 0, 255).astype(np.uint8)
b = np.clip(bf * factor + 128.0, 0, 255).astype(np.uint8)

lab = cv2.merge([L, a, b])
img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# 3. balance de blancos gray-world sobre los tonos claros (la pared debe ser blanca)
imgf = img.astype(np.float32)
gray_mask = (L > 170)
means = [imgf[:, :, c][gray_mask].mean() for c in range(3)]
target = float(np.mean(means))
for c in range(3):
    imgf[:, :, c] *= target / means[c]
img = np.clip(imgf, 0, 255).astype(np.uint8)

# 4. denoise de luminancia y croma (grano de película) antes de escalar
img = cv2.fastNlMeansDenoisingColored(img, None, h=6, hColor=10, templateWindowSize=7, searchWindowSize=21)

# 5. curva en S suave para look actual
lut = np.arange(256, dtype=np.float32) / 255.0
lut = np.clip(lut + 0.10 * np.sin((lut - 0.5) * np.pi), 0, 1)
lut = (lut * 255).astype(np.uint8)
img = cv2.LUT(img, lut)

cv2.imwrite(f"{OUT}/03_color_final.png", img)
print("post-proceso listo")
