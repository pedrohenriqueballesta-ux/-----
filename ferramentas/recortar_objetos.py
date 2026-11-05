"""Recorta objetos soltos (árvores, arbustos, pedras) de uma folha com fundo magenta e monta um atlas.

Uso: python3 recortar_objetos.py <folha.png> <atlas.png> <objetos.json>
Cada objeto = um bloco de pixels não-magenta (partes próximas juntadas). Ordem: linha a linha, da
esquerda para a direita. objetos.json: lista de [sx, sy, w, h, baseX, baseY] no atlas, com a base no
centro do último pixel opaco embaixo (onde o objeto toca o chão).
"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

rgb = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
dist = np.abs(rgb - [255, 0, 255]).sum(2)
perto, _ = ndimage.label(dist < 110)
borda = set(np.unique(np.r_[perto[0], perto[-1], perto[:, 0], perto[:, -1]])) - {0}
frente = ~(np.isin(perto, list(borda)) | (dist < 45))
frente = ndimage.binary_opening(frente, iterations=1)
rot, n = ndimage.label(ndimage.binary_dilation(frente, iterations=8))
caixas = [s for s in ndimage.find_objects(rot) if s and (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 1500]
caixas.sort(key=lambda s: s[0].stop)                      # pela base
linhas, atual = [], [caixas[0]]
for s in caixas[1:]:
    if abs(s[0].stop - atual[-1][0].stop) < 60: atual.append(s)
    else: linhas.append(atual); atual = [s]
linhas.append(atual)
ordem = [s for l in linhas for s in sorted(l, key=lambda s: s[1].start)]
recs = []
for s in ordem:
    y0, y1, x0, x1 = s[0].start, s[0].stop, s[1].start, s[1].stop
    m = frente[y0:y1, x0:x1] & (rot[y0:y1, x0:x1] == rot[(y0 + y1) // 2, (x0 + x1) // 2] if False else frente[y0:y1, x0:x1])
    recs.append(np.dstack([rgb[y0:y1, x0:x1], m * 255]).astype(np.uint8))
W = sum(r.shape[1] + 4 for r in recs); H = max(r.shape[0] for r in recs)
atlas = np.zeros((H, W, 4), np.uint8); x = 0; info = []
for r in recs:
    h, w = r.shape[:2]; atlas[H - h:H, x:x + w] = r
    ys, xs = np.nonzero(r[..., 3] > 0); fundo = ys.max()
    base_x = xs[ys >= fundo - 3].mean()
    info.append([x, H - h, w, h, round(x + base_x, 1), H - h + int(fundo)]); x += w + 4
Image.fromarray(atlas, 'RGBA').save(sys.argv[2], optimize=True)
json.dump(info, open(sys.argv[3], 'w'))
print(len(info), 'objetos; linhas:', [len(l) for l in linhas], '; atlas', W, 'x', H)
