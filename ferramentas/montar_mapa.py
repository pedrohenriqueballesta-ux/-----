"""Monta o mapa final a partir das partes redesenhadas, emendando pela linha de menor diferença.

Uso: python3 montar_mapa.py <partes.json> <pasta_partes_hd> <saida.png> [largura_final] [--mistura]
partes.json: retângulo [x, y, w, h] de cada parte na imagem original (de partes_mapa.py);
"_meta" traz o tamanho da original e a sobra (sem ele, vale o das 9 partes: 1536x1024 e 32).

Emenda (padrão, desde 03/11/2026): as partes entram em ordem de leitura (linha a linha). Na sobra
com as vizinhas já postas (à esquerda e acima), acha o caminho em que a parte nova e o que já está
no mapa mais se parecem (costura de menor custo, programação dinâmica) e corta por ele, suavizando
só alguns pixels ao longo do corte. Duas partes desenhadas pela IA nunca têm os mesmos detalhes na
sobra; misturá-las inteira (--mistura, o modo antigo) deixava "fantasma" de detalhe duplicado.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

args = [a for a in sys.argv[1:] if not a.startswith('--')]
MISTURA = '--mistura' in sys.argv
partes = json.loads(Path(args[0]).read_text())
meta = partes.pop('_meta', {'w': 1536, 'h': 1024, 'sobra': 32})
pasta, saida = Path(args[1]), Path(args[2])
FW = int(args[3]) if len(args) > 3 else 4608
ORIG_W, ORIG_H = meta['w'], meta['h']
k = FW / ORIG_W
FH = round(ORIG_H * k)
SUAVE = 2.5   # desvio do desfoque da máscara ao longo do corte (px do mapa final)


def costura(custo):
    """Caminho de cima a baixo de menor custo (um x por linha, passo de no máximo 1 coluna)."""
    h, w = custo.shape
    acc = custo.copy(); de = np.zeros((h, w), np.int8)
    for y in range(1, h):
        ant = acc[y - 1]
        esq = np.r_[np.inf, ant[:-1]]; dir_ = np.r_[ant[1:], np.inf]
        pilha = np.stack([esq, ant, dir_]); i = pilha.argmin(0)
        acc[y] += pilha[i, np.arange(w)]; de[y] = i - 1
    x = np.empty(h, int); x[-1] = int(acc[-1].argmin())
    for y in range(h - 1, 0, -1): x[y - 1] = x[y] + de[y, x[y]]
    return x


def parte(nome, W, H):
    return np.array(Image.open(pasta / f'{nome}.png').convert('RGB').resize((W, H), Image.LANCZOS)).astype(float)


def ordem(item):
    x, y = item[1][:2]
    return (y, x)


mapa = np.zeros((FH, FW, 3)); posto = np.zeros((FH, FW), bool)
if MISTURA:
    soma = np.zeros((FH, FW, 3)); peso = np.zeros((FH, FW, 1))
for nome, (x, y, w, h) in sorted(partes.items(), key=ordem):
    X, Y, W, H = round(x * k), round(y * k), round(w * k), round(h * k)
    W, H = min(W, FW - X), min(H, FH - Y)
    img = parte(nome, W, H)
    if MISTURA:
        borda = meta['sobra'] * k
        wx = np.clip(np.minimum(np.arange(W) + 1, W - np.arange(W)) / borda, 0.02, 1)
        wy = np.clip(np.minimum(np.arange(H) + 1, H - np.arange(H)) / borda, 0.02, 1)
        if X == 0: wx[:W // 2] = 1
        if X + W >= FW: wx[W // 2:] = 1
        if Y == 0: wy[:H // 2] = 1
        if Y + H >= FH: wy[H // 2:] = 1
        wgt = (wy[:, None] * wx[None, :])[..., None]
        soma[Y:Y + H, X:X + W] += img * wgt; peso[Y:Y + H, X:X + W] += wgt
        continue
    antigo, ja = mapa[Y:Y + H, X:X + W], posto[Y:Y + H, X:X + W]
    fica = np.ones((H, W), bool)                      # True = pixel da parte nova
    dif = ((img - antigo) ** 2).sum(2)
    # Sobra de cima: linhas do topo já preenchidas em toda a largura → costura horizontal.
    topo = int(np.argmin(ja.all(1))) if not ja.all(1).all() else H
    if topo > 0:
        c = costura(dif[:topo].T + 1)                 # transposta: corre da esquerda para a direita
        fica &= np.arange(H)[:, None] > c[None, :]
    # Sobra da esquerda: colunas já preenchidas abaixo do topo → costura vertical.
    lado = int(np.argmin(ja[topo:].all(0))) if topo < H and not ja[topo:].all(0).all() else 0
    if lado > 0:
        c = costura(dif[:, :lado] + 1)
        fica &= np.arange(W)[None, :] > c[:, None]
    fica |= ~ja                                       # onde não havia nada, é sempre a parte nova
    m = ndimage.gaussian_filter(fica.astype(float), SUAVE)
    m = np.where(ja, m, 1.0)[..., None]
    mapa[Y:Y + H, X:X + W] = antigo * (1 - m) + img * m
    posto[Y:Y + H, X:X + W] = True
out = (soma / np.maximum(peso, 1e-6) if MISTURA else mapa).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save(saida, optimize=True)
print(saida, out.shape[1], 'x', out.shape[0], '(mistura)' if MISTURA else '(costura)')
