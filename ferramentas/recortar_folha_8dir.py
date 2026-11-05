"""Recorta folha de mob em 8 direções × N estados (fundo preto) e monta um atlas transparente.

Uso: python3 recortar_folha_8dir.py <folha.png> <saida.png> <colunas_x> <linhas_y>
  colunas_x: centros das 8 colunas na folha, na ordem da folha (N,NE,E,SE,S,SW,W,NW), separados por vírgula
  linhas_y: centros das linhas de estado que entram no atlas (ex.: parado, voando, atacando)
Saída: atlas com uma linha por estado e 8 colunas na ordem do jogo (S,SW,W,NW,N,NE,E,SE), cada célula
do mesmo tamanho, figura centrada na horizontal e apoiada na base. Imprime o tamanho da célula.
O fundo sai pelo preenchimento a partir da borda de cada janela (pixels quase pretos ligados à borda),
e pelos bolsões pretos fechados pela figura (a partir de 12 px), para não apagar contornos finos.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

folha = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
cols = [int(v) for v in sys.argv[3].split(',')]; linhas = [int(v) for v in sys.argv[4].split(',')]
ORDEM_JOGO = [4, 5, 6, 7, 0, 1, 2, 3]       # S,SW,W,NW,N,NE,E,SE → coluna da folha (N,NE,E,SE,S,SW,W,NW)
MX, MY = 68, 78                               # meia janela em volta do centro de cada quadro
recortes = []
for y in linhas:
    linha = []
    for i in ORDEM_JOGO:
        x = cols[i]
        jan = folha[max(0, y - MY):y + MY, max(0, x - MX):x + MX]
        escuro = jan.max(2) <= 18
        lab, _ = ndimage.label(escuro)
        borda = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]); borda = borda[borda > 0]
        # Fundo = preto ligado à borda + bolsões pretos fechados pela figura (entre antena e cabeça, entre
        # asa e corpo). Bolsão pequeno (< 12 px) fica: costuma ser contorno ou olho.
        tam = ndimage.sum(np.ones_like(lab), lab, range(1, lab.max() + 1))
        grandes = np.nonzero(tam >= 12)[0] + 1
        fundo = np.isin(lab, borda) | np.isin(lab, grandes)
        figura = ~fundo
        # só a maior peça (e o que estiver colado nela): descarta letras e respingos vizinhos
        lf, n = ndimage.label(ndimage.binary_dilation(figura, iterations=2))
        if n > 1:
            tam = ndimage.sum(np.ones_like(lf), lf, range(1, n + 1)); figura &= lf == (1 + int(np.argmax(tam)))
        alfa = ndimage.gaussian_filter(figura.astype(float), 0.6)
        alfa = np.where(figura, 1, alfa * 0.5)
        ys, xs = np.nonzero(figura)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.dstack([jan, (alfa * 255).astype(int)])[y0:y1, x0:x1]
        linha.append(rgba.astype(np.uint8))
    recortes.append(linha)
CW = max(r.shape[1] for l in recortes for r in l) + 4
CH = max(r.shape[0] for l in recortes for r in l) + 4
atlas = np.zeros((CH * len(linhas), CW * 8, 4), np.uint8)
for j, l in enumerate(recortes):
    for i, r in enumerate(l):
        h, w = r.shape[:2]; ox = i * CW + (CW - w) // 2; oy = j * CH + CH - 2 - h
        atlas[oy:oy + h, ox:ox + w] = r
Image.fromarray(atlas, 'RGBA').save(sys.argv[2], optimize=True)
print(sys.argv[2], 'célula', CW, 'x', CH, 'linhas', len(linhas))
