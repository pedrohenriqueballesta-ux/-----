"""Corta o solo grande em blocos quadrados e gera uma versão pequena para minimapa e menu Mapa.

Uso: python3 cortar_blocos.py <solo.webp|png> <pasta_saida> [lado=1024] [largura_mini=2048]
Grava b_C_L.webp (C = coluna, L = linha, a partir de 0), mini.webp e blocos.json
({w, h, lado, colunas, linhas}). O jogo carrega só os blocos perto do jogador; enquanto um bloco
não chega, desenha o trecho da mini (borrado) no lugar, para não ficar buraco.
"""
import json, sys
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
solo = Image.open(sys.argv[1]).convert('RGB'); saida = Path(sys.argv[2]); saida.mkdir(parents=True, exist_ok=True)
LADO = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
MINI = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
W, H = solo.size
cols, rows = -(-W // LADO), -(-H // LADO)
total = 0
for l in range(rows):
    for c in range(cols):
        caixa = (c * LADO, l * LADO, min(W, (c + 1) * LADO), min(H, (l + 1) * LADO))
        f = saida / f'b_{c}_{l}.webp'; solo.crop(caixa).save(f, 'WEBP', quality=90, method=6); total += f.stat().st_size
mini = saida / 'mini.webp'; solo.resize((MINI, round(H * MINI / W)), Image.LANCZOS).save(mini, 'WEBP', quality=88, method=6)
(saida / 'blocos.json').write_text(json.dumps({'w': W, 'h': H, 'lado': LADO, 'colunas': cols, 'linhas': rows}))
print(f'{cols}x{rows} blocos de {LADO}px, {total/1e6:.1f} MB no total; mini {mini.stat().st_size/1e6:.2f} MB')
