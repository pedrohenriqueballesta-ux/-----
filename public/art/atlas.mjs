// Animação de caminhada e golpe dos personagens.
// Goku/SSJ usam folhas desenhadas quadro a quadro (passo/golpe); Saibaman/Alien
// usam pernas geradas proceduralmente (walk-rig) a partir de um desenho parado.
import { FOLHAS_NAMEK_NORTE } from './namek-norte.mjs';
import { art, loaded } from './assets.mjs';
import { spriteFacing, walkStep, strikeFrame, DIRECTIONS } from '../render/camera.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';
import { makeWalkAtlas, walkBob } from './walk-rig.mjs';
import { FOLHAS_GOKU_KAIOKEN } from './goku-kaioken.mjs';
import { GOKU_PASSO } from './goku-passo.mjs';
import { SSJ_PASSO } from './ssj-passo.mjs';
import { GOKU_GOLPE } from './goku-golpe.mjs';
import { SSJ_GOLPE } from './ssj-golpe.mjs';
import { SAIBAMAN_PASSO } from './saibaman-passo.mjs';
import { SAIBAMAN_GOLPE } from './saibaman-golpe.mjs';
import { SENTINELA_PASSO } from './sentinela-passo.mjs';
import { GUERREIRO_PASSO } from './guerreiro-passo.mjs';
import { GUERREIRO_GOLPE } from './guerreiro-golpe.mjs';
import { VETERANO_PASSO } from './veterano-passo.mjs';
import { VETERANO_SOCO } from './veterano-soco.mjs';
import { VETERANO_KI } from './veterano-ki.mjs';
// Planeta Vegeta, Planícies Vermelhas (decisão do Pedro, 05/11/2026): Tsufurujin Guerreiro e General, Hatchiyack.
import { TSUFURU_GUERREIRO_PASSO } from './tsufuru-guerreiro-passo.mjs';
import { TSUFURU_GUERREIRO_SOCO } from './tsufuru-guerreiro-soco.mjs';
import { TSUFURU_GUERREIRO_KI } from './tsufuru-guerreiro-ki.mjs';
import { TSUFURU_GENERAL_PASSO } from './tsufuru-general-passo.mjs';
import { TSUFURU_GENERAL_SOCO } from './tsufuru-general-soco.mjs';
import { TSUFURU_GENERAL_KI } from './tsufuru-general-ki.mjs';
import { HATCHIYACK_PASSO } from './hatchiyack-passo.mjs';
import { HATCHIYACK_SOCO } from './hatchiyack-soco.mjs';
import { HATCHIYACK_KI } from './hatchiyack-ki.mjs';
// Cânions (decisão do Pedro, 05/11/2026): Nappa, Raditz e Bardock.
import { NAPPA_PASSO } from './nappa-passo.mjs';
import { NAPPA_SOCO } from './nappa-soco.mjs';
import { NAPPA_KI } from './nappa-ki.mjs';
import { RADITZ_PASSO } from './raditz-passo.mjs';
import { RADITZ_SOCO } from './raditz-soco.mjs';
import { RADITZ_KI } from './raditz-ki.mjs';
import { BARDOCK_PASSO } from './bardock-passo.mjs';
import { BARDOCK_SOCO } from './bardock-soco.mjs';
import { BARDOCK_KI } from './bardock-ki.mjs';
// Campos de Lava (decisão do Pedro, 05/11/2026): Oozaru, Oozaru Guerreiro e o chefe raro Oozaru Super.
import { OOZARU_PASSO } from './oozaru-passo.mjs';
import { OOZARU_SOCO } from './oozaru-soco.mjs';
import { OOZARU_KI } from './oozaru-ki.mjs';
import { OOZARU_GUERREIRO_PASSO } from './oozaru-guerreiro-passo.mjs';
import { OOZARU_GUERREIRO_SOCO } from './oozaru-guerreiro-soco.mjs';
import { OOZARU_GUERREIRO_KI } from './oozaru-guerreiro-ki.mjs';
import { OOZARU_SUPER_PASSO } from './oozaru-super-passo.mjs';
import { OOZARU_SUPER_SOCO } from './oozaru-super-soco.mjs';
import { OOZARU_SUPER_KI } from './oozaru-super-ki.mjs';
// Freeza BOSS (ideia do Pedro, 05/11/2026): em pé (Death Beam) e, a partir de 40% da vida, na nave (Supernova).
import { FREEZA_PE_PASSO } from './freeza-pe-andar.mjs';
import { FREEZA_PE_DEATHBEAM } from './freeza-pe-deathbeam.mjs';
import { FREEZA_NAVE_PASSO } from './freeza-nave-flutuar.mjs';
import { FREEZA_NAVE_SUPERNOVA } from './freeza-nave-supernova.mjs';
// Grande Cratera (decisão do Pedro, 06/11/2026): Rei Vegeta (o mais fraco) e Broly (o mais forte).
import { REI_VEGETA_PASSO } from './rei-vegeta-passo.mjs';
import { REI_VEGETA_SOCO } from './rei-vegeta-soco.mjs';
import { REI_VEGETA_KI } from './rei-vegeta-ki.mjs';
import { BROLY_PASSO } from './broly-passo.mjs';
import { BROLY_SOCO } from './broly-soco.mjs';
import { BROLY_KI } from './broly-ki.mjs';
// Oozaru Dourado (sem armadura): chefe raro dos Campos de Lava (Pedro, 06/11): pancada com os dois punhos e laser negro.
import { OOZARU_DOURADO_PASSO } from './oozaru-dourado-passo.mjs';
import { OOZARU_DOURADO_PANCADA } from './oozaru-dourado-pancada.mjs';
import { OOZARU_DOURADO_LASER } from './oozaru-dourado-laser.mjs';
// Cânions (decisão do Pedro, 06/11/2026): Dodoria (o mais fraco) e Zarbon (o mais forte).
import { ZARBON_PASSO } from './zarbon-passo.mjs';
import { ZARBON_SOCO } from './zarbon-soco.mjs';
import { ZARBON_KI } from './zarbon-ki.mjs';
import { DODORIA_PASSO } from './dodoria-passo.mjs';
import { DODORIA_SOCO } from './dodoria-soco.mjs';
import { DODORIA_KI } from './dodoria-ki.mjs';

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
export const SHEET_VIEWS = [
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
const PASSO = { kaioken: FOLHAS_GOKU_KAIOKEN.andar, ...Object.fromEntries(Object.entries(FOLHAS_NAMEK_NORTE).map(([tipo,f])=>[tipo,f.andar])), goku: [GOKU_PASSO, 'gokuPasso'], ssj: [SSJ_PASSO, 'ssjPasso'], saibaman: [SAIBAMAN_PASSO, 'saibamanPasso'], alien: [SENTINELA_PASSO, 'sentinelaPasso'], guerreiro: [GUERREIRO_PASSO, 'guerreiroPasso'], veterano: [VETERANO_PASSO, 'veteranoPasso'], tsufuruGuerreiro: [TSUFURU_GUERREIRO_PASSO, 'tsufuruGuerreiroPasso'], tsufuruGeneral: [TSUFURU_GENERAL_PASSO, 'tsufuruGeneralPasso'], hatchiyack: [HATCHIYACK_PASSO, 'hatchiyackPasso'], nappa: [NAPPA_PASSO, 'nappaPasso'], raditz: [RADITZ_PASSO, 'raditzPasso'], bardock: [BARDOCK_PASSO, 'bardockPasso'], oozaru: [OOZARU_PASSO, 'oozaruPasso'], oozaruGuerreiro: [OOZARU_GUERREIRO_PASSO, 'oozaruGuerreiroPasso'], oozaruSuper: [OOZARU_SUPER_PASSO, 'oozaruSuperPasso'],
  freezaPe: [FREEZA_PE_PASSO, 'freezaPePasso'], freezaNave: [FREEZA_NAVE_PASSO, 'freezaNavePasso'], reiVegeta: [REI_VEGETA_PASSO, 'reiVegetaPasso'], broly: [BROLY_PASSO, 'brolyPasso'], oozaruDourado: [OOZARU_DOURADO_PASSO, 'oozaruDouradoPasso'], zarbon: [ZARBON_PASSO, 'zarbonPasso'], dodoria: [DODORIA_PASSO, 'dodoriaPasso'] };
export const GOLPE = { ...Object.fromEntries(Object.entries(FOLHAS_NAMEK_NORTE).flatMap(([tipo,f])=>[[tipo,f.ataque],[tipo+'Ki',f.rajada]])), goku: [GOKU_GOLPE, 'gokuGolpe'], ssj: [SSJ_GOLPE, 'ssjGolpe'], saibaman: [SAIBAMAN_GOLPE, 'saibamanGolpe'], guerreiro: [GUERREIRO_GOLPE, 'guerreiroGolpe'], veterano: [VETERANO_SOCO, 'veteranoSoco'],
  veteranoKi: [VETERANO_KI, 'veteranoKi'],
  tsufuruGuerreiro: [TSUFURU_GUERREIRO_SOCO, 'tsufuruGuerreiroSoco'], tsufuruGuerreiroKi: [TSUFURU_GUERREIRO_KI, 'tsufuruGuerreiroKi'],
  tsufuruGeneral: [TSUFURU_GENERAL_SOCO, 'tsufuruGeneralSoco'], tsufuruGeneralKi: [TSUFURU_GENERAL_KI, 'tsufuruGeneralKi'],
  hatchiyack: [HATCHIYACK_SOCO, 'hatchiyackSoco'], hatchiyackKi: [HATCHIYACK_KI, 'hatchiyackKi'],
  nappa: [NAPPA_SOCO, 'nappaSoco'], nappaKi: [NAPPA_KI, 'nappaKi'],
  raditz: [RADITZ_SOCO, 'raditzSoco'], raditzKi: [RADITZ_KI, 'raditzKi'],
  bardock: [BARDOCK_SOCO, 'bardockSoco'], bardockKi: [BARDOCK_KI, 'bardockKi'],
  oozaru: [OOZARU_SOCO, 'oozaruSoco'], oozaruKi: [OOZARU_KI, 'oozaruKi'],
  oozaruGuerreiro: [OOZARU_GUERREIRO_SOCO, 'oozaruGuerreiroSoco'], oozaruGuerreiroKi: [OOZARU_GUERREIRO_KI, 'oozaruGuerreiroKi'],
  oozaruSuper: [OOZARU_SUPER_SOCO, 'oozaruSuperSoco'], oozaruSuperKi: [OOZARU_SUPER_KI, 'oozaruSuperKi'],
  freezaPeBeam: [FREEZA_PE_DEATHBEAM, 'freezaPeBeam'], freezaNaveNova: [FREEZA_NAVE_SUPERNOVA, 'freezaNaveNova'],
  reiVegeta: [REI_VEGETA_SOCO, 'reiVegetaSoco'], reiVegetaKi: [REI_VEGETA_KI, 'reiVegetaKi'],
  broly: [BROLY_SOCO, 'brolySoco'], brolyKi: [BROLY_KI, 'brolyKi'],
  oozaruDourado: [OOZARU_DOURADO_PANCADA, 'oozaruDouradoPancada'], oozaruDouradoKi: [OOZARU_DOURADO_LASER, 'oozaruDouradoLaser'],
  zarbon: [ZARBON_SOCO, 'zarbonSoco'], zarbonKi: [ZARBON_KI, 'zarbonKi'],
  dodoria: [DODORIA_SOCO, 'dodoriaSoco'], dodoriaKi: [DODORIA_KI, 'dodoriaKi'] };
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
