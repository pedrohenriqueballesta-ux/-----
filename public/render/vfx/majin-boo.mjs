import { CLONES_BOO, SUPERNOVA_BOO, ANGRY_BOO, estagioTecnicasBoo } from '../../shared/tecnicas/majin-boo.mjs';

const pasta = '/assets/skills/majin-boo/';
const atlas = {
  clones: { arquivo: 'clone-summoning/invocacao_rgba.png', altura: 352, ancoraY: 286 },
  abertura: { arquivo: 'supernova/abertura_rgba.png', altura: 352, ancoraY: 176 },
  sustentacao: { arquivo: 'supernova/sustentacao_rgba.png', altura: 352, ancoraY: 176 },
  fechamento: { arquivo: 'supernova/fechamento_rgba.png', altura: 352, ancoraY: 176 },
  angry: { arquivo: 'angry-explosion/angry_explosion_rgba.png', altura: 384, ancoraY: 270 }
};
const imagens = new Map();

export function carregarEfeitosBoo() {
  for (const [id, folha] of Object.entries(atlas)) {
    if (imagens.has(id)) continue;
    const img = new Image();
    img.src = pasta + folha.arquivo;
    imagens.set(id, img);
  }
}

const quadro = (t, duracao, total) => Math.min(total - 1, Math.floor(Math.max(0, t) / duracao * total));

function desenhar(ctx, id, frame, pos, escala, alpha = 1) {
  const img = imagens.get(id);
  if (!img?.complete || !img.naturalWidth) return;
  const { altura, ancoraY } = atlas[id];
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(img, frame % 4 * 512, Math.floor(frame / 4) * altura, 512, altura,
    pos.x - 256 * escala, pos.y - ancoraY * escala, 512 * escala, altura * escala);
  ctx.restore();
}

export function desenharCargaBoo(ctx, carga, pos, time) {
  const t = time - carga.started;
  if (t < 0 || time >= carga.until) return;
  if (carga.booTecnica === CLONES_BOO.id) {
    desenhar(ctx, 'clones', quadro(t, CLONES_BOO.carga, 16), carga.origem, estagioTecnicasBoo(carga.forma).escalaFumaca, Math.min(1, (CLONES_BOO.carga - t) / .12));
  } else if (carga.booTecnica === ANGRY_BOO.id) {
    desenhar(ctx, 'angry', quadro(t, ANGRY_BOO.carga, 4), pos, 2 * carga.raio / 366);
  }
}

export function desenharEfeitoBoo(ctx, e, time) {
  const t = time - e.started, resta = e.expiresAt - time;
  if (t < 0 || resta <= 0) return;
  if (e.tipo === SUPERNOVA_BOO.id) {
    ctx.save();
    ctx.strokeStyle = '#d876d888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.raio, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    const escala = 2 * e.raio / 365;
    if (t < SUPERNOVA_BOO.abertura) desenhar(ctx, 'abertura', quadro(t, SUPERNOVA_BOO.abertura, 8), e, escala);
    else if (resta <= SUPERNOVA_BOO.fechamento) desenhar(ctx, 'fechamento', quadro(SUPERNOVA_BOO.fechamento - resta, SUPERNOVA_BOO.fechamento, 8), e, escala, Math.min(1, resta / .12));
    else desenhar(ctx, 'sustentacao', Math.floor((t - SUPERNOVA_BOO.abertura) * 16) % 16, e, escala);
  } else if (e.tipo === ANGRY_BOO.id) {
    const frame = t < ANGRY_BOO.explosao ? 4 + quadro(t, ANGRY_BOO.explosao, 5)
      : 9 + quadro(t - ANGRY_BOO.explosao, ANGRY_BOO.duracao - ANGRY_BOO.explosao, 7);
    desenhar(ctx, 'angry', frame, e, 2 * e.raio / 366, Math.min(1, resta / .16));
  }
}
