"""Gera public/shared/vegeta-passagem.mjs a partir de passagem.png (4608×3072, branco = anda).

Uso: python3 gerar_modulo_vegeta.py <passagem.png> <saida.mjs>
Grade de 768×512 células de 6 px (como Namek): a célula anda se a maioria anda. Cada ilha de chão vira
uma área, reconhecida pelo centro (px da imagem de 4608) mais próximo em REGIOES. Grava, por linha, as
corridas anda/bloqueia (base 36, começando por anda) e as corridas de área ("indice*comprimento" em
base 36; 0 = nenhuma). Imprime a caixa de cada área, o tamanho e uma sugestão de chegada (o ponto da
ilha mais próximo da cidade, onde a estrada chega) e de portal na cidade (na direção de cada hunt).
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

REGIOES = {  # id: centro aproximado na imagem de 4608
    'vegeta-cidade': (2300, 1320), 'vegeta-planicies': (750, 1550), 'vegeta-canions': (1300, 500),
    'vegeta-floresta': (3500, 600), 'vegeta-lava': (3800, 1800), 'vegeta-cratera': (2100, 2470)}
RED = 6
m = np.array(Image.open(sys.argv[1]).convert('L')) > 127
H, W = m.shape; rows, cols = H // RED, W // RED
g = m[:rows * RED, :cols * RED].reshape(rows, RED, cols, RED).mean((1, 3)) >= 0.5
rot, n = ndimage.label(g)
ids = list(REGIOES); area = np.zeros_like(rot)
info = {}
# Cada região fica com a maior ilha perto do centro dela; ilhotas soltas (entre mesas, na borda) bloqueiam.
tam = np.bincount(rot.ravel()); escolha = {}
for k in range(1, n + 1):
    ys, xs = np.nonzero(rot == k)
    cx, cy = xs.mean() * RED, ys.mean() * RED
    nome = min(ids, key=lambda i: (REGIOES[i][0] - cx) ** 2 + (REGIOES[i][1] - cy) ** 2)
    if nome not in escolha or tam[k] > tam[escolha[nome]]: escolha[nome] = k
for k in range(1, n + 1):
    if k not in escolha.values(): g[rot == k] = False; print('ilhota descartada:', tam[k], 'células')
for nome, k in escolha.items():
    ys, xs = np.nonzero(rot == k)
    area[rot == k] = ids.index(nome) + 1
    info[nome] = dict(caixa=[int(xs.min() * RED), int(ys.min() * RED), int((xs.max() + 1 - xs.min()) * RED), int((ys.max() + 1 - ys.min()) * RED)],
                      chao_mpx2=round(len(ys) * RED * RED / 1e6, 2), celulas=(ys, xs))
assert set(info) == set(ids), f'faltou: {set(ids) - set(info)}'
cid = REGIOES['vegeta-cidade']
# Ponto bem dentro da ilha (longe da borda) mais próximo de um alvo.
def ponto_dentro(nome, alvo, folga=10):
    msk = area == ids.index(nome) + 1
    dist = ndimage.distance_transform_edt(msk)
    ys, xs = np.nonzero(dist >= folga)
    d = (xs * RED - alvo[0]) ** 2 + (ys * RED - alvo[1]) ** 2; i = d.argmin()
    return [int(xs[i] * RED + RED // 2), int(ys[i] * RED + RED // 2)]
# Onde cada estrada entra na hunt (chegada e saída) e onde ela passa na cidade (portal), em px de 4608;
# o ponto final é o mais próximo com folga de chão em volta.
ESTRADAS = {'vegeta-planicies': ((1340, 1340), (1960, 1360)), 'vegeta-canions': ((1715, 755), (2040, 1140)),
            'vegeta-floresta': ((2935, 800), (2560, 1197)), 'vegeta-lava': ((3040, 1540), (2590, 1522)),
            'vegeta-cratera': ((2205, 2260), (2275, 1600))}
for nome in ids:
    if nome == 'vegeta-cidade': info[nome]['chegada'] = ponto_dentro(nome, cid, 20)
    else:
        info[nome]['chegada'] = ponto_dentro(nome, ESTRADAS[nome][0], 14)
        info[nome]['portal_na_cidade'] = ponto_dentro('vegeta-cidade', ESTRADAS[nome][1], 8)
def rle(linha, fmt):
    out, atual, k = [], linha[0], 0
    for v in linha:
        if v == atual: k += 1
        else: out.append(fmt(atual, k)); atual, k = v, 1
    out.append(fmt(atual, k)); return '.'.join(out)
anda = []
for row in g:
    c, atual, k = [], True, 0
    for v in row:
        if v == atual: k += 1
        else: c.append(k); atual, k = v, 1
    c.append(k); anda.append('.'.join(np.base_repr(x, 36).lower() for x in c))
areas = [rle(row, lambda v, k: f'{v}*{np.base_repr(k, 36).lower()}') for row in area]
with open(sys.argv[2], 'w') as f:
    f.write(f"""// Máscara de passagem do Planeta Vegeta, gerada por ferramentas/gerar_modulo_vegeta.py a partir de
// ~/idle-dbz/referencias/mapas/vegeta/passagem.png (gerar_mascara_vegeta.py + bloqueios.json). Não edite à mão.
// linhas: corridas em base 36, alternando anda/bloqueia, começando por anda. areas: por célula, a área
// (índice em `ids`, 1 em diante; 0 = nenhuma), em corridas "índice*comprimento" (comprimento em base 36).
export const VEGETA_PASSAGEM = {{ cols: {cols}, rows: {rows}, cellW: {RED}.0, cellH: {RED}.0, ids: {json.dumps(ids)}, linhas: {json.dumps(anda)}, areas: {json.dumps(areas)} }};
""")
print(f'{cols}x{rows} células; anda {g.mean()*100:.1f}%')
for nome in ids:
    d = {k: v for k, v in info[nome].items() if k != 'celulas'}; print(nome, json.dumps(d))
