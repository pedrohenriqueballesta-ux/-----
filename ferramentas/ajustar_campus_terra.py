"""Refaz a metade de baixo do círculo do campus da Corporação Cápsula (Terra) espelhando a de cima.

Uso: python3 ajustar_campus_terra.py <chao.png> <saida.png>
A parte que desenha a metade de baixo (parte_3_1) saiu com o círculo de outro raio duas vezes; o círculo é simétrico e
encosta nas duas avenidas, então a metade de cima (que bate com a planta) serve de molde para a de baixo.
"""
import sys
import numpy as np
from PIL import Image

im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
K = im.shape[1] / 8400; cx, cy, r = 1400 * K, 1650 * K, 420 * K
y0, y1, x0, x1 = int(cy), int(cy + r + 12), int(cx - r - 120), int(cx + r + 120)   # para antes da calçada da avenida
yy, xx = np.mgrid[y0:y1, x0:x1]; d = np.hypot(xx - cx, yy - cy)
espelho = im[(2 * cy - yy).astype(int), xx]
w = np.clip((r + 100 - d) / 30, 0, 1) * np.clip((yy - cy) / 6, 0, 1) * np.clip((y1 - yy) / 10, 0, 1)
im[y0:y1, x0:x1] = im[y0:y1, x0:x1] * (1 - w[..., None]) + espelho * w[..., None]
Image.fromarray(im.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
