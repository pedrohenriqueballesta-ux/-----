"""Recorta uma folha de caminhada (fundo magenta) em quadros alinhados pela cabeça.

Uso: python3 fatiar_caminhada.py <folha.png> <saida.png> <saida.json> [linhas] [colunas] [halo|conectado] [verde]
Cada linha da folha é uma direção; cada coluna, um quadro do ciclo.
Gera um atlas transparente com uma célula por quadro e o JSON com
[sx, sy, w, h, ancoraX, ancoraY] de cada quadro (âncora = centro dos pés no chão).
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

folha, saida_png, saida_json = sys.argv[1:4]
LINHAS = int(sys.argv[4]) if len(sys.argv) > 4 else 5
COLUNAS = int(sys.argv[5]) if len(sys.argv) > 5 else 4
# 7º argumento "verde": folha com fundo verde puro (#00FF00), para personagem com lilás/roxo na borda
# (a aura de fumaça do Porunga BOSS sumia junto com o magenta). Padrão: magenta.
FUNDO_VERDE = len(sys.argv) > 7 and sys.argv[7] == "verde"
MAGENTA = np.array([0, 255, 0]) if FUNDO_VERDE else np.array([255, 0, 255])

# 6º argumento "conectado": para personagens roxos/rosados, cuja pele seria apagada pela regra do halo.
MODO = sys.argv[6] if len(sys.argv) > 6 else "halo"

rgb = np.array(Image.open(folha).convert("RGB")).astype(int)
dist = np.abs(rgb - MAGENTA).sum(2)
if MODO == "conectado":
    # Fundo = tons próximos do magenta ligados à borda da imagem (o contorno escuro do desenho
    # serve de barreira), mais buracos internos de magenta quase puro (entre braço e corpo).
    perto, n = ndimage.label(dist < 110)
    bordas = set(np.unique(np.concatenate([perto[0], perto[-1], perto[:, 0], perto[:, -1]]))) - {0}
    fundo = np.isin(perto, list(bordas)) | (dist < 45)
    frente = ~fundo
else:
    # Rosado = mistura do contorno com o fundo; vira transparente para não deixar halo.
    rosado = (rgb[..., 0] > 150) & (rgb[..., 2] > 150) & (rgb[..., 1] < 110)
    frente = (dist > 90) & ~rosado
frente = ndimage.binary_opening(frente, iterations=1)

# Um personagem por componente grande (cabelo e corpo podem vir separados: juntamos por proximidade).
# No modo conectado o contorno já fecha a silhueta; dilatar pouco evita colar linhas vizinhas da folha.
fechado = ndimage.binary_dilation(frente, iterations=2 if MODO == "conectado" else 6)
rot, n = ndimage.label(fechado)
caixas = [sl for sl in ndimage.find_objects(rot) if sl and (sl[0].stop - sl[0].start) > 60]
assert len(caixas) == LINHAS * COLUNAS, f"esperava {LINHAS * COLUNAS} personagens, achei {len(caixas)}"
caixas.sort(key=lambda sl: sl[0].start)
grade = [sorted(caixas[r * COLUNAS:(r + 1) * COLUNAS], key=lambda sl: sl[1].start) for r in range(LINHAS)]


def recorte(sl, pad=4):
    y0, y1 = max(sl[0].start - pad, 0), min(sl[0].stop + pad, rgb.shape[0])
    x0, x1 = max(sl[1].start - pad, 0), min(sl[1].stop + pad, rgb.shape[1])
    alfa = (frente[y0:y1, x0:x1] * 255).astype(np.uint8)
    return np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), alfa])


def pes(q):
    """Linha do chão (último pixel opaco) e centro horizontal dos pés."""
    a = q[..., 3] > 0
    ys = np.nonzero(a.any(1))[0]
    chao = ys[-1]
    faixa = a[max(chao - 6, 0):chao + 1]
    xs = np.nonzero(faixa.any(0))[0]
    return chao, (xs[0] + xs[-1]) / 2


def cabeca(q, altura):
    a = (q[..., 3] > 0).astype(float)
    return a[:int(altura * 0.42)]


def deslocamento(ref, mov, raio=6):
    """Desvio horizontal que melhor encaixa a silhueta da cabeça de mov na de ref."""
    melhor, dx_bom = None, 0
    h = min(ref.shape[0], mov.shape[0])
    for dx in range(-raio, raio + 1):
        w = max(ref.shape[1], mov.shape[1]) + 2 * raio
        A = np.zeros((h, w)); B = np.zeros((h, w))
        A[:, raio:raio + ref.shape[1]] = ref[:h]
        B[:, raio + dx:raio + dx + mov.shape[1]] = mov[:h]
        erro = np.abs(A - B).sum()
        if melhor is None or erro < melhor:
            melhor, dx_bom = erro, dx
    return dx_bom


quadros = [[recorte(sl) for sl in linha] for linha in grade]
CEL_W = max(q.shape[1] for l in quadros for q in l) + 24
CEL_H = max(q.shape[0] for l in quadros for q in l) + 16
atlas = Image.new("RGBA", (CEL_W * COLUNAS, CEL_H * LINHAS), (0, 0, 0, 0))
dados, alturas = [], []
for r, linha in enumerate(quadros):
    chao0, px0 = pes(linha[0])
    alt0 = chao0 + 1
    # Âncora horizontal no centro do tronco (não dos pés, que ficam abertos no quadro de contato).
    a0 = linha[0][..., 3] > 0
    faixa = a0[int(alt0 * 0.45):int(alt0 * 0.65)]
    cols = np.nonzero(faixa.any(0))[0]
    tronco0 = (cols[0] + cols[-1]) / 2
    ref = cabeca(linha[0], alt0)
    # Alinha cada quadro ao primeiro: chão na mesma linha e cabeça no mesmo x.
    frames = []
    for c, q in enumerate(linha):
        chao, _ = pes(q)
        dx = 0 if c == 0 else deslocamento(ref, cabeca(q, chao + 1))
        cx = c * CEL_W + (CEL_W - linha[0].shape[1]) // 2 + dx
        cy = r * CEL_H + (CEL_H - 6) - chao
        atlas.alpha_composite(Image.fromarray(q, "RGBA"), (int(cx), int(cy)))
        ancora_x = c * CEL_W + (CEL_W - linha[0].shape[1]) // 2 + tronco0
        frames.append([c * CEL_W, r * CEL_H, CEL_W, CEL_H, round(ancora_x, 1), r * CEL_H + CEL_H - 6])
    dados.append(frames)
    alturas.append(int(alt0 - np.nonzero(linha[0][..., 3].any(1))[0][0]))
atlas.save(saida_png)
json.dump({"cell": [CEL_W, CEL_H], "linhas": LINHAS, "colunas": COLUNAS, "alturas": alturas, "frames": dados}, open(saida_json, "w"))
print("atlas", atlas.size, "célula", CEL_W, CEL_H)
