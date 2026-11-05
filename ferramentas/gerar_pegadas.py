"""Gera public/shared/pegadas-casas.mjs: a pegada no chão de cada casa e ruína, tirada do PNG.

A base de uma construção vista de cima é uma elipse; a curva de baixo do desenho é a metade da
frente dela. Por coluna do desenho, guarda a "frente" (último pixel opaco da coluna) e o
"centro" da elipse (altura da base nas pontas). O jogo bloqueia de trás (2*centro - frente) até a
frente, e desenha na frente da casa quem pisa à frente da curva.

Uso: python3 gerar_pegadas.py <pasta public/assets> <saida .mjs>
Cada conjunto de construções é uma pasta <planeta>/<conjunto> com <nome>_<n>.png (ex.: namek/casas/casa_2.png);
a chave no arquivo gerado é '<planeta>/<conjunto>' e o número do desenho.
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image

AMOSTRAS = 40          # colunas guardadas por desenho
BASE = 0.45            # só conta como base a parte de baixo do desenho (descarta chifres e topo)
# Ruínas: a borda de baixo do desenho é a linha dos escombros, não a base da parede, então a
# profundidade não sai do desenho. Usa a das casas inteiras: meia profundidade da base em
# larguras do desenho (cúpulas ~0,13; a casa alta, ruína 5, ~0,22).
PROFUNDIDADE_FIXA = {'namek/ruinas': {1: 0.13, 2: 0.11, 3: 0.09, 4: 0.13, 5: 0.22, 6: 0.13}}
# Conjuntos de construções (pastas dentro de public/assets). Planeta novo: acrescente aqui.
CONJUNTOS = ['namek/casas', 'namek/ruinas']

def perfil(png, profundidade=None):
    a = np.array(Image.open(png).convert('RGBA'))[..., 3] > 60
    H, W = a.shape
    fundo = np.full(W, -1)
    for x in range(W):
        ys = np.nonzero(a[:, x])[0]
        if len(ys) and ys[-1] >= H * (1 - BASE): fundo[x] = ys[-1]
    cols = np.nonzero(fundo >= 0)[0]
    x0, x1 = cols.min(), cols.max()
    # Centro da elipse: nas casas, a altura da base nas pontas (média das 3% de colunas de cada lado);
    # nas ruínas, a frente mais baixa menos a profundidade fixa.
    if profundidade is None:
        borda = max(1, int((x1 - x0) * 0.03))
        centro = float(np.mean(np.concatenate([fundo[x0:x0 + borda], fundo[x1 - borda + 1:x1 + 1]])))
    else:
        centro = float(fundo[fundo >= 0].max()) - profundidade * W
    frente = []
    for i in range(AMOSTRAS):
        x = int(round(x0 + (x1 - x0) * i / (AMOSTRAS - 1)))
        f = fundo[x] if fundo[x] >= 0 else centro
        frente.append(round(max(f, centro) / W, 4))       # em larguras do desenho, a partir do topo
    return {'alto': round(H / W, 4), 'x0': round(x0 / W, 4), 'x1': round(x1 / W, 4), 'centro': round(centro / W, 4), 'frente': frente}

pasta, saida = Path(sys.argv[1]), Path(sys.argv[2])
dados = {}
for conjunto in CONJUNTOS:
    fixa = PROFUNDIDADE_FIXA.get(conjunto, {})
    dados[conjunto] = {}
    for png in sorted((pasta / conjunto).glob('*.png')):
        n = int(png.stem.split('_')[1])
        dados[conjunto][n] = perfil(png, fixa.get(n))
saida.write_text(
    '// Pegada no chão de cada casa e ruína, gerada por ferramentas/gerar_pegadas.py a partir\n'
    '// dos PNGs de cada conjunto de construções (ex.: assets/namek/casas). Não edite à mão: trocou um desenho, gere de novo.\n'
    '// Medidas em larguras do desenho, a partir do canto de cima: alto = altura/largura do desenho,\n'
    '// x0/x1 = onde a base começa e termina,\n'
    '// centro = altura da base nas pontas, frente = curva de baixo amostrada de x0 a x1.\n'
    'export const PEGADAS = ' + json.dumps(dados, separators=(',', ':')) + ';\n')
print('pegadas geradas:', {t: sorted(v) for t, v in dados.items()})
