// Desenho da Sentinela alienígena (inimigo à distância), com caminhada e ataque de 16 quadros.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack } from './atlas.mjs';

export function drawAlien(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null, travelled = 0) {
  const pos = { x, y, travelled };
  if (attackProgress !== null && drawAttack(ctx, 'alien', pos, height, facing, attackProgress)) return true;
  if (drawWalk(ctx, 'alien', pos, height, facing, moving, height > 80 ? 136 : 80, phase, time)) return true;
  if (!loaded(art.alien)) return false;
  const bounce = moving ? Math.sin(time * 11) * 1.5 : 0;
  ctx.drawImage(art.alien, 228, 107, 800, 1044,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}
