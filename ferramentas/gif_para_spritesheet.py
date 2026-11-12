"""Transforma o GIF animado de um efeito de habilidade (gerado no ChatGPT) na spritesheet + animation.json do jogo,
no mesmo formato do Kamehameha (public/assets/skills/kamehameha/nivel-N/).

Uso: python3 ferramentas/gif_para_spritesheet.py <efeito.gif> <pasta_saida> <nome-da-skill> [colunas=4]
Grava spritesheet.png (quadros em grade, fundo transparente) e animation.json (tamanho e duração dos quadros).
Se o GIF vier com fundo preto em vez de transparente, o preto vira transparência (a energia continua brilhando).
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageSequence

gif, saida, nome = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
im = Image.open(gif)
quadros = [f.convert('RGBA') for f in ImageSequence.Iterator(im)]
duracoes = [f.info.get('duration', 80) or 80 for f in ImageSequence.Iterator(Image.open(gif))]
W, H = quadros[0].size
if all(np.array(f)[..., 3].min() == 255 for f in quadros):   # sem transparência: preto vira transparente
    novos = []
    for f in quadros:
        a = np.array(f).astype(float); lum = a[..., :3].max(2)
        a[..., 3] = np.clip(lum * 1.4, 0, 255); novos.append(Image.fromarray(a.astype(np.uint8)))
    quadros = novos
linhas = (len(quadros) + cols - 1) // cols
folha = Image.new('RGBA', (W * cols, H * linhas), (0, 0, 0, 0))
for i, f in enumerate(quadros): folha.paste(f, ((i % cols) * W, (i // cols) * H))
saida.mkdir(parents=True, exist_ok=True)
folha.save(saida / 'spritesheet.png')
json.dump({'skill': nome, 'direction': 'right', 'frame_count': len(quadros), 'frame_width': W, 'frame_height': H,
           'frame_duration_ms': round(sum(duracoes) / len(duracoes)), 'spritesheet_columns': cols, 'spritesheet_rows': linhas},
          open(saida / 'animation.json', 'w'), indent=2)
print(f'{nome}: {len(quadros)} quadros de {W}x{H}, {round(sum(duracoes)/len(duracoes))} ms cada -> {saida}/spritesheet.png')
