import { SHEET_VIEWS } from '../../art/sheet-views.mjs';
import { spriteFacing } from '../mapa/camera.mjs';

// Coordenadas do poro nas quatro poses de Supernova, nas direções S, SE, E e NE.
// A vista N não tem orifícios visíveis. As direções da esquerda espelham a pose.
const poros = {
  base: [
    [[[112, 84], [152, 82]], [[110, 81], [149, 81]], [[107, 79], [145, 78]], [[109, 81], [150, 79]]],
    [[[135, 69]], [[146, 69]], [[147, 80]], [[136, 67]]],
    [[[130, 52]], [[132, 55]], [[122, 57]], [[118, 58]]],
    [[[132, 42]], [[134, 45]], [[124, 51]], [[134, 48]]],
    [[], [], [], []]
  ],
  superBoo: [
    [[[53, 57], [87, 58]], [[58, 55], [93, 55]], [[63, 54], [97, 51]], [[55, 55], [88, 56]]],
    [[[90, 45]], [[94, 49]], [[102, 44]], [[95, 49]]],
    [[[74, 42]], [[79, 40]], [[78, 34]], [[73, 44]]],
    [[[104, 45]], [[107, 45]], [[117, 33]], [[105, 45]]],
    [[], [], [], []]
  ]
};

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

export function desenharVaporBoo(ctx, { forma, folha, pos, altura, direcao, coluna, idade, camada, origemFixa = pos, marcadores = false }) {
  const { row, flip } = SHEET_VIEWS[spriteFacing(direcao)];
  const pontos = poros[forma]?.[row];
  if (!pontos) return;
  const espelho = flip ? -1 : 1;
  for (const [i, ponto] of pontos[coluna].entries()) {
    const frente = row === 0 || i === 0 && row < 3;
    if (camada !== (frente ? 'frente' : 'atras')) continue;
    const local = pontoDaPoseBoo(folha, pos, altura, direcao, coluna, ponto);
    if (marcadores) {
      ctx.save();
      ctx.fillStyle = '#28f2e8';
      ctx.beginPath();
      ctx.arc(local.x, local.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    const t = idade - .20 - i * .07;
    if (t < 0 || t >= .8 || !imagem?.complete || !imagem.naturalWidth) continue;
    const frame = Math.floor(t / .05);
    // Depois de expandir, a nuvem conserva o poro da pose de tensão e se afasta.
    const deriva = Math.max(0, t - .45) * altura * .44;
    const origem = deriva ? pontoDaPoseBoo(folha, origemFixa, altura, direcao, 1, pontos[1][i]) : local;
    const angulo = (row === 0 ? (i === 0 ? -.51 : .51) : row === 3 ? -.43 : .45) * espelho;
    const escala = altura * (forma === 'base' ? .00125 : .0011) * (i ? .9 : 1);
    ctx.save();
    ctx.translate(origem.x + Math.sin(angulo) * deriva, origem.y - Math.cos(angulo) * deriva);
    ctx.rotate(angulo);
    ctx.globalAlpha *= Math.min(1, (.8 - t) / .18);
    ctx.drawImage(imagem, (frame % 4) * 320, Math.floor(frame / 4) * 320, 320, 320,
      -160 * escala, -271 * escala, 320 * escala, 320 * escala);
    ctx.restore();
  }
}
