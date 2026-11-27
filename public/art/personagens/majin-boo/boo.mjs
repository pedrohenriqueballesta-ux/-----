import { drawSheet, SHEET_VIEWS } from '../../atlas.mjs';
import { spriteFacing, walkStep } from '../../../render/mapa/camera.mjs';
import { carregarVaporBoo, desenharVaporBoo, pontoDaPoseBoo } from '../../../render/vfx/boo-vapor.mjs';
import { FOLHAS_NOVAS_BOO } from './formas-boo.mjs';
import { FOLHAS_EVIL_BOO } from './evil-boo.mjs';
import { CLONES_BOO, SUPERNOVA_BOO, ANGRY_BOO } from '../../../shared/tecnicas/majin-boo.mjs';
import { FOLHAS_MAJIN_BOO } from './folhas.mjs';

const imagens = new Map();
export const ALTURA_BOO = 76;
const folhasPorForma = { base: FOLHAS_MAJIN_BOO, evilBoo: FOLHAS_EVIL_BOO, ...FOLHAS_NOVAS_BOO };
const alturas = { superBoo: 82, buutenks: 82, buuhan: 82, kidBoo: 59 };
export const folhasBoo = forma => folhasPorForma[forma] || FOLHAS_MAJIN_BOO;
export const alturaBoo = forma => alturas[forma] ?? ALTURA_BOO;
function imagemDaFolha(folha) {
  if (!imagens.has(folha.file)) {
    const imagem = new Image();
    imagem.src = folha.file;
    imagens.set(folha.file, imagem);
  }
  return imagens.get(folha.file);
}

export function carregarBoo(forma = 'base') {
  for (const folha of Object.values(folhasBoo(forma))) imagemDaFolha(folha);
  carregarVaporBoo();
}

export function colunaChocolate(carga, time) {
  return Math.min(1, Math.floor(Math.max(0, time - carga.started) * 5));
}

// Ponta da antena na terceira coluna da folha corporal, em coordenadas da célula
// na ordem S, SE, E, NE e N. O espelho usa o mesmo pivô de drawSheet.
const antenas = {
  base: [[167, 68], [215, 87], [228, 86], [215, 89], [95, 61]],
  evilBoo: [[138, 31], [227, 31], [232, 23], [225, 23], [73, 31]],
  superBoo: [[122, 25], [159, 25], [175, 25], [171, 24], [118, 23]],
  buutenks: [[131, 24], [109, 16], [174, 27], [174, 25], [120, 27]],
  buuhan: [[130, 69], [26, 90], [6, 130], [22, 151], [91, 166]],
  kidBoo: [[114, 28], [75, 14], [48, 23], [65, 17], [50, 17]]
};
const antenaKidDisparo = [[134, 32], [160, 26], [158, 24], [143, 16], [76, 20]];
export function pontaAntenaChocolate(pos, direcao, forma, tempoLancado = 0) {
  const { row } = SHEET_VIEWS[spriteFacing(direcao)];
  // O Kid só estende a antena para frente no quarto quadro; no Buuhan a ponta fica atrás.
  const quartoKid = forma === 'kidBoo' && tempoLancado >= .14;
  const ponto = (quartoKid ? antenaKidDisparo : antenas[forma] || antenas.base)[row];
  return pontoDaPoseBoo(folhasBoo(forma).chocolate, pos, alturaBoo(forma), direcao, quartoKid ? 3 : 2, ponto);
}

const tecnicasComVapor = {
  [SUPERNOVA_BOO.id]: { acao: 'supernova', carga: SUPERNOVA_BOO.carga },
  [ANGRY_BOO.id]: { acao: 'angry', carga: ANGRY_BOO.carga }
};

const palmas = {
  superBoo: [[37, 113], [143, 129], [182, 109], [186, 88]],
  buutenks: [[38, 115], [122, 133], [163, 111], [172, 94]],
  buuhan: [[43, 119], [142, 127], [186, 110], [195, 91]],
  kidBoo: [[36, 96], [129, 114], [150, 105], [161, 80]]
};

export function palmaRajadaBoo(pos, direcao, forma) {
  const { row } = SHEET_VIEWS[spriteFacing(direcao)];
  const ponto = palmas[forma]?.[row];
  // N mostra os braços de costas e oculta a palma. Mantém a origem visual convencional.
  return ponto ? pontoDaPoseBoo(folhasBoo(forma).rajada, pos, alturaBoo(forma), direcao, 2, ponto) : null;
}

