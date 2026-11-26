import { drawGoku } from '../../art/personagens/goku/goku.mjs';
import { drawVegeta } from '../../art/personagens/vegeta/vegeta.mjs';
import { drawBoo } from '../../art/personagens/majin-boo/boo.mjs';
import { desenharNimbus } from '../vfx/nimbus.mjs';
import { progressoDoSoco } from '../pose-personagem.mjs';

const desenhistas = { goku: drawGoku, vegeta: drawVegeta, boo: drawBoo };

export function desenharPersonagemPopout(ctx, sprite, tempo, travelled = 0) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!sprite) return false;
  const ponto = { x: ctx.canvas.width / 2, y: sprite.montaria ? 98 : 108, travelled };
  const pose = { ...sprite, facing: sprite.bigBang?.direction || sprite.facing };
  if (pose.charge?.origem) pose.charge = { ...pose.charge, origem: ponto };
  const montado = desenharNimbus(ctx, sprite, ponto, tempo, { flutuar: !sprite.reduzirAnimacoes });
  const pos = montado ? { ...montado.personagem, travelled } : ponto;
  if (montado) pose.moving = false;
  const desenhar = desenhistas[sprite.vocacao] || drawGoku;
  const soco = progressoDoSoco(pose.socoStarted, tempo);
  if (pose.dashing) {
    ctx.save();
    ctx.globalAlpha *= .25;
    desenhar(ctx, pose, { ...pos, x: pos.x - pose.facing.x * 8, y: pos.y - pose.facing.y * 8 }, tempo, soco);
    ctx.restore();
  }
  return desenhar(ctx, pose, pos, tempo, soco);
}
