// Freeza BOSS (ideia do Pedro, 05/11/2026): nasce EM PÉ e solta o Death Beam (raio fino do dedo); a 40% da vida entra
// na NAVE (fica mais forte) e passa a soltar a Supernova. A troca de forma é um efeito do jogo (aura e clarão roxos),
// sem folha própria (decisão do Pedro, 05/11). A bola da Supernova é uma imagem à parte que o jogo faz crescer acima da
// mão e lança no alvo (cliente/game.mjs): numa célula da folha ela não caberia no tamanho final.
import { art } from './assets.mjs';
import { drawWalk, drawSheet, GOLPE } from './atlas.mjs';
import { strikeColumn } from '../render/camera.mjs';

// Altura na tela (Goku = 70). Na nave ele é maior (a cápsula). Provisório.
export const FREEZA_ALTURA = { pe: 131, nave: 120 };   // em pé +60% (pedido do Pedro, 05/11)
export function drawFreezaBoss(ctx, forma, x, y, moving, facing, phase, attackProgress, travelled, time) {
  const nave = forma === 'nave', altura = FREEZA_ALTURA[forma] || FREEZA_ALTURA.pe;
  const pos = { x, y, travelled: nave ? time * 70 : travelled };   // a nave flutua sempre, parada ou não
  if (attackProgress !== null) {
    const [sheet, key] = GOLPE[nave ? 'freezaNaveNova' : 'freezaPeBeam'];
    if (drawSheet(ctx, sheet, art[key], pos, altura, facing, strikeColumn(attackProgress))) return true;
  }
  return drawWalk(ctx, nave ? 'freezaNave' : 'freezaPe', pos, altura, facing, nave || moving, nave ? 140 : 96, phase, time);
}
