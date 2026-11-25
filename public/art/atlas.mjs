// Animação de caminhada e golpe dos personagens.
// Goku/SSJ usam folhas desenhadas quadro a quadro (passo/golpe); Saibaman/Alien
// usam pernas geradas proceduralmente (walk-rig) a partir de um desenho parado.
import { FOLHAS_NAMEK_NORTE } from './cenario/namek-norte.mjs';
import { PARADO } from './parado.mjs';
import { art, loaded } from './assets.mjs';
import { SHEET_VIEWS } from './sheet-views.mjs';
export { SHEET_VIEWS } from './sheet-views.mjs';
import { spriteFacing, walkStep, strikeFrame, DIRECTIONS } from '../render/mapa/camera.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';
import { makeWalkAtlas, walkBob } from './walk-rig.mjs';
import { FOLHAS_GOKU_KAIOKEN } from './personagens/goku/goku-kaioken.mjs';
import { FOLHAS_GOKU_SSJ } from './personagens/goku/goku-ssj.mjs';
import { FOLHAS_GOKU_SSJ2 } from './personagens/goku/goku-ssj2.mjs';
import { FOLHAS_GOKU_SSJ3 } from './personagens/goku/goku-ssj3.mjs';
import { FOLHAS_GOKU_SSJ4 } from './personagens/goku/goku-ssj4.mjs';
import { GOKU_PASSO } from './personagens/goku/goku-passo.mjs';
import { SSJ_PASSO } from './ssj-passo.mjs';
import { GOKU_GOLPE } from './personagens/goku/goku-golpe.mjs';
import { SSJ_GOLPE } from './ssj-golpe.mjs';
import { SAIBAMAN_PASSO } from './personagens/saibaman/saibaman-passo.mjs';
import { SAIBAMAN_GOLPE } from './personagens/saibaman/saibaman-golpe.mjs';
import { SENTINELA_PASSO } from './personagens/sentinela/sentinela-passo.mjs';
import { GUERREIRO_PASSO } from './guerreiro-passo.mjs';
import { GUERREIRO_GOLPE } from './guerreiro-golpe.mjs';
import { VETERANO_PASSO } from './personagens/veterano/veterano-passo.mjs';
import { VETERANO_SOCO } from './personagens/veterano/veterano-soco.mjs';
import { VETERANO_KI } from './personagens/veterano/veterano-ki.mjs';
// Planeta Vegeta, Planícies Vermelhas (decisão do Pedro, 05/11/2026): Tsufurujin Guerreiro e General, Hatchiyack.
import { TSUFURU_GUERREIRO_PASSO } from './personagens/tsufuru/tsufuru-guerreiro-passo.mjs';
import { TSUFURU_GUERREIRO_SOCO } from './personagens/tsufuru/tsufuru-guerreiro-soco.mjs';
import { TSUFURU_GUERREIRO_KI } from './personagens/tsufuru/tsufuru-guerreiro-ki.mjs';
import { TSUFURU_GENERAL_PASSO } from './personagens/tsufuru/tsufuru-general-passo.mjs';
import { TSUFURU_GENERAL_SOCO } from './personagens/tsufuru/tsufuru-general-soco.mjs';
import { TSUFURU_GENERAL_KI } from './personagens/tsufuru/tsufuru-general-ki.mjs';
import { HATCHIYACK_PASSO } from './personagens/hatchiyack/hatchiyack-passo.mjs';
import { HATCHIYACK_SOCO } from './personagens/hatchiyack/hatchiyack-soco.mjs';
import { HATCHIYACK_KI } from './personagens/hatchiyack/hatchiyack-ki.mjs';
// Cânions (decisão do Pedro, 05/11/2026): Nappa, Raditz e Bardock.
import { NAPPA_PASSO } from './personagens/nappa/nappa-passo.mjs';
import { NAPPA_SOCO } from './personagens/nappa/nappa-soco.mjs';
import { NAPPA_KI } from './personagens/nappa/nappa-ki.mjs';
import { RADITZ_PASSO } from './personagens/raditz/raditz-passo.mjs';
import { RADITZ_SOCO } from './personagens/raditz/raditz-soco.mjs';
import { RADITZ_KI } from './personagens/raditz/raditz-ki.mjs';
import { BARDOCK_PASSO } from './personagens/bardock/bardock-passo.mjs';
import { BARDOCK_SOCO } from './personagens/bardock/bardock-soco.mjs';
import { BARDOCK_KI } from './personagens/bardock/bardock-ki.mjs';
// Campos de Lava (decisão do Pedro, 05/11/2026): Oozaru, Oozaru Guerreiro e o chefe raro Oozaru Super.
import { OOZARU_PASSO } from './personagens/oozaru/oozaru-passo.mjs';
import { OOZARU_SOCO } from './personagens/oozaru/oozaru-soco.mjs';
import { OOZARU_KI } from './personagens/oozaru/oozaru-ki.mjs';
import { OOZARU_GUERREIRO_PASSO } from './personagens/oozaru/oozaru-guerreiro-passo.mjs';
import { OOZARU_GUERREIRO_SOCO } from './personagens/oozaru/oozaru-guerreiro-soco.mjs';
import { OOZARU_GUERREIRO_KI } from './personagens/oozaru/oozaru-guerreiro-ki.mjs';
import { OOZARU_SUPER_PASSO } from './personagens/oozaru/oozaru-super-passo.mjs';
import { OOZARU_SUPER_SOCO } from './personagens/oozaru/oozaru-super-soco.mjs';
import { OOZARU_SUPER_KI } from './personagens/oozaru/oozaru-super-ki.mjs';
// Freeza BOSS (ideia do Pedro, 05/11/2026): em pé (Death Beam) e, a partir de 40% da vida, na nave (Supernova).
import { FREEZA_PE_PASSO } from './personagens/freeza/freeza-pe-andar.mjs';
import { FREEZA_PE_DEATHBEAM } from './personagens/freeza/freeza-pe-deathbeam.mjs';
import { FREEZA_NAVE_PASSO } from './personagens/freeza/freeza-nave-flutuar.mjs';
import { FREEZA_NAVE_SUPERNOVA } from './personagens/freeza/freeza-nave-supernova.mjs';
// Grande Cratera (decisão do Pedro, 06/11/2026): Rei Vegeta (o mais fraco) e Broly (o mais forte).
import { REI_VEGETA_PASSO } from './personagens/rei-vegeta/rei-vegeta-passo.mjs';
import { REI_VEGETA_SOCO } from './personagens/rei-vegeta/rei-vegeta-soco.mjs';
import { REI_VEGETA_KI } from './personagens/rei-vegeta/rei-vegeta-ki.mjs';
import { BROLY_PASSO } from './personagens/broly/broly-passo.mjs';
import { BROLY_SOCO } from './personagens/broly/broly-soco.mjs';
import { BROLY_KI } from './personagens/broly/broly-ki.mjs';
// Oozaru Dourado (sem armadura): chefe raro dos Campos de Lava (Pedro, 06/11): pancada com os dois punhos e laser negro.
import { OOZARU_DOURADO_PASSO } from './personagens/oozaru/oozaru-dourado-passo.mjs';
import { OOZARU_DOURADO_PANCADA } from './personagens/oozaru/oozaru-dourado-pancada.mjs';
import { OOZARU_DOURADO_LASER } from './personagens/oozaru/oozaru-dourado-laser.mjs';
// Cânions (decisão do Pedro, 06/11/2026): Dodoria (o mais fraco) e Zarbon (o mais forte).
import { ZARBON_PASSO } from './personagens/zarbon/zarbon-passo.mjs';
import { ZARBON_SOCO } from './personagens/zarbon/zarbon-soco.mjs';
import { ZARBON_KI } from './personagens/zarbon/zarbon-ki.mjs';
import { DODORIA_PASSO } from './personagens/dodoria/dodoria-passo.mjs';
import { DODORIA_SOCO } from './personagens/dodoria/dodoria-soco.mjs';
import { DODORIA_KI } from './personagens/dodoria/dodoria-ki.mjs';
// Mobs da Terra Selvagem (Pedro, 25/11/2026): dinossauros (Vale da Cachoeira) e robôs do Pilaf (Descampado).
import { TIRANOSSAURO_PASSO } from './personagens/dinossauros/tiranossauro-andar.mjs';
import { TIRANOSSAURO_ATAQUE } from './personagens/dinossauros/tiranossauro-ataque.mjs';
import { TRICERATOPS_PASSO } from './personagens/dinossauros/triceratops-andar.mjs';
import { TRICERATOPS_ATAQUE } from './personagens/dinossauros/triceratops-ataque.mjs';
import { ESTEGOSSAURO_PASSO } from './personagens/dinossauros/estegossauro-andar.mjs';
import { ESTEGOSSAURO_ATAQUE } from './personagens/dinossauros/estegossauro-ataque.mjs';
import { ESPINOSSAURO_PASSO } from './personagens/dinossauros/espinossauro-andar.mjs';
import { ESPINOSSAURO_ATAQUE } from './personagens/dinossauros/espinossauro-ataque.mjs';
import { ROBO_PILAF_PASSO } from './personagens/robos-pilaf/robo-pilaf-andar.mjs';
import { ROBO_PILAF_SOCO } from './personagens/robos-pilaf/robo-pilaf-soco.mjs';
import { ROBO_PILAF_CANHAO } from './personagens/robos-pilaf/robo-pilaf-canhao.mjs';
import { ROBO_SHU_PASSO } from './personagens/robos-pilaf/robo-shu-andar.mjs';
import { ROBO_SHU_SOCO } from './personagens/robos-pilaf/robo-shu-soco.mjs';
import { ROBO_SHU_CANHAO } from './personagens/robos-pilaf/robo-shu-canhao.mjs';
import { ROBO_MAI_PASSO } from './personagens/robos-pilaf/robo-mai-andar.mjs';
import { ROBO_MAI_SOCO } from './personagens/robos-pilaf/robo-mai-soco.mjs';
import { ROBO_MAI_CANHAO } from './personagens/robos-pilaf/robo-mai-canhao.mjs';
import { MAQUINA_PILAF_PASSO } from './personagens/robos-pilaf/maquina-pilaf-andar.mjs';
import { YAMCHA_PASSO } from './personagens/yamcha/yamcha-andar.mjs';
import { YAMCHA_SOCO } from './personagens/yamcha/yamcha-soco.mjs';
import { YAMCHA_KI } from './personagens/yamcha/yamcha-ki.mjs';
import { MAQUINA_PILAF_SOCO } from './personagens/robos-pilaf/maquina-pilaf-soco.mjs';

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
const PASSO = { kaioken: FOLHAS_GOKU_KAIOKEN.andar, gokuSsj: FOLHAS_GOKU_SSJ.andar, gokuSsj2: FOLHAS_GOKU_SSJ2.andar, gokuSsj3: FOLHAS_GOKU_SSJ3.andar, gokuSsj4: FOLHAS_GOKU_SSJ4.andar, ...Object.fromEntries(Object.entries(FOLHAS_NAMEK_NORTE).map(([tipo,f])=>[tipo,f.andar])), goku: [GOKU_PASSO, 'gokuPasso'], ssj: [SSJ_PASSO, 'ssjPasso'], saibaman: [SAIBAMAN_PASSO, 'saibamanPasso'], alien: [SENTINELA_PASSO, 'sentinelaPasso'], guerreiro: [GUERREIRO_PASSO, 'guerreiroPasso'], veterano: [VETERANO_PASSO, 'veteranoPasso'], tsufuruGuerreiro: [TSUFURU_GUERREIRO_PASSO, 'tsufuruGuerreiroPasso'], tsufuruGeneral: [TSUFURU_GENERAL_PASSO, 'tsufuruGeneralPasso'], hatchiyack: [HATCHIYACK_PASSO, 'hatchiyackPasso'], nappa: [NAPPA_PASSO, 'nappaPasso'], raditz: [RADITZ_PASSO, 'raditzPasso'], bardock: [BARDOCK_PASSO, 'bardockPasso'], oozaru: [OOZARU_PASSO, 'oozaruPasso'], oozaruGuerreiro: [OOZARU_GUERREIRO_PASSO, 'oozaruGuerreiroPasso'], oozaruSuper: [OOZARU_SUPER_PASSO, 'oozaruSuperPasso'],
  freezaPe: [FREEZA_PE_PASSO, 'freezaPePasso'], freezaNave: [FREEZA_NAVE_PASSO, 'freezaNavePasso'], reiVegeta: [REI_VEGETA_PASSO, 'reiVegetaPasso'], broly: [BROLY_PASSO, 'brolyPasso'], oozaruDourado: [OOZARU_DOURADO_PASSO, 'oozaruDouradoPasso'], zarbon: [ZARBON_PASSO, 'zarbonPasso'], dodoria: [DODORIA_PASSO, 'dodoriaPasso'], tiranossauro: [TIRANOSSAURO_PASSO, 'tiranossauroPasso'], triceratops: [TRICERATOPS_PASSO, 'triceratopsPasso'], estegossauro: [ESTEGOSSAURO_PASSO, 'estegossauroPasso'], espinossauro: [ESPINOSSAURO_PASSO, 'espinossauroPasso'], roboPilaf: [ROBO_PILAF_PASSO, 'roboPilafPasso'], roboShu: [ROBO_SHU_PASSO, 'roboShuPasso'], roboMai: [ROBO_MAI_PASSO, 'roboMaiPasso'], maquinaPilaf: [MAQUINA_PILAF_PASSO, 'maquinaPilafPasso'], yamcha: [YAMCHA_PASSO, 'yamchaPasso'] };
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
  dodoria: [DODORIA_SOCO, 'dodoriaSoco'], dodoriaKi: [DODORIA_KI, 'dodoriaKi'],
  tiranossauro: [TIRANOSSAURO_ATAQUE, 'tiranossauroGolpe'],
  triceratops: [TRICERATOPS_ATAQUE, 'triceratopsGolpe'],
  estegossauro: [ESTEGOSSAURO_ATAQUE, 'estegossauroGolpe'],
  espinossauro: [ESPINOSSAURO_ATAQUE, 'espinossauroGolpe'],
  roboPilaf: [ROBO_PILAF_SOCO, 'roboPilafGolpe'], roboPilafKi: [ROBO_PILAF_CANHAO, 'roboPilafCanhao'],
  roboShu: [ROBO_SHU_SOCO, 'roboShuGolpe'], roboShuKi: [ROBO_SHU_CANHAO, 'roboShuCanhao'],
  roboMai: [ROBO_MAI_SOCO, 'roboMaiGolpe'], roboMaiKi: [ROBO_MAI_CANHAO, 'roboMaiCanhao'],
  maquinaPilaf: [MAQUINA_PILAF_SOCO, 'maquinaPilafGolpe'],
  yamcha: [YAMCHA_SOCO, 'yamchaGolpe'], yamchaKi: [YAMCHA_KI, 'yamchaKi'] };
function drawPasso(ctx, kind, pos, height, facing, moving, stride, phase = 0) {
  const [sheet, key] = PASSO[kind];
  const bob = moving ? walkBob(walkStep(pos.travelled || 0, stride, phase)) * height : 0;
  return drawSheet(ctx, sheet, art[key], pos, height, facing, passoFrame(pos.travelled || 0, stride, moving, sheet, phase), bob);
}
// Parado com folha PARADO (parado.mjs): respiração em loop pelo tempo (~3 quadros/s, como o Goku), com a fase
// de cada mob para o grupo não respirar junto, na mesma altura da caminhada. Sem `tempo`, cai no quadro parado
// da caminhada, como antes.
export function drawParado(ctx, kind, pos, height, facing, tempo, phase = 0) {
  const parado = PARADO[kind];
  if (!parado || !Number.isFinite(tempo)) return false;
  const [sheet, key] = parado;
  return drawSheet(ctx, sheet, art[key], pos, height, facing, Math.floor(tempo * 3 + phase * 4) % 4);
}
export function drawWalk(ctx, kind, pos, height, facing, moving, stride = 96, phase = 0, tempo = null) {
  if (!moving && drawParado(ctx, kind, pos, height, facing, tempo, phase)) return true;
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
