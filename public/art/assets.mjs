// Registro de imagens (sprites e texturas). A arte é separada da simulação
// autoritativa, que vive em shared/.
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
export const loaded = image => image.complete && image.naturalWidth > 0;
