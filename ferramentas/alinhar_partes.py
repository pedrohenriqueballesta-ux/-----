"""Entorta cada parte redesenhada para que os contornos (meio-fio, margens, pisos claros) caiam onde o molde manda.

Uso: python3 alinhar_partes.py <pasta-moldes> <pasta-partes-hd> <pasta-saida>
A IA redesenha cada pedaço separado e às vezes desloca um meio-fio ou uma margem 10-40 px; na emenda com o vizinho
isso vira um "degrau" (relato do Pedro, 17/11/2026, na Terra). Aqui cada parte é comparada com o SEU molde em janelas:
mede-se o deslocamento dos contornos claros (correlação de fase) e a parte é entortada suavemente para casar com o
molde. Janela só de grama (sem contorno) não mede nada e fica como está. Depois, montar_mapa.py emenda normalmente.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

MOLDES, HD, SAIDA = (Path(a) for a in sys.argv[1:4])
SAIDA.mkdir(parents=True, exist_ok=True)
JAN, PASSO, MAX = 256, 128, 45


def mascara(a):
    """Contornos que importam: meio-fio/cais/pisos claros e água (o resto é grama ou textura)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ((r > 175) & (g > 140) & (b > 95) & (r - b > 25)) | ((b > r + 40) & (b > g))
    return ndimage.binary_opening(m, iterations=2).astype(float)


def deslocamento(a, b):
    """(dy, dx, ganho) que mais sobrepõe a máscara `a` à `b` (b(y, x) ≈ a(y + dy, x + dx)), procurando até ±MAX.
    `ganho` = quanto a sobreposição melhora em relação a não mexer (0 = não vale a pena)."""
    h, w = a.shape; P = np.zeros((h + 2 * MAX, w + 2 * MAX)); P[MAX:MAX + h, MAX:MAX + w] = a
    # sobreposição(dy, dx) = soma b(y, x) · a(y + dy, x + dx), por FFT
    F = np.fft.rfft2(P); G = np.fft.rfft2(b, s=P.shape)
    c = np.fft.irfft2(F * np.conj(G), s=P.shape)[:2 * MAX + 1, :2 * MAX + 1]
    iy, ix = np.unravel_index(c.argmax(), c.shape); parado = c[MAX, MAX]
    return iy - MAX, ix - MAX, (c.max() - parado) / (min(a.sum(), b.sum()) + 1e-9)


for hd in sorted(HD.glob('parte_*.png')):
    img = np.asarray(Image.open(hd).convert('RGB')).astype(float)
    mol = np.asarray(Image.open(MOLDES / hd.name).convert('RGB').resize(img.shape[1::-1], Image.LANCZOS)).astype(float)
    H, W = img.shape[:2]; ci, cm = mascara(img), mascara(mol)
    ys, xs = list(range(0, H - JAN + 1, PASSO)), list(range(0, W - JAN + 1, PASSO))
    FY, FX, OK = np.zeros((len(ys), len(xs))), np.zeros((len(ys), len(xs))), np.zeros((len(ys), len(xs)))
    for i, y in enumerate(ys):
        for j, x in enumerate(xs):
            a, b = ci[y:y + JAN, x:x + JAN], cm[y:y + JAN, x:x + JAN]
            if b.mean() < .02 or b.mean() > .9: continue                   # sem contorno (só grama ou só piso): nada a medir
            dy, dx, ganho = deslocamento(a, b)
            if ganho > .08 and (dy or dx): FY[i, j], FX[i, j], OK[i, j] = dy, dx, 1
            elif ganho <= .08: OK[i, j] = 1                                 # medido e já no lugar: segura o zero
    # Janelas sem medida pegam o valor das vizinhas (média ponderada); depois suaviza.
    peso = ndimage.gaussian_filter(OK, 1.2) + 1e-6
    FY = ndimage.gaussian_filter(FY * OK, 1.2) / peso; FX = ndimage.gaussian_filter(FX * OK, 1.2) / peso
    FY *= np.clip(peso * 3, 0, 1); FX *= np.clip(peso * 3, 0, 1)             # longe de qualquer medida: sem entortar
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    gy = (yy - JAN / 2) / PASSO; gx = (xx - JAN / 2) / PASSO
    DY = ndimage.map_coordinates(FY, [gy, gx], order=1, mode='nearest'); DX = ndimage.map_coordinates(FX, [gy, gx], order=1, mode='nearest')
    out = np.stack([ndimage.map_coordinates(img[..., c], [yy + DY, xx + DX], order=1, mode='nearest') for c in range(3)], 2)
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(SAIDA / hd.name)
    print(f'{hd.stem}: {int(OK.sum())} medidas, maior deslocamento {np.abs(np.dstack([DY, DX])).max():.0f} px')
