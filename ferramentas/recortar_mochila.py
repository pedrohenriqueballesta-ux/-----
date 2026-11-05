"""Recorta da imagem do inventário (ChatGPT, 853x1280) a silhueta do Goku e os ícones fantasmas dos slots
de equipamento, com fundo transparente, para a janela da Mochila montada em HTML/CSS.
Uso: python3 recortar_mochila.py <inventario.png> <pasta_saida>
Silhueta: só o que é mais ESCURO que o painel vira preto-azulado translúcido. Ícones: só o traço mais CLARO
que o fundo do slot vira branco-azulado translúcido (a cor de fundo esverdeada da imagem não vem junto)."""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image

# Caixa externa (borda azul) de cada slot de equipamento, em px da imagem.
SLOTS = {'mochila': (212, 189, 306, 276), 'cabeca': (377, 152, 476, 231), 'colar': (547, 189, 641, 276),
         'anel': (212, 301, 306, 387), 'peito': (379, 305, 475, 387), 'braco': (547, 301, 641, 387),
         'arma': (212, 411, 306, 497), 'calca': (379, 407, 475, 489), 'cinto': (547, 411, 641, 497),
         'botas': (379, 499, 475, 573)}
AREA = (180, 140, 673, 585)      # área de equipamento (a silhueta e os slots se posicionam nela)
SILHUETA = (318, 225, 534, 582)

def lum(a): return a[..., :3] @ [0.299, 0.587, 0.114]

im = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(float)
saida = Path(sys.argv[2]); saida.mkdir(parents=True, exist_ok=True)
L = lum(im)
fundo = np.median(L[150:180, 120:200])          # painel liso, fora da silhueta
x0, y0, x1, y1 = SILHUETA
d = np.clip((fundo - L[y0:y1, x0:x1] - 2) / (fundo * 0.55), 0, 1)
# Sob os slots a imagem tem o fundo do slot e o ícone, não o corpo: preenche o corpo ali (o slot cobre por cima).
for a, b, c, e in SLOTS.values():
    a, b, c, e = max(a - x0, 0), max(b - y0, 0), min(c - x0, x1 - x0), min(e - y0, y1 - y0)
    if a < c and b < e: d[b:e, a:c] = 1
rgba = np.zeros((y1 - y0, x1 - x0, 4)); rgba[..., :3] = (2, 6, 16); rgba[..., 3] = d * 235
Image.fromarray(rgba.astype(np.uint8), 'RGBA').save(saida / 'silhueta.png', optimize=True)
pos = {'area': AREA, 'silhueta': SILHUETA, 'slots': SLOTS}
for nome, (a, b, c, e) in SLOTS.items():
    m = 7                                          # tira a borda azul do slot
    r = L[b + m:e - m, a + m:c - m]
    base = np.percentile(r, 40)
    al = np.clip((r - base - 6) / 70, 0, 1)
    o = np.zeros(r.shape + (4,)); o[..., :3] = (205, 222, 240); o[..., 3] = al * 255
    Image.fromarray(o.astype(np.uint8), 'RGBA').save(saida / f'{nome}.png', optimize=True)
json.dump(pos, open(saida / 'posicoes.json', 'w'))
print('ok', fundo)
