"""Converte a máscara de passagem (PNG branco = anda, preto = bloqueia) em módulo JS.

Uso: python3 converter_mascara.py <passagem.png> <saida.mjs> <largura_mundo> <altura_mundo> [reducao]
Reduz a máscara em blocos de `reducao` px (padrão 2): o bloco anda se a maioria anda.
Cada linha vira uma lista de corridas alternadas, começando por "anda".
"""
import sys
import numpy as np
from PIL import Image

png, saida, mw, mh = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
red = int(sys.argv[5]) if len(sys.argv) > 5 else 2
m = np.array(Image.open(png).convert('L')) > 127
h, w = (m.shape[0] // red) * red, (m.shape[1] // red) * red
g = m[:h, :w].reshape(h // red, red, w // red, red).mean((1, 3)) >= 0.5
rows, cols = g.shape
linhas = []
for row in g:
    corridas, atual, n = [], True, 0
    for v in row:
        if v == atual: n += 1
        else: corridas.append(n); atual, n = v, 1
    corridas.append(n)
    linhas.append('.'.join(np.base_repr(c, 36).lower() for c in corridas))
cell_w, cell_h = mw / cols, mh / rows
with open(saida, 'w') as f:
    f.write(f"""// Máscara de passagem gerada por ferramentas/converter_mascara.py a partir de
// public/assets/namek/passagem.png (branco = anda, preto = bloqueia). Não edite à mão:
// corrija o PNG e gere de novo. Cada linha: corridas em base 36, alternando anda/bloqueia,
// começando por anda.
export const NAMEK_PASSAGEM = {{ cols: {cols}, rows: {rows}, cellW: {cell_w}, cellH: {cell_h}, linhas: {linhas!r} }};
""".replace("'", '"'))
print(f'{cols}x{rows} células de {cell_w}x{cell_h}; anda {g.mean()*100:.1f}%')
