"""Confere uma parte redesenhada contra o recorte original (terra x mar ligado à borda).

Uso: python3 conferir_parte.py <parte_original.png> <parte_nova.png> <saida_dif.png>
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def mar(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    agua = (g > 150) & (g > b + 15) & (r < 150)
    # Vegetação verde-clara parece água: só conta a água em blocos grandes.
    agua = ndimage.binary_opening(agua, iterations=3)
    lab, n = ndimage.label(agua); tam = np.bincount(lab.ravel())
    return np.isin(lab, np.nonzero(tam >= 4000)[0][1:]), a.shape

mr, s1 = mar(sys.argv[1]); mh, s2 = mar(sys.argv[2])
print('tamanho', s2[1], 'x', s2[0], '' if s2 == s1 else '(DIFERENTE do original!)')
best = None
for dx in range(-60, 61, 6):
    for dy in range(-60, 61, 6):
        s = (np.roll(np.roll(mr, dy, 0), dx, 1) == mh).mean()
        if best is None or s > best[0]: best = (s, dx, dy)
print('concordância terra/mar: %.1f%%  deslocamento: %s' % ((mr == mh).mean() * 100, best[1:]))
v = np.zeros(s2, np.uint8); v[mr & mh] = (40, 90, 160); v[~mr & ~mh] = (200, 200, 200)
v[mr & ~mh] = (230, 40, 40); v[~mr & mh] = (250, 200, 0)
Image.fromarray(v).resize((768, 512)).save(sys.argv[3])
