import { SHEET_VIEWS } from '../../art/sheet-views.mjs';
import { spriteFacing } from '../mapa/camera.mjs';
import { ANGRY_BOO, SUPERNOVA_BOO } from '../../shared/tecnicas/majin-boo.mjs';

// Posições no atlas original, esquerda/direita da cabeça, nos quadros de tensão,
// grito e recuperação. Linhas: S, SE, E, NE, N.
const porosSupernova = {
  base: [
    [[[366,80], [405,80]], [[617,78], [656,78]], [[873,80], [917,80]]],
    [[[390,378], [436,388]], [[644,383], [690,383]], [[892,378], [941,388]]],
    [[[385,683], [436,685]], [[631,685], [683,680]], [[883,685], [931,688]]],
    [[[368,983], [427,995]], [[631,992], [678,990]], [[890,985], [934,992]]],
    [[[354,1292], [417,1295]], [[607,1297], [678,1297]], [[863,1292], [926,1297]]],
  ],
  evilBoo: [
    [[[356,93], [407,93]], [[610,90], [663,90]], [[866,93], [919,93]]],
    [[[378,383], [429,385]], [[627,383], [683,383]], [[887,383], [944,390]]],
    [[[378,678], [419,685]], [[636,678], [675,683]], [[892,678], [931,683]]],
    [[[368,978], [414,987]], [[622,978], [675,983]], [[885,978], [929,987]]],
    [[[358,1290], [412,1290]], [[610,1287], [666,1290]], [[866,1287], [922,1287]]],
  ],
  superBoo: [
    [[[358,73], [397,76]], [[614,73], [658,71]], [[870,73], [912,76]]],
    [[[390,366], [434,371]], [[658,361], [695,368]], [[909,366], [953,373]]],
    [[[397,641], [432,649]], [[644,641], [675,646]], [[912,646], [948,651]]],
    [[[390,934], [432,939]], [[666,929], [702,934]], [[905,939], [946,944]]],
    [[[354,1241], [410,1243]], [[612,1241], [666,1241]], [[868,1239], [922,1243]]],
  ],
  buutenks: [
    [[[358,73], [405,76]], [[614,73], [661,73]], [[870,73], [917,73]]],
    [[[388,368], [429,373]], [[651,366], [688,368]], [[907,366], [948,373]]],
    [[[395,646], [429,653]], [[641,641], [680,644]], [[905,649], [941,653]]],
    [[[393,939], [427,948]], [[644,929], [685,934]], [[902,934], [944,944]]],
    [[[354,1241], [405,1243]], [[610,1241], [663,1243]], [[866,1241], [922,1243]]],
  ],
  buuhan: [
    [[[358,71], [410,71]], [[614,71], [661,71]], [[870,71], [922,71]]],
    [[[378,368], [427,371]], [[631,361], [683,368]], [[880,368], [936,375]]],
    [[[380,644], [424,651]], [[631,644], [675,646]], [[890,644], [931,649]]],
    [[[378,934], [427,944]], [[629,931], [685,939]], [[885,936], [934,946]]],
    [[[354,1241], [405,1243]], [[610,1241], [663,1243]], [[863,1239], [924,1243]]],
  ],
  kidBoo: [
    [[[361,102], [405,102]], [[614,105], [656,105]], [[870,102], [914,102]]],
    [[[373,383], [412,378]], [[634,385], [673,380]], [[892,383], [931,383]]],
    [[[383,670], [417,675]], [[644,670], [675,675]], [[900,670], [931,675]]],
    [[[378,958], [414,961]], [[634,956], [670,958]], [[892,958], [934,961]]],
    [[[356,1260], [410,1260]], [[612,1263], [666,1263]], [[868,1263], [924,1260]]],
  ],
};

const porosAngry = {
  base: [
    [[[356,88], [412,85]], [[612,85], [668,85]], [[868,73], [926,73]]],
    [[[390,385], [439,393]], [[644,380], [695,383]], [[895,373], [944,378]]],
    [[[385,690], [436,692]], [[631,683], [685,685]], [[885,670], [936,675]]],
    [[[373,987], [424,990]], [[624,978], [675,980]], [[868,946], [926,956]]],
    [[[349,1292], [417,1295]], [[605,1292], [673,1295]], [[861,1280], [922,1282]]],
  ],
  evilBoo: [
    [[[356,90], [407,90]], [[610,93], [666,90]], [[868,80], [922,83]]],
    [[[383,383], [432,388]], [[641,380], [688,383]], [[900,375], [944,378]]],
    [[[375,673], [419,678]], [[634,673], [673,673]], [[892,663], [936,666]]],
    [[[380,968], [424,980]], [[641,961], [680,970]], [[897,956], [931,961]]],
    [[[358,1282], [412,1285]], [[612,1285], [666,1285]], [[868,1285], [922,1285]]],
  ],
  superBoo: [
    [[[358,78], [402,78]], [[612,78], [666,78]], [[870,73], [919,73]]],
    [[[390,368], [439,375]], [[649,371], [692,375]], [[907,371], [951,375]]],
    [[[380,661], [422,663]], [[636,649], [675,653]], [[895,651], [934,656]]],
    [[[395,946], [432,948]], [[644,939], [685,944]], [[905,934], [941,936]]],
    [[[356,1260], [410,1263]], [[610,1260], [666,1260]], [[866,1260], [922,1263]]],
  ],
  buutenks: [
    [[[356,76], [407,76]], [[612,80], [666,80]], [[870,76], [922,76]]],
    [[[385,366], [434,373]], [[646,368], [690,373]], [[902,368], [951,373]]],
    [[[383,651], [424,658]], [[639,649], [675,653]], [[895,649], [934,656]]],
    [[[390,941], [432,948]], [[646,936], [683,941]], [[902,934], [941,941]]],
    [[[354,1256], [410,1256]], [[610,1258], [663,1258]], [[868,1256], [922,1256]]],
  ],
  buuhan: [
    [[[358,73], [412,73]], [[610,66], [666,68]], [[868,68], [919,68]]],
    [[[380,371], [434,375]], [[644,366], [690,371]], [[902,366], [948,371]]],
    [[[375,644], [424,653]], [[634,646], [675,651]], [[892,644], [934,653]]],
    [[[375,936], [427,946]], [[634,934], [683,941]], [[895,934], [941,941]]],
    [[[354,1243], [405,1243]], [[610,1243], [663,1243]], [[868,1243], [919,1243]]],
  ],
  kidBoo: [
    [[[358,110], [405,110]], [[610,110], [661,110]], [[868,112], [919,112]]],
    [[[380,388], [424,390]], [[644,388], [683,388]], [[905,393], [941,395]]],
    [[[378,668], [417,673]], [[639,670], [673,673]], [[902,670], [936,670]]],
    [[[378,963], [422,968]], [[639,965], [675,968]], [[905,965], [941,965]]],
    [[[356,1273], [410,1273]], [[610,1278], [663,1278]], [[868,1275], [922,1275]]],
  ],
};

