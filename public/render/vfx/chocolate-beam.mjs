import { CHOCOLATE_BEAM } from '../../shared/tecnicas/chocolate-beam.mjs';

const dir = '/assets/skills/majin-boo/chocolate-beam/';
const limitesRaio = [[174, 74, 260, 146], [158, 74, 285, 142], [144, 71, 304, 144], [123, 62, 322, 157], [96, 52, 345, 160], [86, 56, 358, 161], [75, 51, 379, 168], [52, 43, 397, 171], [48, 43, 399, 178], [45, 41, 402, 182], [46, 44, 401, 178], [44, 41, 402, 182], [57, 52, 389, 166], [85, 67, 360, 150], [129, 74, 318, 147], [136, 71, 261, 151]];
let raio, chocolate;

export function carregarRaioChocolate() {
  if (raio) return;
  raio = new Image();
  chocolate = new Image();
  raio.src = dir + 'raio_rgba.png';
  chocolate.src = dir + 'chocolate_stun_rgba.png';
}

export function desenharRaioChocolate(ctx, s, time, origem, alvo) {
  if (!raio?.naturalWidth) return;
  const dx = alvo.x - origem.x, dy = alvo.y - origem.y;
  const distanciaVisual = Math.hypot(dx, dy);
  const falta = Math.max(0, Math.hypot(alvo.pes.x - s.x, alvo.pes.y - s.y) - alvo.raio);
  const total = s.percorrido + falta;
  if (!(total > 0) || !(distanciaVisual > 0)) return;
  const dt = Math.max(0, Math.min(.07, time - s.snapshotEm));
  const progresso = Math.min(1, (s.percorrido + dt * CHOCOLATE_BEAM.velocidade) / total);
  const contatoVisual = Math.max(0, distanciaVisual - alvo.raio * .65);
  const avancou = contatoVisual * progresso;
  if (avancou < 1) return;
  const etapa = Math.max(0, Math.floor((time - s.started) * 28));
  const frame = etapa < 4 ? 4 + etapa : 8 + (etapa - 4) % 4;
  const [l,t,r,b] = limitesRaio[frame];
  const comprimento = Math.min(avancou, 92);
  ctx.save();
  ctx.translate(origem.x, origem.y);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.drawImage(raio, frame % 4 * 448 + l, Math.floor(frame / 4) * 224 + t, r - l, b - t,
    avancou - comprimento, -11, comprimento, 22);
  ctx.restore();
}

export function desenharChocolateAtordoado(ctx, pos, status, time) {
  if (!chocolate?.naturalWidth || !status || time < status.started || time >= status.until) return;
  const frame = Math.floor((time - status.started) * 12) % 12;
  ctx.drawImage(chocolate, frame % 4 * 362, Math.floor(frame / 4) * 362, 362, 362,
    pos.x - 23, pos.y - 23, 46, 46);
}
