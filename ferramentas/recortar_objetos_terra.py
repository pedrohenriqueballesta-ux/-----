"""Recorta as folhas de objetos da Terra (fundo verde puro, ou magenta na arte que já vem pronta) em PNGs transparentes.

Uso: python3 recortar_objetos_terra.py <folha.png> <pasta-saida> <nomes separados por vírgula> [grade COLxLIN]
Sem grade: cada objeto é uma peça solta da folha, da esquerda para a direita (prédios, muros, a nave); com um nome só,
vale a caixa de tudo o que não é fundo (prédio desenhado com partes soltas, como estandartes).
Com grade (ex.: 4x2): um objeto por célula, em ordem de leitura (folhas de decoração).
O verde é tirado também quando fica preso dentro do desenho (entre pernas da nave, grade de portão).
Grava <nome>.png recortado e acrescenta {nome: [largura, altura]} em objetos.json da pasta.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

folha, saida, nomes = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3].split(',')
grade = tuple(int(v) for v in sys.argv[4].split('x')) if len(sys.argv) > 4 else None
saida.mkdir(parents=True, exist_ok=True)
rgb = np.array(Image.open(folha).convert('RGB')).astype(int)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
MAGENTA = r[2, 2] > 180 and b[2, 2] > 180 and g[2, 2] < 80          # fundo magenta (arte vinda pronta) ou verde (molde)
if MAGENTA:
    # Fundo: tons de magenta/rosa ligados à borda (o contorno escuro do desenho serve de barreira).
    perto = (r > 150) & (b > 150) & (g < 140) & (np.minimum(r, b) - g > 60)
    lab, _ = ndimage.label(perto); bordas = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    verde = np.isin(lab, list(bordas))
    verde |= ndimage.binary_opening(perto & (np.minimum(r, b) > 200) & (g < 70), iterations=1)   # magenta preso no desenho (entre palmeira e parede)
    verde |= ndimage.binary_dilation(verde, iterations=1) & (np.minimum(r, b) - g > 40)   # franja rosada da borda
else:
    verde = (g > 150) & (g - np.maximum(r, b) > 90)
alfa = np.where(verde, 0, 255).astype(np.uint8)
beira = ndimage.binary_dilation(verde, iterations=2) & ~verde       # tira a cor do fundo que vazou na borda do desenho
if MAGENTA:
    tinge = beira & (np.minimum(r, b) > g + 25)
    rgb[..., 0] = np.where(tinge, (g + r) // 2, r); rgb[..., 2] = np.where(tinge, (g + b) // 2, b)
else:
    rgb[..., 1] = np.where(beira & (g > np.maximum(r, b)), np.maximum(r, b), g)
img = np.dstack([rgb, alfa]).astype(np.uint8)
corpo = alfa > 0
pecas = []
if grade:
    cols, lins = grade; cw, ch = rgb.shape[1] // cols, rgb.shape[0] // lins
    for i in range(lins):
        for j in range(cols):
            m = np.zeros_like(corpo); m[i * ch:(i + 1) * ch, j * cw:(j + 1) * cw] = corpo[i * ch:(i + 1) * ch, j * cw:(j + 1) * cw]
            ys, xs = np.nonzero(m); pecas.append((m, slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)))
elif len(nomes) == 1:      # um objeto só (prédio de interação): a caixa de tudo o que não é fundo, mesmo em pedaços
    ys, xs = np.nonzero(corpo); pecas.append((None, slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)))
else:
    lab, _ = ndimage.label(ndimage.binary_closing(corpo, iterations=3))
    for s in ndimage.find_objects(lab):
        if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 2000: pecas.append(((lab[s] > 0), s[0], s[1]))
    pecas.sort(key=lambda p: p[2].start)
assert len(pecas) == len(nomes), f'{len(pecas)} peças para {len(nomes)} nomes'
indice = saida / 'objetos.json'
dados = json.loads(indice.read_text()) if indice.exists() else {}
for nome, (_, sy, sx) in zip(nomes, pecas):
    recorte = img[sy, sx].copy()
    Image.fromarray(recorte, 'RGBA').save(saida / f'{nome}.png', optimize=True)
    dados[nome] = [int(sx.stop - sx.start), int(sy.stop - sy.start)]
indice.write_text(json.dumps(dados, indent=1, ensure_ascii=False) + '\n')
print(', '.join(f'{n} {dados[n][0]}x{dados[n][1]}' for n in nomes))
