// Desenho do Freeza (chefe), com quadros ociosos por direção e aura violeta.
import { art, loaded } from '../../assets.mjs';
import { spriteFacing } from '../../../render/mapa/camera.mjs';

export function drawFreeza(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null, travelled = 0) {
  const dir = spriteFacing(facing);
  const view = dir % 4;
  const flip = dir >= 4;
  const frame = attackProgress !== null
    ? Math.max(0, Math.min(3, Math.floor(attackProgress * 4)))
    : moving ? (Math.floor((travelled / 25 + phase + time * 0.5) * 4) % 4) : (Math.floor(time * 1.4 + phase * 4) % 4);
  const image = art.freezaFrames[view * 4 + frame];
  const drawWidth = Math.max(size, height * 0.78);
  const drawHeight = height;
  if (loaded(image)) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight + 4, drawWidth, drawHeight);
    ctx.restore();
  } else if (loaded(art.freezaBoss)) {
    ctx.drawImage(art.freezaBoss, x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight);
  } else return false;
  if (attackProgress !== null) {
    const dirX = Number.isFinite(facing?.x) ? facing.x : 1;
    const dirY = Number.isFinite(facing?.y) ? facing.y : 0;
    ctx.save(); ctx.globalAlpha = Math.max(0.2, 1 - attackProgress * 0.4); ctx.lineCap = 'round';
    ctx.strokeStyle = '#df80ff'; ctx.lineWidth = 4 + attackProgress * 3;
    ctx.beginPath(); ctx.arc(x + dirX * 25, y - 24 + dirY * 10, 19 + attackProgress * 9, -1.8 + attackProgress * 0.5, 1.4 + attackProgress * 0.5); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.restore();
  }
  // A faint violet aura identifies Freeza as a boss without obscuring the map.
  const aura = 0.12 + Math.sin(time * 5 + phase) * 0.035;
  ctx.save(); ctx.globalAlpha = aura; ctx.strokeStyle = '#c44cff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y - height * 0.47, drawWidth * 0.55, height * 0.46, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  return true;
}
