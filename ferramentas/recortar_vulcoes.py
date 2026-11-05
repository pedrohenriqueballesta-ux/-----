"""Recorta os vulcões do solo do Planeta Vegeta pelo contorno marcado à mão (para redesenhar por cima, com profundidade).

Uso: python3 recortar_vulcoes.py <solo-8192.png> <vulcoes.json> <pasta_saida>
vulcoes.json: [{"id", "base": {x, y, rx, ry} (elipse que bloqueia, px de 4608), "contorno": [[x, y], ...] (px de 4608)}].
Grava <id>.png (RGBA, só o cone, borda suavizada 1 px) e vulcoes-recortados.json com a posição de cada recorte no solo
de 8192 e a base (a profundidade é a frente da base: quem está atrás dela fica coberto).
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
Image.MAX_IMAGE_PIXELS = None
solo = Image.open(sys.argv[1]).convert('RGBA'); K = solo.width / 4608
saida = Path(sys.argv[3]); saida.mkdir(parents=True, exist_ok=True); lista = []
for v in json.load(open(sys.argv[2])):
    pts = [(x * K, y * K) for x, y in v['contorno']]
    x0, y0 = int(min(p[0] for p in pts)) - 2, int(min(p[1] for p in pts)) - 2
    x1, y1 = int(max(p[0] for p in pts)) + 3, int(max(p[1] for p in pts)) + 3
    m = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(m).polygon([(x - x0, y - y0) for x, y in pts], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.8))
    c = solo.crop((x0, y0, x1, y1)); c.putalpha(m); c.save(saida / f"{v['id']}.png")
    b = v['base']
    # Frente: a borda de baixo do contorno, de 8 em 8 px (px de 4608), para a profundidade ponto a ponto.
    import numpy as np
    xs = [p[0] for p in v['contorno']]; frente = []
    poly = Image.new('L', (4608, 3072), 0); ImageDraw.Draw(poly).polygon([tuple(p) for p in v['contorno']], fill=255); pa = np.array(poly) > 0
    for x in range(int(min(xs)), int(max(xs)) + 1, 8):
        ys = np.nonzero(pa[:, x])[0]; frente.append(int(ys.max()) if len(ys) else None)
    lista.append({'id': v['id'], 'tipo': 'vulcao', 'x': b['x'], 'y': max(f for f in frente if f), 'img': [x0, y0, x1 - x0, y1 - y0],
                  'frente': {'x0': int(min(xs)), 'passo': 8, 'y': frente}})
json.dump({'escala': K, 'objetos': lista}, open(saida / 'vulcoes-recortados.json', 'w'), indent=1)
print(len(lista), 'vulcões')
