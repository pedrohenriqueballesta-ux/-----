// Mobs voadores da hunt fácil: Pássaro e Inseto de Namek (decisão do Pedro, 03/11/2026).
// Folha PROVISÓRIA: 8 direções × 3 estados (parado, voando, atacando), um quadro cada, recortada por
// ferramentas/recortar_folha_8dir.py. Nesta folha o norte ainda aparece de frente; a folha
// definitiva (5 direções × 4 quadros de voo + 4 de ataque) foi pedida ao ChatGPT.
import { art, loaded } from './assets.mjs';
import { drawSheet } from './atlas.mjs';
import { spriteFacing, strikeColumn } from '../render/camera.mjs';
import { PASSARO_VOO } from './passaro-voo.mjs';
import { PASSARO_ATAQUE } from './passaro-ataque.mjs';
import { INSETO_VOO } from './inseto-voo.mjs';
import { PORUNGA_VOO } from './porunga-voo.mjs';
import { PORUNGA_ATAQUE } from './porunga-ataque.mjs';
import { PORUNGA_BOSS_VOO } from './porunga-boss-voo.mjs';
import { PORUNGA_BOSS_ATAQUE } from './porunga-boss-ataque.mjs';

// Folhas definitivas (5 direções × 4 quadros, lado esquerdo espelhado): voo com a batida de asa de verdade
// e, quando houver, ataque (o quadro de impacto, coluna 3, cai no instante do dano, como nos outros mobs).
// Sem folha de ataque, no golpe as asas batem mais rápido e o bicho avança. As duas folhas usam a escala
// do voo, para o bicho não mudar de tamanho ao atacar.
const FOLHAS = { passaro: { voo: PASSARO_VOO, ataque: PASSARO_ATAQUE }, inseto: { voo: INSETO_VOO }, porunga: { voo: PORUNGA_VOO, ataque: PORUNGA_ATAQUE },
  boss: { voo: PORUNGA_BOSS_VOO, ataque: PORUNGA_BOSS_ATAQUE } };   // Porunga BOSS (chefe raro)
const BATIDAS_POR_SEGUNDO = 2.5;
function drawFolha(ctx, tipo, folhas, x, y, time, facing, phase, attackProgress) {
  const ataca = attackProgress !== null && folhas.ataque && loaded(art[tipo + 'Ataque']);
  const folha = ataca ? folhas.ataque : folhas.voo, img = art[tipo + (ataca ? 'Ataque' : 'Voo')];
  if (!loaded(img)) return false;
  const ritmo = BATIDAS_POR_SEGUNDO * (attackProgress !== null ? 2 : 1);
  const coluna = ataca ? strikeColumn(attackProgress) : Math.floor((time * ritmo + phase) * folha.columns) % folha.columns;
  const altura = ALTURA_GOKU * VOADORES[tipo].proporcao * folha.referenceHeight / folhas.voo.referenceHeight;
  const avanco = attackProgress !== null && !ataca ? Math.sin(Math.min(1, attackProgress * 2) * Math.PI) * 14 : 0;
  const sobe = ALTURA_DE_VOO + Math.sin(time * 3 + phase * Math.PI * 2) * 3;
  // Compensa o deslocamento de +6 do desenho compartilhado, mantendo a posição antiga (+4).
  const pos = { x: x + (facing?.x || 0) * avanco,
    y: Math.round(y + (facing?.y || 0) * avanco - sobe + 4) - 6 };
  return drawSheet(ctx,folha,img,pos,altura,facing,coluna);
}

// Célula do atlas (px), na ordem de colunas do jogo (S, SW, W, NW, N, NE, E, SE); `figura` é a altura
// típica do bicho dentro da célula (mediana da linha de voo) e `proporcao`, o tamanho na tela em relação
// ao Goku (70): Pássaro 15% maior e Inseto 5% maior (pedido do Pedro, 03/11).
export const ALTURA_GOKU = 70;
export const VOADORES = {
  passaro: { cw: 109, ch: 104, figura: 92, proporcao: 1.15 },
  inseto: { cw: 116, ch: 111, figura: 91, proporcao: 1.05 },
  porunga: { proporcao: 2 },  // o dobro do Goku (pedido do Pedro); só tem as folhas definitivas
  boss: { proporcao: 3 }      // Porunga BOSS: 3× o Goku, com a aura de fumaça
};
// Quanto o voador fica acima do chão (a sombra fica no chão, no ponto do mob).
export const ALTURA_DE_VOO = 16;

// Folha provisória (reserva, se a folha definitiva não carregar): um desenho fixo por direção (linha "voando"; no golpe, "atacando"). Alternar com o "parado" fazia o
// bicho parecer girar de um lado para o outro, porque os dois desenhos da folha estão em ângulos
// diferentes. Até a folha com 4 quadros de asa chegar, o voo é um pulsar leve (encolhe e estica na
// vertical, 3 vezes por segundo) mais a flutuação.
export function drawVoador(ctx, tipo, x, y, time, facing, phase, attackProgress = null) {
  if (FOLHAS[tipo] && drawFolha(ctx, tipo, FOLHAS[tipo], x, y, time, facing, phase, attackProgress)) return true;
  const v = VOADORES[tipo], img = art[tipo];
  if (!v || !img || !v.cw || !loaded(img)) return false;
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
