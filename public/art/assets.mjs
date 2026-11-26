// Registro de imagens (sprites e texturas). A arte é separada da simulação
// autoritativa, que vive em shared/.
import { FOLHAS_NAMEK_NORTE } from './cenario/namek-norte.mjs';
import { PARADO } from './parado.mjs';

import { FOLHAS_GOKU_KAIOKEN } from './personagens/goku/goku-kaioken.mjs';
import { FOLHAS_GOKU_SSJ } from './personagens/goku/goku-ssj.mjs';
import { FOLHAS_GOKU_SSJ2 } from './personagens/goku/goku-ssj2.mjs';
import { FOLHAS_GOKU_SSJ3 } from './personagens/goku/goku-ssj3.mjs';
import { GOKU_SSJ3_RYUKEN } from './personagens/goku/goku-ssj3-ryuken.mjs';
import { FOLHAS_GOKU_SSJ4 } from './personagens/goku/goku-ssj4.mjs';
import { FOLHAS_GOKU_BASE } from './personagens/goku/goku-base.mjs';
import { FOLHAS_GOKU_NATALINO } from './personagens/goku/goku-natalino.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';
import { GOKU_PASSO } from './personagens/goku/goku-passo.mjs';
import { SSJ_PASSO } from './ssj-passo.mjs';
import { GOKU_GOLPE } from './personagens/goku/goku-golpe.mjs';
import { SSJ_GOLPE } from './ssj-golpe.mjs';
import { SAIBAMAN_PASSO } from './personagens/saibaman/saibaman-passo.mjs';
import { SAIBAMAN_GOLPE } from './personagens/saibaman/saibaman-golpe.mjs';
import { SENTINELA_PASSO } from './personagens/sentinela/sentinela-passo.mjs';
import { FOLHAS_VEGETA_BASE, FOLHAS_VEGETA_SSJ1, FOLHAS_VEGETA_MAJIN, FOLHAS_VEGETA_SSJ4, FOLHAS_VEGETA_GOD, FOLHAS_VEGETA_BLUE, FOLHAS_VEGETA_ULTRA_EGO } from './personagens/vegeta/vegeta-folhas.mjs';

