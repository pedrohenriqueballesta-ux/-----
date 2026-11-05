"""Iguala o tom da água funda entre as partes de um mapa redesenhadas pela IA.

Uso: python3 igualar_mar.py <pasta_partes> <pasta_saida>
Cada parte gerada separadamente sai com o mar num tom um pouco diferente, e na montagem isso aparece
como faixas no mar. Para cada parte: acha a água funda (turquesa escura, longe da praia e da espuma),
mede a cor média dela e desloca só essa água, com a borda da máscara suavizada, até a mediana das
partes. Terra, praia, água rasa clara e espuma não mudam. Partes com pouca água ficam como estão.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ent, sai = Path(sys.argv[1]), Path(sys.argv[2]); sai.mkdir(parents=True, exist_ok=True)

def agua_funda(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    agua = (r < 60) & (g > 100) & (b > 80) & (g > r + 70) & (g < 175)
    # só blocos grandes e afastados da costa: tira espuma, sombra de árvore e água rasa
    agua = ndimage.binary_opening(agua, iterations=2)
    return ndimage.binary_erosion(agua, iterations=6)

partes = {f.name: np.array(Image.open(f).convert('RGB')).astype(float) for f in sorted(ent.glob('parte_*.png'))}
medias = {}
for nome, a in partes.items():
    m = agua_funda(a)
    if m.mean() > 0.08: medias[nome] = a[m].mean(0)
alvo = np.median(np.array(list(medias.values())), 0)
print('tom-alvo da água funda (RGB):', alvo.round().astype(int), '| partes ajustadas:', len(medias), 'de', len(partes))
for nome, a in partes.items():
    if nome in medias:
        m = agua_funda(a)
        # máscara macia: cobre a água funda e se apaga na direção da costa
        peso = ndimage.gaussian_filter(ndimage.binary_dilation(m, iterations=4).astype(float), 5)[..., None]
        a = a + (alvo - medias[nome]) * peso
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(sai / nome)
for nome, c in medias.items(): print(' ', nome[:-4], 'deslocamento', (alvo - c).round().astype(int))
