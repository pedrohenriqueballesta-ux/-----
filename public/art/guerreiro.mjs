// Guerreiro de Namek e Veterano de Namek (hunt média, decisão do Pedro, 03/11/2026). O Guerreiro ataca de
// perto; o Veterano soca de perto e dispara ki de longe (folha de ki quando o golpe é um tiro). Folhas de andar e de soco
// desenhadas quadro a quadro (ChatGPT), recortadas por fatiar_caminhada.py; o lado esquerdo sai espelhado.
// O quadro de impacto (coluna 3) cai no instante do dano, como no Saibaman.
import { art } from './assets.mjs';
import { drawWalk, drawSheet, GOLPE } from './atlas.mjs';
import { strikeColumn } from '../render/camera.mjs';

export const ALTURA_GUERREIRO = 70;   // mesma altura do Goku (provisório)
export function drawGuerreiro(ctx, x, y, moving, facing, phase, attackProgress = null, travelled = 0) {
  const pos = { x, y, travelled };
  const [sheet, key] = GOLPE.guerreiro;
  if (attackProgress !== null && drawSheet(ctx, sheet, art[key], pos, ALTURA_GUERREIRO, facing, strikeColumn(attackProgress))) return true;
  return drawWalk(ctx, 'guerreiro', pos, ALTURA_GUERREIRO, facing, moving, 96, phase);
}

export function drawVeterano(ctx, x, y, moving, facing, phase, attackProgress = null, travelled = 0, tiro = false) {
  const pos = { x, y, travelled };
  const [sheet, key] = tiro ? GOLPE.veteranoKi : GOLPE.veterano;
  if (attackProgress !== null && drawSheet(ctx, sheet, art[key], pos, ALTURA_GUERREIRO, facing, strikeColumn(attackProgress))) return true;
  return drawWalk(ctx, 'veterano', pos, ALTURA_GUERREIRO, facing, moving, 96, phase);
}
