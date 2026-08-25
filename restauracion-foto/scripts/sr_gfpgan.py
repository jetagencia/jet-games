#!/usr/bin/env python3
"""Real-ESRGAN x4 + GFPGAN sobre la imagen colorizada."""
import time
import cv2
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from gfpgan import GFPGANer

OUT = "/tmp/claude-0/-home-user-jet-games/1db8ebd8-f4d6-53dc-98b4-7ae4cb8e6897/scratchpad/out"
W = "/root/.cache/weights"

img = cv2.imread(f"{OUT}/03d_manchas.png")
print("entrada", img.shape[1], "x", img.shape[0], flush=True)

model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
upsampler = RealESRGANer(
    scale=4,
    model_path=f"{W}/RealESRGAN_x4plus.pth",
    model=model,
    tile=400,
    tile_pad=10,
    pre_pad=0,
    half=False,
    device="cpu",
)

face_enhancer = GFPGANer(
    model_path=f"{W}/GFPGANv1.3.pth",
    upscale=4,
    arch="clean",
    channel_multiplier=2,
    bg_upsampler=upsampler,
    device="cpu",
)

t0 = time.time()
_, _, restored = face_enhancer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
print(f"listo en {time.time() - t0:.0f}s ->", restored.shape[1], "x", restored.shape[0], flush=True)

cv2.imwrite(f"{OUT}/04_sr_gfpgan.png", restored)

# tamaño final 4K vertical (lado largo 3840)
scale = 3840 / max(restored.shape[:2])
final = cv2.resize(restored, (round(restored.shape[1] * scale), round(restored.shape[0] * scale)), interpolation=cv2.INTER_AREA)
cv2.imwrite(f"{OUT}/05_final_4k.png", final)
cv2.imwrite(f"{OUT}/05_final_4k.jpg", final, [cv2.IMWRITE_JPEG_QUALITY, 96])
print("final:", final.shape[1], "x", final.shape[0], flush=True)
