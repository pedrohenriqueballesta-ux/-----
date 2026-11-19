"""Gera o chão texturizado da Terra (Cidade do Oeste, cidade do rio — planta D2 aprovada em 16/11/2026).

Uso: python3 gerar_chao_terra.py <pasta-texturas> <saida.png> [<saida-guia.png>]
Texturas (recortes da arte já aprovada): tex_cobble, tex_meiofio, tex_grama, tex_lote, tex_floresta.
Coordenadas em unidades do mundo (8400x5600), as da planta D2; a imagem sai em 8192 de largura para que
ferramentas/partes_mapa.py corte 6x6 moldes de ~1536x1024 sem ampliar (mesma densidade do teste aprovado).
Só o CHÃO: prédios, casas, árvores, rochas, naves e carros entram depois como objetos separados (profundidade e
colisão). Cada camada é uma máscara; no fim o script confere que nada ficou por cima do que não deve (rua no
rio fora das pontes, rua no lago, no parque, no campus ou em quarteirão; píer longe da água) e falha se ficou.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

TEX = Path(sys.argv[1]); SAIDA = Path(sys.argv[2]); GUIA = Path(sys.argv[3]) if len(sys.argv) > 3 else None
MW, MH = 8400, 5600
OW = 8192; K = OW / MW; OH = round(MH * K)
px = lambda v: round(v * K)
cx_ = lambda c: [px(v) for v in c]

# ---- Planta D2 (unidades do mundo) ----
CIDADE = (300, 300, 8100, 5300)
RIO = [(300, 3300), (1500, 3000), (2700, 3500), (3800, 3300), (4800, 3700), (6000, 3500), (7200, 3900), (8100, 3700),
       (8100, 4200), (7200, 4400), (6000, 4000), (4800, 4200), (3800, 3800), (2700, 4000), (1500, 3500), (300, 3800)]
# As avenidas de cima param no parque (sem toco morto até a floresta); a de baixo atravessa a cidade.
RUAS_H = [(1100, 300, 6400, 260), (2200, 300, 6400, 260), (4800, 300, 8100, 220)]      # (y, x0, x1, largura)
RUAS_V = [(2600, 300, 3150, 240), (3800, 300, 3150, 240), (5000, 300, 3150, 240), (6200, 300, 3150, 240),
          (1500, 2200, 4800, 220), (3800, 3150, 4800, 220), (6200, 3150, 4800, 220)]    # as 3 últimas cruzam o rio (pontes)
QUARTEIROES = [(x0, y0, x1, y1) for x0, x1 in ((2750, 3650), (3950, 4850), (5150, 6050))
               for y0, y1 in ((400, 950), (1250, 2050), (2350, 2950))]
CHEGADA = (4240, 2040, 4560, 2360)
CAMPUS = (1400, 1650, 420)                     # Corporação Cápsula, entre as avenidas de 1100 e 2200
PARQUE = (6400, 400, 8000, 2950)
LAGO = (6900, 1000, 7600, 2300)
BOSQUES = [(700, 4960, 2300, 5280), (6600, 4960, 7900, 5280)]
PIER = (4070, 3800, 4250, 4060)                # sai da margem sul (≈3940 em x=4150) para dentro do rio
CALCADA = 26                                   # largura da calçada clara em volta de rua, lote, rio etc.


class Camada:
    def __init__(self): self.m = Image.new('L', (OW, OH), 0); self.d = ImageDraw.Draw(self.m)
    def rect(self, c, e=0, raio=0): x0, y0, x1, y1 = cx_(c); self.d.rounded_rectangle((x0 - e, y0 - e, x1 + e, y1 + e), radius=raio + e if raio else 0, fill=255); return self
    def elipse(self, c, e=0): x0, y0, x1, y1 = cx_(c); self.d.ellipse((x0 - e, y0 - e, x1 + e, y1 + e), fill=255); return self
    def poligono(self, pts, e=0):
        self.d.polygon([(px(a), px(b)) for a, b in pts], fill=255)
        if e: self.d.line([(px(a), px(b)) for a, b in pts + pts[:1]], fill=255, width=2 * e, joint='curve')
        return self
    def menos(self, outra): self.m.paste(0, (0, 0), outra.m); return self
    @property
    def a(self): return np.asarray(self.m) > 0


_CACHE = {}
def ladrilho(nome):
    if nome in _CACHE: return _CACHE[nome]
    t = Image.open(TEX / f'tex_{nome}.png').convert('RGB'); out = Image.new('RGB', (OW, OH))
    for j, y in enumerate(range(0, OH, t.height)):          # fileiras desencontradas: menos repetição
        off = (j * t.width // 3) % t.width
        for x in range(-off, OW, t.width): out.paste(t, (x, y))
    _CACHE[nome] = out; return out


img = ladrilho('floresta').copy()
pintar = lambda nome, camada: img.paste(ladrilho(nome), (0, 0), camada.m)
B = px(CALCADA)

cidade = Camada().rect(CIDADE, raio=px(160))
pintar('grama', cidade)
fora = Camada().rect((0, 0, MW, MH)).menos(cidade)

# Áreas que a rua NÃO pode cortar (a rua termina na calçada delas).
parque = Camada().rect(PARQUE, raio=px(60))
campus = Camada().elipse((CAMPUS[0] - CAMPUS[2], CAMPUS[1] - CAMPUS[2], CAMPUS[0] + CAMPUS[2], CAMPUS[1] + CAMPUS[2]))
rio = Camada().poligono(RIO)
pontes = Camada()
for x, ya, yb, l in RUAS_V[4:]: pontes.rect((x - l // 2, ya, x + l // 2, yb))

ruas = Camada()
for y, xa, xb, l in RUAS_H: ruas.rect((xa, y - l // 2, xb, y + l // 2))
for x, ya, yb, l in RUAS_V: ruas.rect((x - l // 2, ya, x + l // 2, yb))
ruas.menos(fora).menos(parque)
campus_borda = Camada().elipse((CAMPUS[0] - CAMPUS[2], CAMPUS[1] - CAMPUS[2], CAMPUS[0] + CAMPUS[2], CAMPUS[1] + CAMPUS[2]), e=B)
ruas.menos(campus_borda)
calcada_ruas = Camada()
for y, xa, xb, l in RUAS_H: calcada_ruas.rect((xa, y - l // 2, xb, y + l // 2), e=B)
for x, ya, yb, l in RUAS_V: calcada_ruas.rect((x - l // 2, ya, x + l // 2, yb), e=B)
calcada_ruas.menos(fora).menos(parque).menos(campus_borda)

# 1) calçadas e meio-fios, 2) pisos, 3) ruas, 4) rio e lago, 5) pontes e píer por cima da água
pintar('meiofio', calcada_ruas)
for q in QUARTEIROES: pintar('meiofio', Camada().rect(q, e=B, raio=px(40)))
pintar('meiofio', campus_borda)
pintar('meiofio', Camada().rect(PARQUE, e=B, raio=px(60)))
for b in BOSQUES: pintar('meiofio', Camada().rect(b, e=B // 2, raio=px(40)))
for q in QUARTEIROES: pintar('lote', Camada().rect(q, raio=px(40)))
pintar('lote', campus)
pintar('grama', parque)
for b in BOSQUES: pintar('grama', Camada().rect(b, raio=px(40)))
pintar('cobble', ruas)
pintar('meiofio', Camada().rect(CHEGADA, e=B // 2, raio=px(30))); pintar('lote', Camada().rect(CHEGADA, raio=px(30)))

lago = Camada().elipse(LAGO)
agua = rio.m.copy(); agua.paste(255, (0, 0), lago.m)
margem = Camada().poligono(RIO, e=B); margem.d.ellipse([v + d for v, d in zip(cx_(LAGO), (-B, -B, B, B))], fill=255)
margem.menos(fora).menos(ruas)          # a beira do rio não passa por cima da rua/ponte
pintar('meiofio', margem)
# água: azul com ondas e beira mais clara (distância à margem feita em 1/4 da resolução)
yy = np.arange(OH)[:, None]; xx = np.arange(OW)[None, :]
onda = ((np.sin(xx / 23.0 + yy / 9.0) + np.sin(xx / 51.0 - yy / 17.0)) * 10)
peq = np.asarray(agua.resize((OW // 4, OH // 4))) > 0
dist = ndimage.distance_transform_edt(peq)
longe = np.asarray(Image.fromarray((dist > 6).astype(np.uint8) * 255).resize((OW, OH))) > 0
base = np.array([54, 132, 196])
AG = (base[None, None, :] + onda[..., None] + np.where(longe, -18, 22)[..., None]).clip(0, 255).astype(np.uint8)
agua_m = Camada(); agua_m.m = agua; agua_m.m.paste(0, (0, 0), fora.m)
img.paste(Image.fromarray(AG), (0, 0), agua_m.m)
pontes_ruas = Camada(); pontes_ruas.m = pontes.m.copy(); pontes_ruas.menos(fora)
borda_ponte = Camada()
for x, ya, yb, l in RUAS_V[4:]: borda_ponte.rect((x - l // 2, ya, x + l // 2, yb), e=B)
borda_ponte.m.paste(0, (0, 0), Image.eval(rio.m, lambda v: 255 - v))     # guarda-corpo claro só sobre a água
pintar('meiofio', borda_ponte)
img.paste(ladrilho('cobble'), (0, 0), Image.fromarray((pontes_ruas.a & rio.a).astype(np.uint8) * 255))
pier = Camada().rect(PIER); pintar('meiofio', pier)
img.save(SAIDA)

# ---- Conferência (falha se algo ficou por cima do que não deve) ----
R = np.asarray(ruas.m) > 0
Q = Camada()
for q in QUARTEIROES: Q.rect(q, raio=px(40))
erros = {
    'rua dentro de quarteirão': int((R & Q.a).sum()),
    'rua dentro do rio fora das pontes': int((R & rio.a & ~pontes.a).sum()),
    'rua dentro do lago': int((R & lago.a).sum()),
    'rua dentro do parque': int((R & parque.a).sum()),
    'rua dentro do campus da Corp. Cápsula': int((R & campus.a).sum()),
    'píer sem tocar a água': 0 if (pier.a & rio.a).any() else 1,
    'píer sem tocar a margem (terra)': 0 if (pier.a & ~rio.a & cidade.a).any() else 1,
    'chegada fora da rua': 0 if (Camada().rect(CHEGADA).a & R).any() else 1,
    'beira do rio por cima da rua': int((margem.a & R).sum()),
}
for k, v in erros.items(): print(f'{k}: {v}')
assert not any(erros.values()), 'conferência falhou'

if GUIA:
    g = img.resize((1680, round(1680 * OH / OW)), Image.LANCZOS); d = ImageDraw.Draw(g); s = 1680 / MW
    f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 14)
    for i, q in enumerate(QUARTEIROES, 1): d.rectangle([v * s for v in q], outline=(255, 0, 0), width=2); d.text((q[0] * s + 4, q[1] * s + 3), f'Q{i}', fill=(255, 0, 0), font=f)
    c, cy, r = CAMPUS; d.ellipse([(c - r) * s, (cy - r) * s, (c + r) * s, (cy + r) * s], outline=(255, 0, 0), width=2)
    d.text(((c - r) * s, (cy - r) * s - 16), 'CORP. CÁPSULA', fill=(255, 0, 0), font=f)
    d.rectangle([v * s for v in CHEGADA], outline=(255, 230, 0), width=2); d.rectangle([v * s for v in PIER], outline=(255, 230, 0), width=2)
    g.save(GUIA)
print(SAIDA, img.size)