export function drawBoo(ctx, player, pos, time, strikeProgress = null) {
  if (player.dead) return false;
  let acao = player.moving ? 'andar' : 'parado';
  let direcao = player.facing;
  let coluna = player.moving ? Math.floor(walkStep(pos.travelled ?? time * 96, 96) / 4) % 4 : Math.floor(time * 5) % 4;
  if (strikeProgress !== null) {
    acao = 'soco';
    coluna = Math.min(3, Math.floor(strikeProgress * 4));
  }
  if (player.rajadaStarted != null && time >= player.rajadaStarted && time - player.rajadaStarted < 0.36) {
    acao = 'rajada';
    coluna = Math.min(3, Math.floor((time - player.rajadaStarted) / .09));
  }
  if (player.charge?.chocolateBeam) {
    acao = 'chocolate';
    direcao = player.charge.direction;
    coluna = colunaChocolate(player.charge, time);
  } else if (player.chocolateLancado && time - player.chocolateLancado.started < .24) {
    acao = 'chocolate';
    direcao = player.chocolateLancado.direction;
    coluna = time - player.chocolateLancado.started < .14 ? 2 : 3;
  }
  const carga = player.charge;
  const disparo = player.booLancado;
  if (carga?.booTecnica) {
    direcao = carga.direction;
    const t = Math.max(0, time - carga.started);
    if (carga.booTecnica === CLONES_BOO.id) {
      acao = 'clones';
      coluna = t >= CLONES_BOO.materializa ? 3 : Math.min(2, Math.floor(t / .18));
    } else if (carga.booTecnica === SUPERNOVA_BOO.id) {
      acao = 'supernova';
      coluna = t < .16 ? 0 : t < SUPERNOVA_BOO.carga - .23 ? 1 : 2;
    } else {
      acao = 'angry';
      coluna = Math.min(2, Math.floor(t / .32));
    }
  } else if (disparo && time - disparo.started < .32 && !(disparo.tipo === SUPERNOVA_BOO.id && disparo.automated && player.moving)) {
    direcao = disparo.direction;
    acao = disparo.tipo === ANGRY_BOO.id ? 'angry' : 'supernova';
    coluna = acao === 'angry' || time - disparo.started >= .18 ? 3 : 2;
  }
  const folhas = folhasBoo(player.forma), altura = alturaBoo(player.forma);
  const folha = folhas[acao], imagem = imagemDaFolha(folha);
  const vaporDaCarga = tecnicasComVapor[carga?.booTecnica];
  const vaporDoDisparo = tecnicasComVapor[disparo?.tipo];
  const formaDoDisparo = disparo?.forma ?? player.forma;
  const vapor = vaporDaCarga
    ? { acao, forma: player.forma, folha, pos, altura, direcao, coluna, idade: time - carga.started }
    : vaporDoDisparo ? {
      acao: vaporDoDisparo.acao, forma: formaDoDisparo, folha: folhasBoo(formaDoDisparo)[vaporDoDisparo.acao],
      altura: alturaBoo(formaDoDisparo), direcao: disparo.direction, coluna: 3,
      pos: disparo.origem && Number.isFinite(player.x)
        ? { x: disparo.origem.x + (player.montaria ? pos.x - player.x : 0), y: disparo.origem.y + (player.montaria ? pos.y - player.y : 0) } : pos,
      idade: vaporDoDisparo.carga + time - disparo.started
    } : null;
  if (vapor) desenharVaporBoo(ctx, { ...vapor, camada: 'atras' });
  const desenhou = drawSheet(ctx, folha, imagem, pos, altura, direcao, coluna)
    || drawSheet(ctx, folhas.parado, imagemDaFolha(folhas.parado), pos, altura, direcao, 0)
    || drawSheet(ctx, FOLHAS_MAJIN_BOO.parado, imagemDaFolha(FOLHAS_MAJIN_BOO.parado), pos, ALTURA_BOO, direcao, 0);
  if (vapor) desenharVaporBoo(ctx, { ...vapor, camada: 'frente' });
  return desenhou;
}