const imageCache = new Map();
const loadImage = url => {
  if (!imageCache.has(url)) { const image = new Image(); image.src = url; imageCache.set(url, image); }
  return imageCache.get(url);
};
export const art = {
  ...Object.fromEntries(Object.values(FOLHAS_NAMEK_NORTE).flatMap(Object.values).map(([folha,chave])=>[chave,loadImage(folha.file)])),
  ...Object.fromEntries([...Object.values(FOLHAS_GOKU_BASE), ...Object.values(FOLHAS_GOKU_NATALINO), ...Object.values(FOLHAS_GOKU_KAIOKEN), ...Object.values(FOLHAS_GOKU_SSJ), ...Object.values(FOLHAS_GOKU_SSJ2), ...Object.values(FOLHAS_GOKU_SSJ3), ...Object.values(FOLHAS_GOKU_SSJ4)].map(([folha,chave])=>[chave,loadImage(folha.file)])),
  gokuSsj3Ryuken: loadImage(GOKU_SSJ3_RYUKEN.file),
  ...Object.fromEntries(Object.values(PARADO).map(([folha,chave])=>[chave,loadImage(folha.file)])),
  ...Object.fromEntries([FOLHAS_VEGETA_BASE, FOLHAS_VEGETA_SSJ1, FOLHAS_VEGETA_MAJIN, FOLHAS_VEGETA_SSJ4,
    FOLHAS_VEGETA_GOD, FOLHAS_VEGETA_BLUE, FOLHAS_VEGETA_ULTRA_EGO]
    .flatMap(folhas => Object.values(folhas).map(([folha, chave]) => [chave, loadImage(folha.file)]))),
  nuvemTeleport: loadImage('/assets/teleports/nuvem.png'),
  goku: loadImage('/assets/goku-sheet.png'),
  tree: loadImage('/assets/tree.png'),
  rock: loadImage('/assets/rock.png'),
  alien: loadImage('/assets/alien.png'),
  vendor: loadImage('/assets/vendor.png'),
  saibaman: loadImage('/assets/saibaman.png'),
  freezaBoss: loadImage('/assets/freeza-boss.png'),
  freezaFrames: Array.from({ length: 16 }, (_, i) => loadImage('/assets/freeza/freeza_idle_view' + (Math.floor(i / 4) + 1) + '_frame' + ((i % 4) + 1) + '.png')),
  ...Object.fromEntries(Object.entries(SPRITE_DATA).map(([key, data]) => [key, loadImage(data.file)])),
  gokuPasso: loadImage(GOKU_PASSO.file),
  ssjPasso: loadImage(SSJ_PASSO.file),
  saibamanPasso: loadImage(SAIBAMAN_PASSO.file),
  saibamanGolpe: loadImage(SAIBAMAN_GOLPE.file),
  sentinelaPasso: loadImage(SENTINELA_PASSO.file),
  guerreiroPasso: loadImage('/assets/mobs/guerreiro-andar.png'),
  guerreiroGolpe: loadImage('/assets/mobs/guerreiro-soco.png'),
  veteranoPasso: loadImage('/assets/mobs/veterano-andar.png'),
  veteranoSoco: loadImage('/assets/mobs/veterano-soco.png'),
  veteranoKi: loadImage('/assets/mobs/veterano-ki.png'),
  tsufuruGuerreiroPasso: loadImage('/assets/mobs/tsufuru-guerreiro-andar.png'),
  tsufuruGuerreiroSoco: loadImage('/assets/mobs/tsufuru-guerreiro-soco.png'),
  tsufuruGuerreiroKi: loadImage('/assets/mobs/tsufuru-guerreiro-ki.png'),
  tsufuruGeneralPasso: loadImage('/assets/mobs/tsufuru-general-andar.png'),
  tsufuruGeneralSoco: loadImage('/assets/mobs/tsufuru-general-soco.png'),
  tsufuruGeneralKi: loadImage('/assets/mobs/tsufuru-general-ki.png'),
  hatchiyackPasso: loadImage('/assets/mobs/hatchiyack-andar.png'),
  hatchiyackSoco: loadImage('/assets/mobs/hatchiyack-soco.png'),
  hatchiyackKi: loadImage('/assets/mobs/hatchiyack-ki.png'),
  nappaPasso: loadImage('/assets/mobs/nappa-andar.png'),
  nappaSoco: loadImage('/assets/mobs/nappa-soco.png'),
  nappaKi: loadImage('/assets/mobs/nappa-ki.png'),
  raditzPasso: loadImage('/assets/mobs/raditz-andar.png'),
  raditzSoco: loadImage('/assets/mobs/raditz-soco.png'),
  raditzKi: loadImage('/assets/mobs/raditz-ki.png'),
  bardockPasso: loadImage('/assets/mobs/bardock-andar.png'),
  bardockSoco: loadImage('/assets/mobs/bardock-soco.png'),
  bardockKi: loadImage('/assets/mobs/bardock-ki.png'),
  oozaruPasso: loadImage('/assets/mobs/oozaru-andar.png'),
  oozaruSoco: loadImage('/assets/mobs/oozaru-soco.png'),
  oozaruKi: loadImage('/assets/mobs/oozaru-ki.png'),
  oozaruGuerreiroPasso: loadImage('/assets/mobs/oozaru-guerreiro-andar.png'),
  oozaruGuerreiroSoco: loadImage('/assets/mobs/oozaru-guerreiro-soco.png'),
  oozaruGuerreiroKi: loadImage('/assets/mobs/oozaru-guerreiro-ki.png'),
  oozaruSuperPasso: loadImage('/assets/mobs/oozaru-super-andar.png'),
  oozaruSuperSoco: loadImage('/assets/mobs/oozaru-super-soco.png'),
  oozaruSuperKi: loadImage('/assets/mobs/oozaru-super-ki.png'),
  freezaPePasso: loadImage('/assets/mobs/freeza-pe-andar.png'),
  freezaPeBeam: loadImage('/assets/mobs/freeza-pe-deathbeam.png'),
  freezaNavePasso: loadImage('/assets/mobs/freeza-nave-flutuar.png'),
  freezaNaveNova: loadImage('/assets/mobs/freeza-nave-supernova.png'),
  supernova: loadImage('/assets/mobs/freeza-supernova-bola.webp'),
  reiVegetaPasso: loadImage('/assets/mobs/rei-vegeta-andar.png'),
  reiVegetaSoco: loadImage('/assets/mobs/rei-vegeta-soco.png'),
  reiVegetaKi: loadImage('/assets/mobs/rei-vegeta-ki.png'),
  brolyPasso: loadImage('/assets/mobs/broly-andar.png'),
  brolySoco: loadImage('/assets/mobs/broly-soco.png'),
  brolyKi: loadImage('/assets/mobs/broly-ki.png'),
  oozaruDouradoPasso: loadImage('/assets/mobs/oozaru-dourado-andar.png'),
  oozaruDouradoPancada: loadImage('/assets/mobs/oozaru-dourado-pancada.png'),
  oozaruDouradoLaser: loadImage('/assets/mobs/oozaru-dourado-laser.png'),
  rachadura: loadImage('/assets/mobs/oozaru-dourado-rachadura.webp'),
  zarbonPasso: loadImage('/assets/mobs/zarbon-andar.png'),
  zarbonSoco: loadImage('/assets/mobs/zarbon-soco.png'),
  zarbonKi: loadImage('/assets/mobs/zarbon-ki.png'),
  dodoriaPasso: loadImage('/assets/mobs/dodoria-andar.png'),
  dodoriaSoco: loadImage('/assets/mobs/dodoria-soco.png'),
  dodoriaKi: loadImage('/assets/mobs/dodoria-ki.png'),
  tiranossauroPasso: loadImage('/assets/mobs/tiranossauro-andar.png'),
  tiranossauroGolpe: loadImage('/assets/mobs/tiranossauro-ataque.png'),
  triceratopsPasso: loadImage('/assets/mobs/triceratops-andar.png'),
  triceratopsGolpe: loadImage('/assets/mobs/triceratops-ataque.png'),
  estegossauroPasso: loadImage('/assets/mobs/estegossauro-andar.png'),
  estegossauroGolpe: loadImage('/assets/mobs/estegossauro-ataque.png'),
  espinossauroPasso: loadImage('/assets/mobs/espinossauro-andar.png'),
  espinossauroGolpe: loadImage('/assets/mobs/espinossauro-ataque.png'),
  roboPilafPasso: loadImage('/assets/mobs/robo-pilaf-andar.png'),
  roboPilafGolpe: loadImage('/assets/mobs/robo-pilaf-soco.png'),
  roboPilafCanhao: loadImage('/assets/mobs/robo-pilaf-canhao.png'),
  roboShuPasso: loadImage('/assets/mobs/robo-shu-andar.png'),
  roboShuGolpe: loadImage('/assets/mobs/robo-shu-soco.png'),
  roboShuCanhao: loadImage('/assets/mobs/robo-shu-canhao.png'),
  roboMaiPasso: loadImage('/assets/mobs/robo-mai-andar.png'),
  roboMaiGolpe: loadImage('/assets/mobs/robo-mai-soco.png'),
  roboMaiCanhao: loadImage('/assets/mobs/robo-mai-canhao.png'),
  maquinaPilafPasso: loadImage('/assets/mobs/maquina-pilaf-andar.png'),
  maquinaPilafGolpe: loadImage('/assets/mobs/maquina-pilaf-soco.png'),
  yamchaPasso: loadImage('/assets/mobs/yamcha-andar.png'),
  yamchaGolpe: loadImage('/assets/mobs/yamcha-soco.png'),
  yamchaKi: loadImage('/assets/mobs/yamcha-ki.png'),
  androide18Passo: loadImage('/assets/mobs/androide-18-andar.png'),
  androide18Golpe: loadImage('/assets/mobs/androide-18-soco.png'),
  androide18Ki: loadImage('/assets/mobs/androide-18-ki.png'),
  androide17Passo: loadImage('/assets/mobs/androide-17-andar.png'),
  androide17Golpe: loadImage('/assets/mobs/androide-17-soco.png'),
  androide17Ki: loadImage('/assets/mobs/androide-17-ki.png'),
  androide16Passo: loadImage('/assets/mobs/androide-16-andar.png'),
  androide16Golpe: loadImage('/assets/mobs/androide-16-soco.png'),
  androide16Ki: loadImage('/assets/mobs/androide-16-ki.png'),
  cellJrPasso: loadImage('/assets/mobs/cell-jr-andar.png'),
  cellJrGolpe: loadImage('/assets/mobs/cell-jr-soco.png'),
  cellJrKi: loadImage('/assets/mobs/cell-jr-ki.png'),
  cellImperfeitoPasso: loadImage('/assets/mobs/cell-imperfeito-andar.png'),
  cellImperfeitoGolpe: loadImage('/assets/mobs/cell-imperfeito-soco.png'),
  cellImperfeitoKi: loadImage('/assets/mobs/cell-imperfeito-ki.png'),
  c20Passo: loadImage('/assets/mobs/c20-andar.png'),
  c20Golpe: loadImage('/assets/mobs/c20-soco.png'),
  c20Ki: loadImage('/assets/mobs/c20-ki.png'),
  c20Absorcao: loadImage('/assets/mobs/c20-absorcao.png'),
  cellSemiperfeitoPasso: loadImage('/assets/mobs/cell-semiperfeito-andar.png'),
  cellSemiperfeitoGolpe: loadImage('/assets/mobs/cell-semiperfeito-soco.png'),
  cellSemiperfeitoKi: loadImage('/assets/mobs/cell-semiperfeito-ki.png'),
  cellSemiperfeitoCauda: loadImage('/assets/mobs/cell-semiperfeito-cauda.png'),
  gokuGolpe: loadImage(GOKU_GOLPE.file),
  ssjGolpe: loadImage(SSJ_GOLPE.file),
  passaro: loadImage('/assets/mobs/passaro.png'),
  passaroVoo: loadImage('/assets/mobs/passaro-voo.png'),
  passaroAtaque: loadImage('/assets/mobs/passaro-ataque.png'),
  inseto: loadImage('/assets/mobs/inseto.png'),
  insetoVoo: loadImage('/assets/mobs/inseto-voo.png'),
  porungaVoo: loadImage('/assets/mobs/porunga-voo.png'),
  porungaAtaque: loadImage('/assets/mobs/porunga-ataque.png'),
  bossVoo: loadImage('/assets/mobs/porunga-boss-voo.png'),
  bossAtaque: loadImage('/assets/mobs/porunga-boss-ataque.png'),
  namekSolo: loadImage('/assets/namek/solo.webp'),
  decoracao: loadImage('/assets/namek/decoracao.png'),
  namekCasas: Array.from({ length: 6 }, (_, i) => loadImage('/assets/namek/casas/casa_' + (i + 1) + '.png')),
  namekRuinas: Array.from({ length: 6 }, (_, i) => loadImage('/assets/namek/ruinas/ruina_' + (i + 1) + '.png')),
  grass: loadImage('/assets/grass.png'),
  earth: loadImage('/assets/earth.png')
};

