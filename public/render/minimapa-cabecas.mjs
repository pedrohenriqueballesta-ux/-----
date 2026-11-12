import { drawGoku, drawSaibaman, drawAlien, drawVoador, VOADORES,
  drawGuerreiro, drawVeterano, ALTURA_GUERREIRO, drawLutador, LUTADORES, drawFreezaBoss, FREEZA_ALTURA } from '../art/index.mjs';

const cache = new Map(), FRENTE = { x: 0, y: 1 };
let retratoGoku = null;
function chave(entidade, jogador) {
  return jogador ? 'player:' + (entidade.transformed || entidade.forma === 'ssj' ? 'ssj' : entidade.forma || 'base')
    : 'mob:' + entidade.type + ':' + (entidade.forma || '');
}
function desenharCorpoMini(ctx, entidade, jogador) {
  const x = 32, y = 80, pos = { x, y, travelled: 0 };
  if (jogador) return drawGoku(ctx, { ...entidade, dead: false, moving: false, facing: FRENTE,
    transformed: entidade.transformed || entidade.forma === 'ssj', charge: null }, pos, .4);
  const tipo = entidade.type, fase = 0;
  const altura = tipo in VOADORES ? 70 * VOADORES[tipo].proporcao : tipo === 'guerreiro' || tipo === 'veterano' ? ALTURA_GUERREIRO
    : tipo === 'freezaBoss' ? FREEZA_ALTURA[entidade.forma] || FREEZA_ALTURA.pe : tipo in LUTADORES ? LUTADORES[tipo].altura : 70;
  const escala = Math.min(1, 70 / altura); ctx.save(); ctx.translate(x, y); ctx.scale(escala, escala); ctx.translate(-x, -y);
  let desenhou;
  if (tipo in VOADORES) desenhou = drawVoador(ctx, tipo, x, y, .4, FRENTE, fase, null);
  else if (tipo === 'guerreiro') desenhou = drawGuerreiro(ctx, x, y, false, FRENTE, fase, null, 0, .4);
  else if (tipo === 'freezaBoss') desenhou = drawFreezaBoss(ctx, entidade.forma || 'pe', x, y, false, FRENTE, fase, null, 0, .4);
  else if (tipo in LUTADORES) desenhou = drawLutador(ctx, tipo, x, y, false, FRENTE, fase, null, 0, false, .4);
  else if (tipo === 'veterano') desenhou = drawVeterano(ctx, x, y, false, FRENTE, fase, null, 0, false, .4);
  else {
    const h = tipo === 'boss' ? 100 : 53, tamanho = tipo === 'boss' ? 76 : 40;
    desenhou = (['melee', 'passaro', 'guerreiro'].includes(tipo)
    ? drawSaibaman(ctx, x, y, tamanho + 8, h + 5, .4, false, FRENTE, fase)
    : drawAlien(ctx, x, y, tamanho + 8, h + 5, .4, false, FRENTE, fase));
  }
  ctx.restore(); return Boolean(desenhou);
}
function criarIcone(entidade, jogador) {
  const id = chave(entidade, jogador);
  if (cache.has(id)) return cache.get(id);
  if (jogador && !entidade.transformed && entidade.forma !== 'ssj' && entidade.forma !== 'kaioken') {
    if (!retratoGoku) { retratoGoku = new Image(); retratoGoku.src = '/assets/goku-avatar.png'; }
    if (!retratoGoku.complete || !retratoGoku.naturalWidth) return null;
    const icone = document.createElement('canvas'); icone.width = 32; icone.height = 32;
    const i = icone.getContext('2d'); i.imageSmoothingEnabled = true; i.imageSmoothingQuality = 'high';
    // O avatar tem o rosto na metade inferior; deslocar o recorte para baixo evita mostrar só o cabelo.
    i.save(); i.beginPath(); i.arc(16, 16, 15.5, 0, Math.PI * 2); i.clip();
    i.drawImage(retratoGoku, 50, 100, 480, 480, 0, -4, 32, 32); i.restore();
    cache.set(id, icone); return icone;
  }
  const corpo = document.createElement('canvas'); corpo.width = 64; corpo.height = 88;
  const c = corpo.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  if (!desenharCorpoMini(c, entidade, jogador)) return null; // tenta de novo quando a folha carregar
  const icone = document.createElement('canvas'); icone.width = 32; icone.height = 32;
  const i = icone.getContext('2d'); i.imageSmoothingEnabled = true; i.imageSmoothingQuality = 'high';
  i.save(); i.beginPath(); i.arc(16, 16, 15.5, 0, Math.PI * 2); i.clip();
  // Os quadros de corpo inteiro têm cabeça perto do topo; deslocamos o recorte na máscara
  // para colocar olhos/rosto no centro em vez de deixar só o topo visível.
  i.drawImage(corpo, 4, 1, 56, 51, 0, 3, 32, 32); i.restore();
  cache.set(id, icone); return icone;
}
export function desenharCabecaMinimapa(ctx, entidade, x, y, tamanho = 14, jogador = false) {
  const icone = criarIcone(entidade, jogador);
  if (!icone) return false;
  const chefe = !jogador && ['boss','subboss','freezaBoss','oozaruSuper','oozaruDourado'].includes(entidade.type);
  const contorno = jogador ? '#6ad8ff' : chefe ? '#ffd36a' : '#e9f4ff';
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, tamanho / 2 + 1.5, 0, Math.PI * 2); ctx.fillStyle = '#06101b'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, tamanho / 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = jogador ? '#d78b35' : '#263d5b'; ctx.fillRect(x - tamanho / 2, y - tamanho / 2, tamanho, tamanho);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(icone, x - tamanho / 2, y - tamanho / 2, tamanho, tamanho); ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, tamanho / 2 + .75, 0, Math.PI * 2); ctx.strokeStyle = '#07111d'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, tamanho / 2 + .75, 0, Math.PI * 2); ctx.strokeStyle = contorno; ctx.lineWidth = 1.25; ctx.stroke();
  return true;
}
