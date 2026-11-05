"""Máscara de passagem do Planeta Vegeta (chão em cima dos planaltos; abismo, paredão e lava larga bloqueiam).

Uso: python3 gerar_mascara_vegeta.py <solo-4608.png> <bloqueios.json> <passagem.png> [conferencia.png]
- abismo: quase preto; paredão: o roxo da parte de baixo + uma faixa de FAIXA_SUL px de chão logo acima
  de qualquer abismo/roxo (a parte alaranjada do paredão que se vê nas bordas viradas para o sul);
- lava: NÃO bloqueia por ora (Pedro, 04/11/2026: travava a caça automática); os vulcões sim, à mão;
- bloqueios.json: "bloqueia" = elipses marcadas à mão [{"x","y","rx","ry","nota"}] (mesas, vulcões,
  pé das árvores, cristais); "so_elipse" = no pedaço de chão do centro dela, só a elipse anda (chão da cratera); "libera" =
  elipses que voltam a andar; "caixa_lava" = onde procurar lava. Tudo em px da imagem de 4608.
  As pontes das estradas sobre o abismo ficam bloqueadas: cada hunt é fechada e a viagem é por portal.
- some com ilhas de chão pequenas (sobra de borda) que não ligam a nada.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

FAIXA_SUL = 70
img = Image.open(sys.argv[1]).convert('RGB'); W, H = img.size
a = np.array(img).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = r * 0.3 + g * 0.59 + b * 0.11
# Abismo: muito escuro (luminância ~5; o chão mais escuro, cratera e rocha da lava, fica acima de 40) e
# ligado ao vazio em volta do mapa ou em bolsões grandes.
escuro = ndimage.binary_opening(lum < 16, iterations=3)
rot, n = ndimage.label(escuro); tam = np.bincount(rot.ravel()); tam[0] = 0
borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
abismo = np.isin(rot, [i for i in range(1, n + 1) if i in borda or tam[i] > 150000])
abismo = ndimage.binary_dilation(abismo, iterations=4)
# Paredão roxo: só com abismo logo abaixo (até 260 px), para não pegar rocha escura no meio do chão.
# O roxo do paredão tem mais vermelho que azul; o dos cristais, mais azul (não são paredão).
roxo = ndimage.binary_opening((b > g + 22) & (b > 25) & (lum < 130) & (r >= b), iterations=2)
sobre_abismo = np.zeros_like(abismo)
for d in range(0, 261, 10): sobre_abismo[:H - d] |= abismo[d:]
# Cristais (roxo-azulado vivo) e o contorno deles nunca são paredão: o bloqueio deles é só a base, à mão.
cristal = ndimage.binary_dilation((b > r * 0.7) & (b > g + 30) & (b > 60), iterations=10)
bloq = abismo | (roxo & sobre_abismo & ~cristal)
# Faixa acima do paredão: chão com bloqueio até FAIXA_SUL px abaixo.
abaixo = np.zeros_like(bloq)
for d in range(4, FAIXA_SUL + 1, 4): abaixo[:-d] |= bloq[d:]
lava = (r > 185) & (b < 70) & (r - b > 140)
# Só na região de lava (o chão laranja-claro dos Cânions tem a mesma cor).
cfg = json.load(open(sys.argv[2]))
x0, y0, x1, y1 = cfg['caixa_lava']; fora = np.ones_like(lava); fora[y0:y1, x0:x1] = False; lava &= ~fora
lava_larga = ndimage.binary_opening(lava, iterations=7)
lava_larga = ndimage.binary_dilation(lava_larga, iterations=6) & ndimage.binary_closing(lava, iterations=3)
# Lava não bloqueia por ora (Pedro, 04/11: travava a caça automática); só os vulcões, à mão em bloqueios.json.
anda = ~bloq & ~abaixo
# Passagem mais estreita que ~40 px some: corta as pontes das estradas sobre o abismo (cada região vira
# uma ilha) e as frestas onde a caça automática travava em Namek.
anda = ndimage.binary_opening(anda, iterations=20)
yy, xx = np.mgrid[0:H, 0:W]
for e in cfg.get('bloqueia', []): anda &= ((xx - e['x']) / e['rx']) ** 2 + ((yy - e['y']) / e['ry']) ** 2 > 1
# Dentro da caixa, só anda o que estiver na elipse (ex.: o chão de baixo da cratera, sem a parede e a borda).
# Vale só no pedaço de chão (ilhado pelo abismo) que contém o centro da elipse.
for e in cfg.get('so_elipse', []):
    rot, _ = ndimage.label(anda); pedaco = rot == rot[e['y'], e['x']]
    fora = ((xx - e['x']) / e['rx']) ** 2 + ((yy - e['y']) / e['ry']) ** 2 > 1; anda &= ~(pedaco & fora)
# Vulcões (vulcoes.json): bloqueia o contorno do cone abaixo de `corte` (a encosta); acima dele o chão é "atrás" do
# vulcão (anda, coberto pelo recorte redesenhado por cima).
if cfg.get('vulcoes'):
    from PIL import ImageDraw
    for v in json.load(open(Path(sys.argv[2]).with_name(cfg['vulcoes']))):
        im = Image.new('L', (W, H), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in v['contorno']], fill=255)
        cone = np.array(im) > 0; cone[:v['corte']] = False; anda &= ~cone
for e in cfg.get('libera', []): anda |= (((xx - e['x']) / e['rx']) ** 2 + ((yy - e['y']) / e['ry']) ** 2 <= 1) & ~abismo
rot, n = ndimage.label(anda); tam = np.bincount(rot.ravel()); tam[0] = 0
anda = np.isin(rot, np.nonzero(tam >= 20000)[0])
Image.fromarray((anda * 255).astype(np.uint8)).save(sys.argv[3])
print(f'anda {anda.mean()*100:.1f}% · {len(np.nonzero(tam >= 20000)[0])} pedaços de chão')
if len(sys.argv) > 4:
    c = a.copy(); c[~anda] = (c[~anda] * 0.35 + np.array([255, 0, 60]) * 0.65).astype(int)
    Image.fromarray(c.astype(np.uint8)).resize((W // 3, H // 3), Image.BOX).save(sys.argv[4])
