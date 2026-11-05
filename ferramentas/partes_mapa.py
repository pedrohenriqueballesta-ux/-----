"""Recorta o solo em NxN partes com sobra (3:2) e amplia cada uma para 1536x1024 (o molde).

Uso: python3 partes_mapa.py <solo.png> <pasta_saida> [N=3]
Cada parte cobre uma célula (largura/N x altura/N) mais uma sobra de 1/16 da célula de cada lado.
Grava parte_L_C.png (L = linha, C = coluna, a partir de 1), indice.png e partes.json
(retângulo de cada parte na imagem original e, em "_meta", o tamanho da original e a sobra).
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

solo, pasta = Image.open(sys.argv[1]).convert('RGB'), Path(sys.argv[2])
N = int(sys.argv[3]) if len(sys.argv) > 3 else 3
pasta.mkdir(parents=True, exist_ok=True)
W, H = solo.size
cw, ch = W / N, H / N
SOBRA = round(cw / 16)     # com 1536/3: célula 512 + 32 de cada lado = 576x384, como nas 9 partes
PW, PH = round(cw + 2 * SOBRA), round((cw + 2 * SOBRA) * 2 / 3)
partes = {'_meta': {'w': W, 'h': H, 'sobra': SOBRA, 'n': N}}
indice = solo.copy(); d = ImageDraw.Draw(indice)
fonte = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 48)
for l in range(N):
    for c in range(N):
        cx, cy = (c + 0.5) * cw, (l + 0.5) * ch
        x0 = int(round(min(max(cx - PW / 2, 0), W - PW))); y0 = int(round(min(max(cy - PH / 2, 0), H - PH)))
        nome = f'parte_{l+1}_{c+1}'
        # Ampliação inteira (3x) fica nítida com NEAREST; fracionária borra menos com LANCZOS.
        modo = Image.NEAREST if 1536 % PW == 0 else Image.LANCZOS
        solo.crop((x0, y0, x0 + PW, y0 + PH)).resize((1536, 1024), modo).save(pasta / f'{nome}.png')
        partes[nome] = [x0, y0, PW, PH]
        d.rectangle([c * cw, l * ch, (c + 1) * cw, (l + 1) * ch], outline=(255, 255, 255), width=3)
        d.text((c * cw + 14, l * ch + 8), f'{l+1}-{c+1}', fill=(255, 255, 255), font=fonte, stroke_width=4, stroke_fill=(0, 0, 0))
indice.save(pasta / 'indice.png')
(pasta / 'partes.json').write_text(json.dumps(partes, indent=1))
print(len(partes) - 1, 'partes de', PW, 'x', PH, 'em', pasta)
