// Mobs voadores da hunt fácil: Pássaro e Inseto de Namek (decisão do Pedro, 03/11/2026).
// Folha PROVISÓRIA: 8 direções × 3 estados (parado, voando, atacando), um quadro cada, recortada por
// ~/idle-dbz/ferramentas/recortar_folha_8dir.py. As asas batem alternando parado e voando; no golpe,
// o quadro de ataque. Nesta folha o norte ainda aparece de frente; a folha definitiva (5 direções ×
// 4 quadros, como os outros mobs) foi pedida ao ChatGPT.
import { art, loaded } from './assets.mjs';
import { spriteFacing } from '../render/camera.mjs';

// Célula do atlas (px), na ordem de colunas do jogo (S, SW, W, NW, N, NE, E, SE), e altura na tela.
export const VOADORES = {
  passaro: { cw: 109, ch: 104, altura: 58 },
  inseto: { cw: 116, ch: 111, altura: 56 }
};
// Quanto o voador fica acima do chão (a sombra fica no chão, no ponto do mob).
export const ALTURA_DE_VOO = 16;

export function drawVoador(ctx, tipo, x, y, time, facing, phase, attackProgress = null) {
  const v = VOADORES[tipo], img = art[tipo];
  if (!v || !loaded(img)) return false;
  const coluna = spriteFacing(facing);
  const linha = attackProgress !== null ? 2 : Math.floor(time * 6 + phase * 2) % 2;   // 3 batidas de asa por segundo
  const escala = v.altura / v.ch, w = v.cw * escala, h = v.ch * escala;
  const sobe = ALTURA_DE_VOO + Math.sin(time * 3 + phase * Math.PI * 2) * 3;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, coluna * v.cw, linha * v.ch, v.cw, v.ch, Math.round(x - w / 2), Math.round(y - h - sobe + 4), Math.round(w), Math.round(h));
  ctx.restore();
  return true;
}
