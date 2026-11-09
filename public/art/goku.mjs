// Desenho do Goku (base, Kaioken e Super Saiyajin): caminhada e soco desenhados
// quadro a quadro (folhas passo/golpe), com recortes de 16 quadros como reserva.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack, drawSheet, GOLPE } from './atlas.mjs';
import { FOLHAS_GOKU_KAIOKEN } from './goku-kaioken.mjs';
import { FOLHAS_GOKU_BASE } from './goku-base.mjs';
import { colunaGenki } from '../render/genki-personagem.mjs';
import { KAME } from '../shared/kamehameha.mjs';
import { strikeColumn } from '../render/camera.mjs';

export function drawGoku(ctx, player, pos, time, strikeProgress = null) {
  if (!player.dead && !player.transformed) {
    const folhas = player.forma === 'kaioken' ? FOLHAS_GOKU_KAIOKEN : FOLHAS_GOKU_BASE;
    let estado = player.moving ? 'andar' : 'parado', coluna = Math.floor(time * 3) % 4;
    const genki = colunaGenki(player,time);
    if (genki !== null) { estado = 'genki';coluna = genki; }
    else if (player.charge) {
      estado = 'kamehameha';
      const inicio = player.charge.until - KAME.carga;
      coluna = time - inicio < KAME.carga / 2 ? 0 : 1;
    } else if (Number.isFinite(player.kameStarted)) {
      estado = 'kamehameha';coluna = time - player.kameStarted < .5 ? 2 : 3;
    } else if (Number.isFinite(player.rajadaStarted) && time - player.rajadaStarted < .36) {
      estado = 'rajada';coluna = strikeColumn(Math.max(0,time-player.rajadaStarted)/.36);
    } else if (strikeProgress !== null) { estado = 'soco';coluna = strikeColumn(strikeProgress); }
    if (estado === 'andar') {
      const altura = 70 * folhas.andar[0].referenceHeight / FOLHAS_GOKU_BASE.andar[0].referenceHeight;
      if (drawWalk(ctx,player.forma === 'kaioken' ? 'kaioken' : 'goku',pos,altura,player.facing,true)) return true;
    } else {
      const [folha,chave] = folhas[estado];
      // Escala única entre poses: mudar de ação não muda o tamanho do corpo.
      const altura = 70 * folha.referenceHeight / FOLHAS_GOKU_BASE.andar[0].referenceHeight;
      if (drawSheet(ctx,folha,art[chave],pos,altura,player.facing,coluna)) return true;
    }
  }
  // Soco e carga do Kamehameha vêm da folha de golpe desenhada da forma atual (carga = pose de preparação).
  if (!player.dead) {
    const [sheet, key] = GOLPE[player.transformed ? 'ssj' : 'goku'];
    if (strikeProgress !== null && !player.charge &&
        drawSheet(ctx, sheet, art[key], pos, 70, player.facing, strikeColumn(strikeProgress))) return true;
    if (player.charge && drawSheet(ctx, sheet, art[key], pos, 70, player.facing, 0)) return true;
  }
  if (strikeProgress !== null && !player.dead && !player.charge &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, strikeProgress)) return true;
  if (player.charge && !player.dead &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, 3 / 16)) return true;
  if (!player.dead && drawWalk(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, player.moving)) return true;
  if (!loaded(art.goku)) return false;
  const f = player.facing || { x: 0, y: 1 };
  const horizontal = Math.abs(f.x) > Math.abs(f.y) * 1.15;
  const back = !horizontal && f.y < 0;
  const column = horizontal ? 2 : back ? 4 : 0;
  let row = player.transformed ? 9 : (player.charge ? 8 : strikeProgress !== null ? 4 : (player.moving && !back ? 1 : 0));
  if (player.dead) row = 7;
  const rowY = [55, 179, 304, 425, 545, 660, 783, 894, 966, 1088];
  const sourceX = 180 + column * 114;
  const bob = player.moving ? Math.sin(time * 13) * 1.3 : 0;
  ctx.save();
  ctx.translate(Math.round(pos.x), Math.round(pos.y + bob));
  if (horizontal && f.x < 0) ctx.scale(-1, 1);
  ctx.drawImage(art.goku, sourceX, rowY[row], 100, 110, -32, -63, 64, 70);
  ctx.restore();
  return true;
}