const vaporPorAcao = {
  supernova: { poros: porosSupernova, carga: SUPERNOVA_BOO.carga, inicio: SUPERNOVA_BOO.carga - .52, grito: SUPERNOVA_BOO.carga - .23 },
  angry: { poros: porosAngry, carga: ANGRY_BOO.carga, inicio: .40, grito: .64 }
};
const DURACAO_DISSIPACAO = .32;

export function quadrosPreviaVaporBoo(acao) {
  const v = vaporPorAcao[acao];
  if (v) return [.10, v.grito - .045, v.carga - .04, v.carga + .15];
}

let imagem;
export function carregarVaporBoo() {
  if (imagem) return;
  imagem = new Image();
  imagem.src = '/assets/skills/majin-boo/supernova/vapor_rgba.png';
}

export function pontoDaPoseBoo(folha, pos, altura, direcao, coluna, ponto) {
  const { row, flip } = SHEET_VIEWS[spriteFacing(direcao)];
  const [sx, sy, , , ax, ay] = folha.frames[row][coluna];
  const escala = altura / folha.referenceHeight;
  return { x: Math.round(pos.x) + (sx + ponto[0] - ax) * escala * (flip ? -1 : 1),
    y: Math.round(pos.y) + (sy + ponto[1] - ay) * escala + 6 };
}

export function jatosVaporBoo({ acao, forma, folha, pos, altura, direcao, coluna, idade }) {
  const { row, flip } = SHEET_VIEWS[spriteFacing(direcao)];
  const vapor = vaporPorAcao[acao];
  const pontos = vapor?.poros?.[forma]?.[row]?.[coluna - 1];
  if (!pontos || idade < vapor.inicio || idade >= vapor.carga + DURACAO_DISSIPACAO) return [];

  const dissipando = idade >= vapor.carga;
  const gritando = idade >= vapor.grito;
  const tempoDispersao = Math.max(0, idade - vapor.carga);
  const quadro = dissipando ? 9 + Math.min(6, Math.floor(tempoDispersao * 7 / DURACAO_DISSIPACAO))
    : gritando ? 5 + Math.min(3, Math.floor((idade - vapor.grito) * 4 / (vapor.carga - vapor.grito)))
      : Math.min(4, Math.floor((idade - vapor.inicio) * 5 / (vapor.grito - vapor.inicio)));
  const [sx, sy] = folha.frames[row][coluna];
  const escala = altura * .002 * (gritando ? 1 : .85);
  const deriva = altura * tempoDispersao * .7;
  const opacidade = dissipando ? Math.max(0, 1 - tempoDispersao / DURACAO_DISSIPACAO) : 1;
  return pontos.map(([x, y], i) => {
    const local = pontoDaPoseBoo(folha, pos, altura, direcao, coluna, [x - sx, y - sy]);
    const lado = (i === 0 ? -1 : 1) * (flip ? -1 : 1);
    const angulo = lado * (row === 2 && i === 0 ? .96 : .76);
    const camada = row === 0 || row < 4 && i === 0 ? 'frente' : 'atras';
    return { local, angulo, camada, quadro, opacidade, escala, x: local.x + Math.sin(angulo) * deriva,
      y: local.y - Math.cos(angulo) * deriva };
  });
}

export function desenharVaporBoo(ctx, { camada, marcadores = false, ...estado }) {
  for (const jato of jatosVaporBoo(estado)) {
    if (jato.camada !== camada) continue;
    ctx.save();
    if (marcadores) {
      ctx.fillStyle = '#28f2e8';
      ctx.beginPath();
      ctx.arc(jato.local.x, jato.local.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (imagem?.complete && imagem.naturalWidth) {
      ctx.translate(jato.x, jato.y);
      ctx.rotate(jato.angulo);
      ctx.globalAlpha *= jato.opacidade;
      const { quadro, escala } = jato;
      ctx.drawImage(imagem, (quadro % 4) * 320, Math.floor(quadro / 4) * 320, 320, 320,
        -160 * escala, -271 * escala, 320 * escala, 320 * escala);
    }
    ctx.restore();
  }
}
