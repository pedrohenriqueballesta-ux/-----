// Animação de caminhada e golpe dos personagens.
// Goku/SSJ usam folhas desenhadas quadro a quadro (passo/golpe); Saibaman/Alien
// usam pernas geradas proceduralmente (walk-rig) a partir de um desenho parado.
import { art, loaded } from './assets.mjs';
import { spriteFacing, walkStep, strikeFrame, DIRECTIONS } from '../render/camera.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';
import { makeWalkAtlas, walkBob } from './walk-rig.mjs';
import { GOKU_PASSO } from './goku-passo.mjs';
import { SSJ_PASSO } from './ssj-passo.mjs';
import { GOKU_GOLPE } from './goku-golpe.mjs';
import { SSJ_GOLPE } from './ssj-golpe.mjs';
import { SAIBAMAN_PASSO } from './saibaman-passo.mjs';
import { SAIBAMAN_GOLPE } from './saibaman-golpe.mjs';
import { SENTINELA_PASSO } from './sentinela-passo.mjs';
import { GUERREIRO_PASSO } from './guerreiro-passo.mjs';
import { GUERREIRO_GOLPE } from './guerreiro-golpe.mjs';

// Five distinct views, with the three opposite views mirrored for consistent anatomy.
// Back-diagonal views use a rear three-quarter drawing, never a side/front substitute.
const VIEWS = [
  { row: 0, flip: false }, { row: 1, flip: false }, { row: 2, flip: false },
  { row: 3, flip: false }, { row: 4, flip: false }, { row: 3, flip: true },
  { row: 2, flip: true }, { row: 1, flip: true }
];
function drawAtlas(ctx, key, pos, height, facing, frame) {
  const direction = spriteFacing(facing);
  const diagonalKey = key.replace(/(Walk|Attack)$/, 'Diagonal$1');
  const useDiagonal = direction % 2 === 1 && SPRITE_DATA[diagonalKey];
  const selected = useDiagonal ? diagonalKey : key;
  const data = SPRITE_DATA[selected], image = art[selected];
  if (!loaded(image)) return false;
  const { row, flip } = useDiagonal ? { row: direction === 1 || direction === 7 ? 0 : 1, flip: direction > 4 } : VIEWS[direction];
  const [sx, sy, sw, sh, anchorX, anchorY] = data.frames[row][frame];
  const scale = height / data.referenceHeight;
  ctx.save(); ctx.translate(Math.round(pos.x), Math.round(pos.y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, sx, sy, sw, sh,
    (sx - anchorX) * scale, (sy - anchorY) * scale + 6, sw * scale, sh * scale);
  ctx.restore();
  return true;
}
const walkingRigs = new Map();
// Direção do jogo (ordem de DIRECTIONS) → linha das folhas desenhadas (Sul, Sudeste, Leste, Nordeste, Norte);
// oeste e diagonais da esquerda são espelhadas.
const SHEET_VIEWS = [
  { row: 0, flip: false }, { row: 1, flip: true }, { row: 2, flip: true }, { row: 3, flip: true },
  { row: 4, flip: false }, { row: 3, flip: false }, { row: 2, flip: false }, { row: 1, flip: false }
];
// phase desencontra os passos de mobs iguais, para não andarem todos no mesmo pé.
function passoFrame(travelled, stride, moving, sheet = GOKU_PASSO, phase = 0) {
  if (!moving) return sheet.idleColumn;
  return Math.floor(walkStep(travelled, stride, phase) * sheet.columns / 16);
}
// Folhas desenhadas quadro a quadro (goku-passo, goku-golpe): mesmo desenho em todas as poses.
export function drawSheet(ctx, sheet, image, pos, height, facing, column, bob = 0) {
  if (!loaded(image)) return false;
  const view = SHEET_VIEWS[spriteFacing(facing)];
  const [sx, sy, sw, sh, anchorX, anchorY] = sheet.frames[view.row][column];
  const scale = height / sheet.referenceHeight;
  ctx.save(); ctx.translate(Math.round(pos.x), Math.round(pos.y - bob));
  if (view.flip) ctx.scale(-1, 1);
  // As folhas têm ~230 px de altura e são reduzidas para ~70: suavizar evita o serrilhado da redução.
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sx, sy, sw, sh, (sx - anchorX) * scale, (sy - anchorY) * scale + 6, sw * scale, sh * scale);
  ctx.restore(); return true;
}
// Goku base andando: quadros desenhados de verdade, em vez de pernas entortadas a partir de um desenho parado.
// Personagens com caminhada desenhada (Goku, SSJ, Saibaman, Sentinela = 'alien'); o walk-rig fica de reserva.
const PASSO = { goku: [GOKU_PASSO, 'gokuPasso'], ssj: [SSJ_PASSO, 'ssjPasso'], saibaman: [SAIBAMAN_PASSO, 'saibamanPasso'], alien: [SENTINELA_PASSO, 'sentinelaPasso'], guerreiro: [GUERREIRO_PASSO, 'guerreiroPasso'] };
export const GOLPE = { goku: [GOKU_GOLPE, 'gokuGolpe'], ssj: [SSJ_GOLPE, 'ssjGolpe'], saibaman: [SAIBAMAN_GOLPE, 'saibamanGolpe'], guerreiro: [GUERREIRO_GOLPE, 'guerreiroGolpe'] };
function drawPasso(ctx, kind, pos, height, facing, moving, stride, phase = 0) {
  const [sheet, key] = PASSO[kind];
  const bob = moving ? walkBob(walkStep(pos.travelled || 0, stride, phase)) * height : 0;
  return drawSheet(ctx, sheet, art[key], pos, height, facing, passoFrame(pos.travelled || 0, stride, moving, sheet, phase), bob);
}
export function drawWalk(ctx, kind, pos, height, facing, moving, stride = 96, phase = 0) {
  if (PASSO[kind] && drawPasso(ctx, kind, pos, height, facing, moving, stride, phase)) return true;
  if (!moving) return drawAtlas(ctx, kind + 'Walk', pos, height, facing, 0);
  const direction = spriteFacing(facing), diagonal = direction % 2 === 1;
  const key = kind + (diagonal ? 'DiagonalWalk' : 'Walk');
  const data = SPRITE_DATA[key], image = art[key];
  if (!loaded(image)) return false;
  const view = diagonal ? { row: direction === 1 || direction === 7 ? 0 : 1, flip: direction > 4 } : VIEWS[direction];
  const cacheKey = kind + ':' + direction;
  if (!walkingRigs.has(cacheKey)) {
    const vector = DIRECTIONS[direction];
    walkingRigs.set(cacheKey, makeWalkAtlas(image, data, view.row, { x: view.flip ? -vector.x : vector.x, y: vector.y }, kind));
  }
  const rig = walkingRigs.get(cacheKey), scale = height / rig.referenceHeight;
  const frame = walkStep(pos.travelled || 0, stride, phase);
  // O balanço entra só no desenho: o atlas (e a auditoria do tronco) continuam iguais.
  const bob = walkBob(frame) * height;
  ctx.save(); ctx.translate(Math.round(pos.x), Math.round(pos.y - bob));
  if (view.flip) ctx.scale(-1, 1);
  ctx.drawImage(rig.image, frame * rig.cell, 0, rig.cell, rig.cell,
    -rig.center * scale, -rig.ground * scale + 6, rig.cell * scale, rig.cell * scale);
  ctx.restore(); return true;
}
export function drawAttack(ctx, kind, pos, height, facing, progress) {
  return drawAtlas(ctx, kind + 'Attack', pos, height, facing, strikeFrame(progress));
}
