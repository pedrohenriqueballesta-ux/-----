"""Confere partes redesenhadas do Planeta Vegeta contra os moldes: chão x abismo (o abismo é quase preto).

Uso: python3 conferir_abismo.py <pasta_moldes> <pasta_partes> [pasta_dif]
Para cada parte_L_C.png das duas pastas: tamanho, melhor deslocamento (px do molde) e concordância
chão/abismo. Em Namek (terra x mar) as boas deram 86–98% com deslocamento 0. Com pasta_dif, grava
uma imagem por parte: vermelho = chão no molde e abismo na nova; azul = o contrário.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

def abismo(path):
    im = Image.open(path).convert('RGB')
    a = np.array(im.resize((384, 256), Image.BOX)).astype(int)
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    m = ndimage.binary_opening(lum < 40, iterations=1)
    lab, n = ndimage.label(m); tam = np.bincount(lab.ravel())
    return np.isin(lab, np.nonzero(tam >= 60)[0][1:]) if n else m, im.size

moldes, partes = Path(sys.argv[1]), Path(sys.argv[2]); dif = Path(sys.argv[3]) if len(sys.argv) > 3 else None
if dif: dif.mkdir(parents=True, exist_ok=True)
for molde in sorted(moldes.glob('parte_*.png')):
    nova = partes / molde.name
    if not nova.exists(): print(molde.stem, 'FALTA'); continue
    mm, _ = abismo(molde); mn, tam = abismo(nova)
    best = max(((np.roll(np.roll(mm, dy, 0), dx, 1) == mn).mean(), dx * 4, dy * 4) for dx in range(-12, 13) for dy in range(-12, 13))
    print(f'{molde.stem}  {tam[0]}x{tam[1]}{"" if tam == (1536, 1024) else " (TAMANHO ERRADO)"}  concordância {best[0]*100:5.1f}%  desloc ({best[1]:+d},{best[2]:+d})  abismo molde {mm.mean()*100:4.1f}% nova {mn.mean()*100:4.1f}%')
    if dif:
        rgb = np.zeros(mm.shape + (3,), np.uint8); rgb[~mm & mn] = (255, 40, 40); rgb[mm & ~mn] = (60, 120, 255); rgb[mm & mn] = (40, 40, 40); rgb[~mm & ~mn] = (200, 190, 170)
        Image.fromarray(rgb).save(dif / molde.name)
