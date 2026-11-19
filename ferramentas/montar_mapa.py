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
# --alinhar (17/11/2026): antes de cortar, mede na sobra o quanto a parte nova está deslocada em relação ao que já está
# no mapa (cada parte é desenhada separada pela IA e um meio-fio ou uma margem pode vir 10-40 px fora do lugar) e entorta
# a parte nova para encaixar na emenda, voltando ao normal aos poucos para dentro dela. Sem isso o corte deixava um
# "degrau" no meio-fio (relato do Pedro na Terra).
ALINHAR = '--alinhar' in sys.argv
JANELA, QUEDA, MAX_DESLOC = 192, 360, 45
# --cor: iguala o tom da parte nova ao do que já está no mapa, medido na sobra (a grama de um pedaço sai mais clara ou
# mais amarela que a do vizinho e a emenda vira uma "parede" de cor). A correção é suave e some para dentro da parte.
COR = '--cor' in sys.argv
QUEDA_COR = 600
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


def bordas(a):
    g = a.mean(2); e = np.hypot(*np.gradient(ndimage.gaussian_filter(g, 1.2)))
    return (e - e.mean()) / (e.std() + 1e-6)


def deslocamento(a, b):
    """(dy, dx, confiança) que leva `a` a `b`: b(y, x) ≈ a(y + dy, x + dx). Correlação de fase das bordas."""
    A, B = np.fft.fft2(bordas(a)), np.fft.fft2(bordas(b))
    R = A * np.conj(B); R /= np.abs(R) + 1e-9
    c = np.real(np.fft.ifft2(R)); iy, ix = np.unravel_index(c.argmax(), c.shape)
    dy = iy - c.shape[0] if iy > c.shape[0] // 2 else iy; dx = ix - c.shape[1] if ix > c.shape[1] // 2 else ix
    return dy, dx, c.max() / (c.std() + 1e-9)


def perfil(medidas, n):
    """Medidas (posição, dy, dx) confiáveis → curva suave de dy e dx ao longo da emenda (0 onde não há medida)."""
    dy, dx = np.zeros(n), np.zeros(n)
    if not medidas: return dy, dx
    pos = np.array([m[0] for m in medidas]); vy = ndimage.median_filter(np.array([m[1] for m in medidas], float), 3)
    vx = ndimage.median_filter(np.array([m[2] for m in medidas], float), 3)
    t = np.arange(n); dy = np.interp(t, pos, vy); dx = np.interp(t, pos, vx)
    return ndimage.gaussian_filter1d(dy, JANELA / 3), ndimage.gaussian_filter1d(dx, JANELA / 3)


def alinhar(img, antigo, topo, lado):
    H, W = img.shape[:2]; DY, DX = np.zeros((H, W)), np.zeros((H, W))
    if lado > 40:      # emenda vertical (sobra da esquerda): medidas ao longo de y
        med = []
        for y0 in range(topo, H - JANELA + 1, JANELA // 2):
            dy, dx, conf = deslocamento(img[y0:y0 + JANELA, :lado], antigo[y0:y0 + JANELA, :lado])
            if conf > 8 and abs(dy) <= MAX_DESLOC and abs(dx) <= MAX_DESLOC: med.append((y0 + JANELA // 2, dy, dx))
        dy, dx = perfil(med, H); w = np.clip(1 - (np.arange(W) - lado) / QUEDA, 0, 1)
        DY += dy[:, None] * w[None, :]; DX += dx[:, None] * w[None, :]
    if topo > 40:      # emenda horizontal (sobra de cima): medidas ao longo de x
        med = []
        for x0 in range(0, W - JANELA + 1, JANELA // 2):
            dy, dx, conf = deslocamento(img[:topo, x0:x0 + JANELA], antigo[:topo, x0:x0 + JANELA])
            if conf > 8 and abs(dy) <= MAX_DESLOC and abs(dx) <= MAX_DESLOC: med.append((x0 + JANELA // 2, dy, dx))
        dy, dx = perfil(med, W); w = np.clip(1 - (np.arange(H) - topo) / QUEDA, 0, 1)
        DY += w[:, None] * dy[None, :]; DX += w[:, None] * dx[None, :]
    if not DY.any() and not DX.any(): return img, 0.0
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    out = np.stack([ndimage.map_coordinates(img[..., c], [yy + DY, xx + DX], order=1, mode='nearest') for c in range(3)], 2)
    return out, float(np.abs(np.dstack([DY, DX])).max())


def igualar_cor(img, antigo, topo, lado):
    H, W = img.shape[:2]; ajuste = np.zeros_like(img)
    if lado > 20:
        d = ndimage.gaussian_filter1d((antigo[:, :lado] - img[:, :lado]).mean(1), 80, axis=0)
        w = np.clip(1 - (np.arange(W) - lado) / QUEDA_COR, 0, 1); ajuste += d[:, None, :] * w[None, :, None]
    if topo > 20:
        d = ndimage.gaussian_filter1d((antigo[:topo] - img[:topo]).mean(0), 80, axis=0)
        w = np.clip(1 - (np.arange(H) - topo) / QUEDA_COR, 0, 1); ajuste += w[:, None, None] * d[None, :, :]
    return img + np.clip(ajuste, -40, 40)


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
    # Sobra de cima: linhas do topo já preenchidas em toda a largura → costura horizontal.
    topo = int(np.argmin(ja.all(1))) if not ja.all(1).all() else H
    if ALINHAR and ja.any():
        lado0 = int(np.argmin(ja[topo:].all(0))) if topo < H and not ja[topo:].all(0).all() else 0
        img, maior = alinhar(img, antigo, topo if topo < H else 0, lado0)
        if maior: print(f'  {nome}: entortada até {maior:.0f} px para encaixar')
    if COR and ja.any():
        lado1 = int(np.argmin(ja[topo:].all(0))) if topo < H and not ja[topo:].all(0).all() else 0
        img = igualar_cor(img, antigo, topo if topo < H else 0, lado1)
    dif = ((img - antigo) ** 2).sum(2)
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
