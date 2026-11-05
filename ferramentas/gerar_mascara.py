"""Gera a máscara de passagem de um planeta a partir da imagem do solo.

Uso: python3 gerar_mascara.py <solo.png> <passagem.png> [conferencia.png]
passagem.png: branco = anda, preto = bloqueia, no tamanho da imagem do solo.
Pode ser corrigida à mão (pintar de branco/preto) e depois convertida com
converter_mascara.py. Se passagem.png já existir, NÃO é sobrescrita: apague
de propósito para gerar de novo do zero.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

solo, saida = Path(sys.argv[1]), Path(sys.argv[2])
conf = Path(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else None
if saida.exists():
    sys.exit(f"{saida} já existe (pode ter correções à mão). Apague para gerar de novo.")

rgb = np.array(Image.open(solo).convert("RGB")).astype(int)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

# Água (mar e lagos): turquesa escuro, quase sem vermelho. A grama turquesa tem R >= ~30.
agua = (r < 24) & (b > 80)
agua = ndimage.binary_opening(agua, iterations=1)
# Só blocos de água de tamanho razoável (evita pontos escuros soltos na grama).
rot, n = ndimage.label(agua)
tam = np.bincount(rot.ravel())
agua = np.isin(rot, np.nonzero(tam >= 60)[0][1:])

# Paredões: tons marrons/escuros em faixas finas. O chão de cratera também é marrom, mas em
# áreas largas: o que sobrevive a uma abertura grande é chão; o que some é parede/borda.
marrom = (r > g - 10) & (r > b + 15) & (r < 215) & ~((r > 180) & (g > 150))
escuro = (r + g + b < 230) & ~agua
parede = marrom | escuro
largo = ndimage.binary_opening(parede, iterations=6)
paredao = parede & ~ndimage.binary_dilation(largo, iterations=2)
paredao = ndimage.binary_opening(paredao, iterations=1)
rot, n = ndimage.label(paredao)
tam = np.bincount(rot.ravel())
paredao = np.isin(rot, np.nonzero(tam >= 40)[0][1:])

# Neste desenho os paredões ficam na borda das ilhas e planaltos (o desnível até a praia/mar).
# Marrom longe da água é chão de terra/cratera (ex.: anel do planalto da nave), não parede.
perto_agua = ndimage.binary_dilation(agua, iterations=45)
paredao &= perto_agua

# Paredões automáticos saíram com buracos e com falsos positivos no meio do chão
# (barreiras invisíveis). Ficam só na conferência; o bloqueio de paredão é marcado à mão.
COM_PAREDAO = "--paredao" in sys.argv
bloqueia = agua | paredao if COM_PAREDAO else agua
anda = ~bloqueia
# Pequenos buracos de passagem no meio do mar (ilhotas de 1–2 px) viram mar; pequenos
# bloqueios isolados no meio da terra viram chão.
anda = ndimage.binary_opening(anda, iterations=1)
anda = ndimage.binary_closing(anda, iterations=1)

Image.fromarray((anda * 255).astype(np.uint8)).save(saida)
if conf:
    vis = rgb.copy().astype(float)
    vis[agua] = vis[agua] * 0.35 + np.array([0, 40, 200]) * 0.65
    vis[paredao] = vis[paredao] * 0.3 + np.array([230, 30, 30]) * 0.7
    Image.fromarray(vis.astype(np.uint8)).save(conf)
print(f"anda {anda.mean()*100:.1f}%  água {agua.mean()*100:.1f}%  paredão {paredao.mean()*100:.1f}%")
