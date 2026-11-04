// Cenário: grama, caminhos, pedras, árvores e a barraca do mercador.
import { art, loaded } from './assets.mjs';
import { ENTERRA_CASA, PLANETS } from '../shared/config.mjs';
import { OBJETOS_DECORACAO } from '../shared/decoracao-objetos.mjs';

const patterns = new WeakMap();
export const CLEARINGS = [
  [220, 200, 440, 310, 75], [0, 375, 1100, 125, 62],
  [775, 425, 145, 1130, 72], [1000, 330, 1170, 660, 140],
  [830, 490, 300, 250, 100], [1360, 910, 300, 500, 110],
  [820, 1390, 1560, 520, 150], [2720, 260, 490, 1680, 110]
];
// Build a smoothed union once so intersections are rounded without adding bulges.
let roadPath = null;
function roads(config) {
  if (roadPath) return roadPath;
  const resolution = 4;
  const mask = document.createElement('canvas');
  mask.width = Math.ceil(config.width / resolution); mask.height = Math.ceil(config.height / resolution);
  const painter = mask.getContext('2d'); painter.scale(1 / resolution, 1 / resolution);
  painter.fillStyle = '#fff'; painter.beginPath();
  for (const [x, y, w, h, r] of CLEARINGS) painter.roundRect(x, y, w, h, r);
  painter.fill();
  const soft = document.createElement('canvas'); soft.width = mask.width; soft.height = mask.height;
  const brush = soft.getContext('2d'); brush.filter = 'blur(6px)'; brush.drawImage(mask, 0, 0);
  const rgba = brush.getImageData(0, 0, soft.width, soft.height).data;
  const path = new Path2D(); let previous = new Map();
  const finish = item => path.rect(item.x * resolution, item.y * resolution, item.w * resolution, item.h * resolution);
  for (let y = 0; y < soft.height; y++) {
    const current = new Map(); let x = 0;
    while (x < soft.width) {
      while (x < soft.width && rgba[(y * soft.width + x) * 4 + 3] < 128) x++;
      const start = x;
      while (x < soft.width && rgba[(y * soft.width + x) * 4 + 3] >= 128) x++;
      if (x > start) {
        const key = start + ':' + x, item = previous.get(key) || { x: start, y, w: x - start, h: 0 };
        item.h++; current.set(key, item);
      }
    }
    for (const [key, item] of previous) if (!current.has(key)) finish(item);
    previous = current;
  }
  for (const item of previous.values()) finish(item);
  roadPath = path; return path;
}

function pattern(ctx, image, width, height, fallback) {
  if (!loaded(image)) return fallback;
  if (!patterns.has(image)) {
    const tile = document.createElement('canvas');
    tile.width = width; tile.height = height;
    const tileCtx = tile.getContext('2d');
    tileCtx.imageSmoothingEnabled = false;
    tileCtx.drawImage(image, 0, 0, width, height);
    patterns.set(image, ctx.createPattern(tile, 'repeat'));
  }
  return patterns.get(image);
}

export function drawTerrain(ctx, config, zones, merchant, camera, width, height) {
  const x = camera.x - 4, y = camera.y - 4;
  const w = width / camera.scale + 8, h = height / camera.scale + 8;
  ctx.fillStyle = pattern(ctx, art.grass, 384, 256, '#536b3a');
  ctx.fillRect(x, y, w, h);

  // The clearings are visual ground only: existing obstacle and movement rules remain in the engine.
  ctx.save(); ctx.clip(roads(config));
  ctx.fillStyle = pattern(ctx, art.earth, 362, 272, '#b28f64');
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = '#22341e'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, config.width, config.height);

  drawMarket(ctx, merchant);
}

// Solo do planeta a partir de uma imagem única esticada para o tamanho do mundo.
// Desenha só o trecho visível na câmera.
export function drawGroundImage(ctx, image, world, camera, width, height) {
  if (!loaded(image)) return false;
  const kx = image.naturalWidth / world.w, ky = image.naturalHeight / world.h;
  const x = Math.max(0, camera.x - 4), y = Math.max(0, camera.y - 4);
  const w = Math.min(world.w - x, width / camera.scale + 8), h = Math.min(world.h - y, height / camera.scale + 8);
  ctx.drawImage(image, x * kx, y * ky, w * kx, h * ky, x, y, w, h);
  return true;
}

