// Registro de imagens (sprites e texturas). A arte é separada da simulação
// autoritativa, que vive em shared/.
import { FOLHAS_GOKU_KAIOKEN } from './goku-kaioken.mjs';
import { FOLHAS_GOKU_BASE } from './goku-base.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';
import { GOKU_PASSO } from './goku-passo.mjs';
import { SSJ_PASSO } from './ssj-passo.mjs';
import { GOKU_GOLPE } from './goku-golpe.mjs';
import { SSJ_GOLPE } from './ssj-golpe.mjs';
import { SAIBAMAN_PASSO } from './saibaman-passo.mjs';
import { SAIBAMAN_GOLPE } from './saibaman-golpe.mjs';
import { SENTINELA_PASSO } from './sentinela-passo.mjs';

const imageCache = new Map();
const loadImage = url => {
  if (!imageCache.has(url)) { const image = new Image(); image.src = url; imageCache.set(url, image); }
  return imageCache.get(url);
};
export const art = {
  ...Object.fromEntries([...Object.values(FOLHAS_GOKU_BASE), ...Object.values(FOLHAS_GOKU_KAIOKEN)].map(([folha,chave])=>[chave,loadImage(folha.file)])),
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
export const soloDe = mundo => art[mundo.solo] || loadImage(mundo.soloUrl);

// Verdadeiro quando a imagem já carregou e pode ser desenhada.
// Alguns mobs só têm as folhas novas: enquanto carregam, o atlas de reserva pode não existir.
// A ausência deve permitir o desenho provisório, sem interromper o próximo quadro do jogo.
export const loaded = image => Boolean(image?.complete && image.naturalWidth > 0);
