"""Recorta árvores secas e cristais do solo do Planeta Vegeta como figuras com transparência.

Uso: python3 recortar_arvore_vegeta.py <solo-8192.png> <objetos.json> <pasta_saida> [pasta_conferencia]
objetos.json: [{"id","tipo": "arvore"|"cristal","x","y" (base no chão, px de 4608),"caixa": [x0,y0,x1,y1] (px de 4608)}].
Árvore: casca tem azul/verde ≥ 0,5 e é escura (o chão, ~0,41 e claro); fica o que liga ao tronco.
Cristal: roxo. Grava <id>.png (RGBA, px do solo de 8192) e objetos-recortados.json com a posição de cada recorte.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
solo = Image.open(sys.argv[1]).convert('RGB'); K = solo.width / 4608
objs = json.load(open(sys.argv[2])); saida = Path(sys.argv[3]); saida.mkdir(parents=True, exist_ok=True)
conf = Path(sys.argv[4]) if len(sys.argv) > 4 else None
if conf: conf.mkdir(parents=True, exist_ok=True)
lista = []
# Máscara de passagem (4608, branco = anda) ampliada para o solo; opcional, ao lado do objetos.json.
_p = Path(sys.argv[2]).with_name('passagem.png')
PASSAGEM = Image.open(_p).convert('L').resize(solo.size, Image.NEAREST) if _p.exists() else None
for o in objs:
    x0, y0, x1, y1 = [round(v * K) for v in o['caixa']]
    c = np.array(solo.crop((x0, y0, x1, y1))).astype(float); r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if o['tipo'] == 'arvore':
        bg = ndimage.uniform_filter(b / (g + 1), 5); lum = ndimage.uniform_filter(r * .3 + g * .59 + b * .11, 5)
        bg = ndimage.uniform_filter(b / (g + 1), 3); lum = ndimage.uniform_filter(r * .3 + g * .59 + b * .11, 3)
        m = (bg > 0.52) & (bg < 0.8) & (lum < 90)  # paredão tem mais azul (arroxeado) que a casca
    else:
        m = (b > r * 0.7) & (b > g + 30)
        m |= ndimage.binary_dilation(m, iterations=3) & ((r * .3 + g * .59 + b * .11) > 150)  # brilho do cristal
    if o['tipo'] == 'arvore':
        # Sem preencher buracos: o chão cercado pelos galhos não é árvore. O fechamento só costura frestas finas
        # (entre troncos, no meio da casca) e não passa muito do que já era casca.
        m = ndimage.binary_closing(m, iterations=4) & ndimage.binary_dilation(m, iterations=2)
    else:
        m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
    rot, n = ndimage.label(m)
    bx, by = round(o['x'] * K) - x0, round(o['y'] * K) - y0
    # Componente que passa perto da base (o tronco); para cristal, todas as grandes.
    if o['tipo'] == 'arvore':
        perto = rot[max(0, by - 40):by + 5, max(0, bx - 40):bx + 40]
        ks = [k for k in np.unique(perto) if k]; tam = np.bincount(rot.ravel())
        m = rot == max(ks, key=lambda k: tam[k])
    else:
        tam = np.bincount(rot.ravel()); tam[0] = 0; m = np.isin(rot, np.nonzero(tam >= 60)[0])
    m = ndimage.binary_opening(m, iterations=1)
    # Paredão e abismo não são árvore: fora do chão andável (passagem.png), só vale perto do tronco.
    if o['tipo'] == 'arvore' and PASSAGEM is not None:
        anda = np.array(PASSAGEM.crop((x0, y0, x1, y1)).resize((x1 - x0, y1 - y0))) > 127
        yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]]
        m &= anda | (np.hypot((xx - bx) / 1.0, (yy - by) * 1.6) < 110 * K)
        rot, _ = ndimage.label(m); perto = rot[max(0, by - 40):by + 5, max(0, bx - 40):bx + 40]
        ks = [k for k in np.unique(perto) if k]; tam = np.bincount(rot.ravel()); m = rot == max(ks, key=lambda k: tam[k])
    # Só o que fica acima da base é figura (o pé abaixo é chão, o personagem pisa na frente).
    m[by + 1:] = False
    alfa = (ndimage.gaussian_filter(m.astype(float), 0.7) * 255).clip(0, 255).astype(np.uint8)
    rgba = np.dstack([c.astype(np.uint8), alfa])
    ys, xs = np.nonzero(alfa > 8); cx0, cy0, cx1, cy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(rgba[cy0:cy1, cx0:cx1]).save(saida / f"{o['id']}.png")
    lista.append({'id': o['id'], 'tipo': o['tipo'], 'x': o['x'], 'y': o['y'], 'img': [int(x0 + cx0), int(y0 + cy0), int(cx1 - cx0), int(cy1 - cy0)]})
    if conf:
        vis = c.copy(); vis[~m] *= 0.25; Image.fromarray(np.concatenate([c, vis], 1).astype(np.uint8)).save(conf / f"{o['id']}.png")
json.dump({'escala': K, 'objetos': lista}, open(saida / 'objetos-recortados.json', 'w'), indent=1)
print(len(lista), 'recortes')