// Barraca do mercador: fica no lugar do MERCHANT e não bloqueia a passagem.
export function drawMarket(ctx, merchant) {
  const mx = merchant.x, my = merchant.y;
  ctx.fillStyle = '#513322'; ctx.fillRect(mx - 49, my - 54, 98, 46);
  ctx.fillStyle = '#a4623a'; ctx.fillRect(mx - 55, my - 63, 110, 20);
  ctx.fillStyle = '#f0cb88';
  for (let i = 0; i < 5; i++) ctx.fillRect(mx - 51 + i * 22, my - 61, 11, 17);
  ctx.fillStyle = '#3a2c22'; ctx.fillRect(mx - 57, my - 45, 114, 6);
  ctx.fillStyle = '#f4deb0'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
  ctx.strokeStyle = '#292016'; ctx.lineWidth = 3;
  ctx.strokeText('MERCADO', mx, my + 21); ctx.fillText('MERCADO', mx, my + 21);
}

export function drawTree(ctx, obstacle) {
  if (!loaded(art.tree)) return false;
  // Draw to the existing obstacle's ground anchor for collision and depth sorting.
  const size = obstacle.r * 3.8;
  ctx.drawImage(art.tree, 33, 33, 1279, 1097,
    Math.round(obstacle.x - size / 2), Math.round(obstacle.y - size * 0.82), size, size * 0.86);
  return true;
}

export function drawRock(ctx, obstacle) {
  if (!loaded(art.rock)) return false;
  const size = obstacle.r * 2.3;
  const height = size * 0.75;
  ctx.fillStyle = '#17251072'; ctx.beginPath();
  ctx.ellipse(obstacle.x, obstacle.y + 2, obstacle.r * 0.92, obstacle.r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(art.rock, 360, 210, 815, 606,
    Math.round(obstacle.x - size / 2), Math.round(obstacle.y - height + 2), size, height);
  return true;
}

export function drawVendor(ctx, merchant) {
  if (!loaded(art.vendor)) return;
  ctx.drawImage(art.vendor, 319, 148, 606, 1001, merchant.x - 17, merchant.y - 53, 34, 56);
}

// O chão sob as casas (terreiro de terra e contato com a base) já vem pintado no solo.webp.
// Sem sombra: casa apoiada no chão não projeta sombra embaixo de si.
export function drawHouseGround() {}

// Casa namekiana com a base no ponto (x, y), enterrada alguns pixels no chão para não parecer
// solta. Reduzida na tela, suavizar evita serrilhado; ampliada, fica sem suavização (pixel art nítida).
export function drawHouse(ctx, house) {
  const image = (house.ruina ? art.namekRuinas : art.namekCasas)[house.sprite - 1];
  if (!loaded(image)) return false;
  const h = house.w * image.naturalHeight / image.naturalWidth, enterra = Math.round(house.w * ENTERRA_CASA);
  ctx.save();
  ctx.imageSmoothingEnabled = house.w * ctx.getTransform().a < image.naturalWidth; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, Math.round(house.x - house.w / 2), Math.round(house.y - h + enterra), house.w, h);
  ctx.restore(); return true;
}