// Objetos recortados do solo do Vegeta (árvores e cristais), carregados só quando aparecem na tela.
export const objetoVegeta = id => loadImage('/assets/vegeta/objetos/' + id + '.webp');

// Chão de um planeta (ficha em PLANETS): o de Namekusei carrega com o jogo; o dos outros planetas só quando
// alguém precisa dele (ao chegar lá, ou no menu Mapa), para não baixar ~16 MB a mais na entrada.
export const soloDe = (mundo, area = null) => {
  // Planeta com um chão por área (Terra Selvagem, Pedro 23/11/2026): só a imagem da área onde se está fica em memória.
  // Juntas num atlas, hub + Descampado + Deserto ocupariam ~290 MB decodificadas; separadas, no máximo ~180 MB (o Deserto).
  const s = area && mundo.soloPorArea?.[area];
  if (!s) return art[mundo.solo] || loadImage(mundo.soloUrl);
  const anterior = soloDaArea.get(mundo.id);
  if (anterior && anterior !== s.url) { const img = imageCache.get(anterior); if (img) img.src = ''; imageCache.delete(anterior); }
  soloDaArea.set(mundo.id, s.url);
  const img = loadImage(s.url); img.rect = s; return img;
};
const soloDaArea = new Map();

// Verdadeiro quando a imagem já carregou e pode ser desenhada.
// Alguns mobs só têm as folhas novas: enquanto carregam, o atlas de reserva pode não existir.
// A ausência deve permitir o desenho provisório, sem interromper o próximo quadro do jogo.
export const loaded = image => Boolean(image?.complete && image.naturalWidth > 0);
