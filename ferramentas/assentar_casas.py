"""Assenta casas no solo: terreiro de terra batida sob cada casa e contato com o chão.

Uso como módulo (testes de variação) ou script:
  python3 assentar_casas.py <solo_hd.png> <pasta_sprites> <casas.json> <saida_solo.webp> <pasta_sprites_saida> [escala]
`escala`: quanto o solo é maior que o de 4608 px em que casas.json foi medido (ex.: 8192/4608 para o
mapa de 36 partes). Posições, larguras e recortes de textura são multiplicados por ela.
Grava o solo com os terreiros e a oclusão de contato já "pintados" no chão, e cópias dos
sprites com a base levemente escurecida (oclusão na própria parede).
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ENTERRA = 0.035          # fração da largura que a base afunda no chão (igual a drawHouse no jogo)


def textura_terra(solo, k=1.0):
    """Recorte da praça da Vila (terra batida pura) para ladrilhar os terreiros."""
    return solo[round(1300 * k):round(1460 * k), round(420 * k):round(640 * k)]


def ladrilhar(tex, h, w):
    th, tw = tex.shape[:2]
    reps = (h // th + 2, w // tw + 2, 1)
    t = np.tile(np.concatenate([tex, tex[:, ::-1]], 1), (reps[0], reps[1] // 2 + 1, 1))
    return t[:h, :w]


def mancha(h, w, cx, cy, rx, ry, semente):
    """Elipse com borda irregular (ruído de baixa frequência) e borda suavizada."""
    rng = np.random.default_rng(semente)
    yy, xx = np.mgrid[0:h, 0:w]
    ang = np.arctan2((yy - cy) / ry, (xx - cx) / rx)
    raio = np.hypot((xx - cx) / rx, (yy - cy) / ry)
    ruido = sum(rng.uniform(0.04, 0.09) * np.sin(k * ang + rng.uniform(0, 6.28)) for k in (3, 5, 8, 13))
    m = (raio < 1 + ruido).astype(float)
    return ndimage.gaussian_filter(m, 3)


def base_do_sprite(sprite_rgba, w):
    """Linha de base (último pixel opaco de cada coluna) do sprite já na largura w."""
    h = round(w * sprite_rgba.height / sprite_rgba.width)
    a = np.array(sprite_rgba.resize((w, h), Image.LANCZOS))[..., 3] > 40
    fundo = np.full(w, -1)
    for x in range(w):
        ys = np.nonzero(a[:, x])[0]
        if len(ys): fundo[x] = ys[-1]
    return h, fundo, a


def ocluir_sprite(sprite_rgba, forca=0.28, faixa=0.12):
    """Escurece a parede perto da base: luz bloqueada pelo chão (oclusão de contato)."""
    a = np.array(sprite_rgba).astype(float)
    al = a[..., 3] > 40
    h, w = al.shape
    fundo = np.full(w, -1)
    for x in range(w):
        ys = np.nonzero(al[:, x])[0]
        if len(ys): fundo[x] = ys[-1]
    yy = np.arange(h)[:, None]
    d = (fundo[None, :] - yy) / max(1, h * faixa)          # 0 na base, 1 a `faixa` acima
    fator = 1 - forca * np.clip(1 - d, 0, 1) * (fundo[None, :] >= 0)
    a[..., :3] *= fator[..., None]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def escalar(c, k):
    """Casa medida no solo de 4608 px levada para um solo k vezes maior."""
    c = dict(c)
    for chave in ('x', 'y', 'w', 'h'):
        if chave in c: c[chave] = round(c[chave] * k)
    if 'caminho' in c: c['caminho'] = [round(v * k) for v in c['caminho']]
    if 'textura' in c: c['textura'] = [round(v * k) for v in c['textura']]
    return c


def assentar(solo, casas, sprites, contato=True, sombra=False, k=1.0):
    """Devolve o solo (np RGB float) com terreiros e, opcionalmente, contato e sombra projetada."""
    out = solo.astype(float).copy()
    tex_padrao = textura_terra(solo, k).astype(float)
    casas = [escalar(c, k) for c in casas]
    for i, c in enumerate(casas):
        # Cada casa pode trazer a própria textura de chão (ex.: terra vermelha do Campo de Batalha).
        tex = solo[slice(*c['textura'][:2]), slice(*c['textura'][2:])].astype(float) if 'textura' in c else tex_padrao
        tam = c.get('terreiro', 1.0)
        x, y, w = c['x'], c['y'], c['w']
        rx, ry = w * 0.82 * tam, w * 0.36 * tam
        x0, y0 = int(x - rx * 1.4), int(y - ry * 1.9)
        x1, y1 = int(x + rx * 1.4), int(y + ry * 1.4)
        if 'caminho' in c:
            px, py = c['caminho']
            x0, y0, x1, y1 = min(x0, px - 40), min(y0, py - 40), max(x1, px + 40), max(y1, py + 40)
        H, W = y1 - y0, x1 - x0
        m = mancha(H, W, x - x0, y - ry * 0.35 - y0, rx, ry, semente=i + 7)
        # Caminho de terra da porta até a praça (se houver um destino informado).
        if 'caminho' in c:
            px, py = c['caminho']; yy, xx = np.mgrid[0:H, 0:W]
            ax, ay, bx, by = x - x0, y + 10 - y0, px - x0, py - y0
            t = np.clip(((xx - ax) * (bx - ax) + (yy - ay) * (by - ay)) / max(1, (bx - ax) ** 2 + (by - ay) ** 2), 0, 1)
            d = np.hypot(xx - ax - t * (bx - ax), yy - ay - t * (by - ay))
            m = np.maximum(m, ndimage.gaussian_filter((d < w * 0.16).astype(float), 3))
        terra = ladrilhar(tex, H, W)
        # Borda gasta: levemente mais escura que o miolo do terreiro.
        borda = np.clip((m - 0.15) / 0.35, 0, 1) * np.clip((0.95 - m) / 0.35, 0, 1)
        terra = terra * (1 - 0.10 * borda[..., None])
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - m[..., None]) + terra * m[..., None]
        h, fundo, alpha = base_do_sprite(sprites[c.get('chave', c['sprite'])], w)
        topo = y - h + round(w * ENTERRA)
        if sombra:
            # Silhueta deitada para baixo e à direita, presa na base.
            sil = Image.fromarray((alpha * 255).astype(np.uint8)).resize((w, max(1, round(h * 0.28))), Image.LANCZOS)
            s = np.array(sil).astype(float) / 255 * 0.22
            s = s[::-1]  # topo da casa vira a ponta da sombra, mais longe da base
            sx, sy = x - w // 2 + round(w * 0.10), y - round(w * 0.02)
            hh = min(s.shape[0], out.shape[0] - sy)
            out[sy:sy + hh, sx:sx + w] *= (1 - s[:hh])[..., None]
        if contato:
            # Oclusão rente ao pé da parede: some em ~6 px, segue o contorno da base.
            for dx in range(w):
                if fundo[dx] < 0: continue
                gx, gy = x - w // 2 + dx, topo + fundo[dx]
                for k in range(-3, 7):
                    yy = gy + k
                    if 0 <= yy < out.shape[0] and 0 <= gx < out.shape[1]:
                        out[yy, gx] *= 1 - 0.45 * max(0, 1 - max(0, k) / 6)
    return out.clip(0, 255)


if __name__ == '__main__':
    solo_p, pasta, casas_p, saida, pasta_saida = sys.argv[1:6]
    solo = np.array(Image.open(solo_p).convert('RGB'))
    casas = json.load(open(casas_p))
    # Sprites por chave: casa_N.png (Vila) e ruina_N.png (Campo de Batalha), se existirem na pasta.
    sprites = {}
    for arq in Path(pasta).glob('*.png'):
        nome = arq.stem
        sprites[int(nome.split('_')[1]) if nome.startswith('casa_') else nome] = Image.open(arq).convert('RGBA')
    k = float(eval(sys.argv[6], {})) if len(sys.argv) > 6 else 1.0   # aceita "8192/4608"
    out = assentar(solo, casas, sprites, contato=True, sombra=False, k=k)
    Image.fromarray(out.astype(np.uint8)).save(saida, 'WEBP', quality=90, method=6)
    Path(pasta_saida).mkdir(parents=True, exist_ok=True)
    for chave, s in sprites.items():
        nome = f'casa_{chave}' if isinstance(chave, int) else chave
        ocluir_sprite(s).save(Path(pasta_saida) / f'{nome}.png', optimize=True)
    print('solo e sprites assentados')