// Portal provisório (o desenho final ainda vai ser escolhido): círculo luminoso no chão, anel girando
// e o destino escrito em cima. `cor` vem do destino (verde, laranja, vermelho para as hunts).
export function drawPortal(ctx, portal, time, cor, texto, raio) {
  const { x, y } = portal, giro = time * 1.6;
  ctx.save();
  const brilho = ctx.createRadialGradient(x, y, 4, x, y, raio * 1.25);
  brilho.addColorStop(0, cor + 'cc'); brilho.addColorStop(0.55, cor + '55'); brilho.addColorStop(1, cor + '00');
  ctx.fillStyle = brilho; ctx.beginPath(); ctx.ellipse(x, y, raio * 1.25, raio * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = cor;
  ctx.beginPath(); ctx.ellipse(x, y, raio, raio * 0.48, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#ffffffcc'; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -giro * 30;
  ctx.beginPath(); ctx.ellipse(x, y, raio * 0.72, raio * 0.34, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  // Coluna de luz subindo do círculo.
  const coluna = ctx.createLinearGradient(x, y, x, y - raio * 2.2);
  coluna.addColorStop(0, cor + '88'); coluna.addColorStop(1, cor + '00');
  ctx.fillStyle = coluna; ctx.fillRect(x - raio * 0.55, y - raio * 2.2, raio * 1.1, raio * 2.2);
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 4; ctx.strokeStyle = '#000d'; ctx.strokeText(texto, x, y - raio * 1.5); ctx.fillStyle = '#fff'; ctx.fillText(texto, x, y - raio * 1.5);
  ctx.restore();
}



// Árvore, arbusto ou pedra da decoração, com a base no ponto (x, y) do chão. Para parecer parte do cenário
// (Pedro, 03/11: "não quero que pareça algo artificial") o desenho da folha não muda; muda como ele assenta:
// depois do objeto, o PRÓPRIO CHÃO DO MAPA é redesenhado por cima do pé, num recorte irregular (o capim da
// mata ou a areia cobrem a base do tronco, o tufo azul e o pé da pedra), e a sombra é a silhueta do objeto
// deitada no chão (não um círculo).
export function drawDecoracao(ctx, d, escala) {
  const img = art.decoracao; if (!loaded(img)) return;
  const [sx, sy, w, h, bx, by] = OBJETOS_DECORACAO[d.sprite], k = escala * d.escala;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, w, h, Math.round(d.x - (bx - sx) * k), Math.round(d.y - (by - sy) * k), w * k, h * k);
  const pe = chaoPorCima(d, k);
  if (pe) ctx.drawImage(pe.canvas, pe.x, pe.y, pe.w, pe.h);
  ctx.restore();
}

// Número pseudoaleatório fixo por objeto (a borda irregular não muda de um quadro para o outro).
const ruido = (n, i) => { const v = Math.sin(n * 12.9898 + i * 78.233) * 43758.5453; return v - Math.floor(v); };

// Recorte do chão do mapa em volta do pé, com a borda de cima recortada como folhas/grãos. Feito uma vez
// por objeto (o chão é fixo) e guardado.
const pes = new Map();
function chaoPorCima(d, k) {
  const solo = art.namekSolo; if (!loaded(solo)) return null;
  const chave = d.x + ':' + d.y; if (pes.has(chave)) return pes.get(chave);
  const [, , w] = OBJETOS_DECORACAO[d.sprite], arvore = d.sprite < 12, pedra = d.sprite >= 15;
  // Largura coberta: na árvore, o pé e o tufo da base; na pedra e no arbusto, a parte de baixo.
  const W = Math.round(arvore ? Math.max(40, w * k * 0.62) : w * k * 1.05), H = Math.round(arvore ? 20 : pedra ? w * k * 0.24 : w * k * 0.22);
  const x0 = Math.round(d.x - W / 2), y0 = Math.round(d.y - H * 0.75);
  const kx = solo.naturalWidth / PLANETS.namek.w, ky = solo.naturalHeight / PLANETS.namek.h;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(solo, x0 * kx, y0 * ky, W * kx, H * ky, 0, 0, W, H);
  // Máscara: elipse achatada mais larga embaixo, com a borda de cima em "dentes" irregulares de 3–7 px.
  const m = g.getImageData(0, 0, W, H), n = d.x * 7 + d.y;
  for (let x = 0; x < W; x++) {
    const t = (x + 0.5) / W * 2 - 1, bojo = Math.sqrt(Math.max(0, 1 - t * t));
    const dente = Math.floor(x / 4), alto = H * (1 - bojo * (0.55 + 0.45 * ruido(n, dente)));
    for (let y = 0; y < H; y++) if (y < alto) m.data[(y * W + x) * 4 + 3] = 0;
  }
  g.putImageData(m, 0, 0);
  const pe = { canvas: c, x: x0, y: y0, w: W, h: H }; pes.set(chave, pe); return pe;
}

// Sombra: a silhueta do próprio objeto, achatada e inclinada para baixo e à direita (luz do mapa vem de cima
// à esquerda), num tom escuro da mata. Feita uma vez por tipo e tamanho.
const sombras = new Map();
export function drawSombraDecoracao(ctx, d, escala) {
  const img = art.decoracao; if (!loaded(img)) return;
  const [sx, sy, w, h, bx, by] = OBJETOS_DECORACAO[d.sprite], k = escala * d.escala, chave = d.sprite + ':' + d.escala;
  if (!sombras.has(chave)) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
    const g = c.getContext('2d'); g.drawImage(img, sx, sy, w, h, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(6,26,30)'; g.fillRect(0, 0, c.width, c.height);
    sombras.set(chave, c);
  }
  const c = sombras.get(chave), achata = d.sprite < 12 ? 0.2 : 0.35;
  ctx.save(); ctx.globalAlpha = d.sprite < 12 ? 0.42 : 0.35;
  // Ancorada no pé: a altura do objeto vira comprimento deitado para baixo/direita (cisalhamento).
  // y < 0 (acima do pé) vai para baixo e para a direita: x' = x − 0,45·y, y' = −achata·y (curta, colada no pé).
  ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([1, 0, -0.45, -achata, d.x, d.y])));
  ctx.drawImage(c, -(bx - sx) * k, -(by - sy) * k, c.width, c.height);
  ctx.restore();
}
