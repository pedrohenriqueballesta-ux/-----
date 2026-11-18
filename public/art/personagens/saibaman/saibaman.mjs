// Desenho do Saibaman (inimigo corpo a corpo): caminhada e ataque desenhados quadro a quadro,
// com as folhas de 16 quadros como reserva.
import { art, loaded } from '../../assets.mjs';
import { drawWalk, drawAttack, drawSheet, GOLPE } from '../../atlas.mjs';
import { strikeColumn } from '../../../render/mapa/camera.mjs';

export function drawSaibaman(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null, travelled = 0) {
  const pos = { x, y, travelled };
  // mobStrikeProgress: 0–0,5 durante o aviso vermelho e 0,5 no dano, então o quadro de impacto
  // (coluna 2) aparece no instante em que o golpe acerta.
  const [sheet, key] = GOLPE.saibaman;
  if (attackProgress !== null && drawSheet(ctx, sheet, art[key], pos, height, facing, strikeColumn(attackProgress))) return true;
  if (attackProgress !== null && drawAttack(ctx, 'saibaman', pos, height, facing, attackProgress)) return true;
  if (drawWalk(ctx, 'saibaman', pos, height, facing, moving, 80, phase)) return true;
  if (!loaded(art.saibaman)) return false;
  const bounce = moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.drawImage(art.saibaman, 371, 309, 512, 679,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}
