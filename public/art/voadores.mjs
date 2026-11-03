// Mobs voadores da hunt fácil: Pássaro e Inseto de Namek (decisão do Pedro, 03/11/2026).
// Folha PROVISÓRIA: 8 direções × 3 estados (parado, voando, atacando), um quadro cada, recortada por
// ~/idle-dbz/ferramentas/recortar_folha_8dir.py. Nesta folha o norte ainda aparece de frente; a folha
// definitiva (5 direções × 4 quadros de voo + 4 de ataque) foi pedida ao ChatGPT.
import { art, loaded } from './assets.mjs';
import { spriteFacing } from '../render/camera.mjs';

// Célula do atlas (px), na ordem de colunas do jogo (S, SW, W, NW, N, NE, E, SE); `figura` é a altura
// típica do bicho dentro da célula (mediana da linha de voo) e `proporcao`, o tamanho na tela em relação
// ao Goku (70): Pássaro 15% maior e Inseto 5% maior (pedido do Pedro, 03/11).
export const ALTURA_GOKU = 70;
export const VOADORES = {
  passaro: { cw: 109, ch: 104, figura: 92, proporcao: 1.15 },
  inseto: { cw: 116, ch: 111, figura: 91, proporcao: 1.05 }
};
// Quanto o voador fica acima do chão (a sombra fica no chão, no ponto do mob).
export const ALTURA_DE_VOO = 16;

// Um desenho fixo por direção (linha "voando"; no golpe, "atacando"). Alternar com o "parado" fazia o
// bicho parecer girar de um lado para o outro, porque os dois desenhos da folha estão em ângulos
// diferentes. Até a folha com 4 quadros de asa chegar, o voo é um pulsar leve (encolhe e estica na
// vertical, 3 vezes por segundo) mais a flutuação.
export function drawVoador(ctx, tipo, x, y, time, facing, phase, attackProgress = null) {
  const v = VOADORES[tipo], img = art[tipo];
  if (!v || !loaded(img)) return false;
  const coluna = spriteFacing(facing), linha = attackProgress !== null ? 2 : 1;
  const escala = ALTURA_GOKU * v.proporcao / v.figura, w = v.cw * escala, h = v.ch * escala;
  const batida = Math.sin((time * 3 + phase) * Math.PI * 2);
  const sy = attackProgress !== null ? 1 : 1 - 0.07 * (0.5 + 0.5 * batida), sx = 1 + 0.03 * (0.5 + 0.5 * batida);
  const sobe = ALTURA_DE_VOO + Math.sin(time * 3 + phase * Math.PI * 2) * 3;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.translate(x, y - sobe + 4); ctx.scale(sx, sy);
  ctx.drawImage(img, coluna * v.cw, linha * v.ch, v.cw, v.ch, -w / 2, -h, w, h);
  ctx.restore();
  return true;
}
