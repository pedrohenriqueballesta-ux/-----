import { FINAL_FLASH } from '../../shared/tecnicas/final-flash.mjs';
import { desenharFeixeSegmentado } from './feixe-segmentado.mjs';
import { spriteFacing } from '../mapa/camera.mjs';

const pasta = '/assets/skills/final-flash/';
let feixe, explosao;
const largura = 362, altura = 271;
// Limites da energia visível em cada célula, com margeamento no recorte.
const limites = [
  [143, 99, 221, 189], [104, 57, 244, 209], [77, 54, 282, 247], [37, 23, 318, 254],
  [39, 75, 189, 202], [15, 61, 265, 212], [14, 61, 319, 211], [10, 58, 360, 217],
  [7, 33, 361, 197], [0, 42, 361, 195], [0, 33, 361, 195], [4, 41, 360, 194],
  [8, 47, 360, 195], [12, 54, 332, 184], [19, 55, 322, 190], [22, 57, 298, 186]
];
const recortes = limites.map(([esq, topo, dir, base], i) => {
  const x = Math.max(0, esq - 8), y = Math.max(0, topo - 8);
  return { x: i % 4 * largura + x, y: Math.floor(i / 4) * altura + y,
    largura: Math.min(largura, dir + 9) - x, altura: Math.min(altura, base + 9) - y };
});

function carregar(nome) {
  const imagem = new Image();
  imagem.src = pasta + nome;
  return imagem;
}

export function carregarFinalFlash() {
  feixe ??= carregar('feixe.png');
  explosao ??= carregar('impacto.png');
}

function quadroFeixe(efeito, idade, desdeImpacto) {
  if (idade < 0) return -1;
  if (efeito.carga) return Math.min(3, Math.floor(idade * 4 / FINAL_FLASH.carga));
  if (desdeImpacto >= FINAL_FLASH.sustentacao) {
    const fase = (desdeImpacto - FINAL_FLASH.sustentacao) / FINAL_FLASH.dissipacao;
    return fase >= 1 ? -1 : 12 + Math.floor(fase * 4);
  }
  if (idade < FINAL_FLASH.disparo) return 4 + Math.floor(idade * 4 / FINAL_FLASH.disparo);
  return 8 + Math.floor((idade - FINAL_FLASH.disparo) * 16) % 4;
}

// Posição em tela das mãos por vista de Vegeta, no mesmo espelho do corpo.
const pesParaMaos = [[0, -25], [-9, -26], [-13, -28], [-10, -30], [0, -29], [10, -30], [13, -28], [9, -26]];
export function maoVisualFinalFlash(pos, direcao, carga = false) {
  const [dx, dy] = pesParaMaos[spriteFacing(direcao)];
  const frente = carga ? 12 : 0;
  return { x: pos.x + dx + direcao.x * frente, y: pos.y + dy + direcao.y * frente };
}

export function desenharFinalFlash(ctx, efeito, tempo, mao, pesAlvo) {
  carregarFinalFlash();
  if (!feixe.complete || !feixe.naturalWidth) return false;
  const idade = tempo - efeito.started;
  const desdeImpacto = efeito.impacto ? tempo - efeito.impacto.started : -1;
  const quadro = quadroFeixe(efeito, idade, desdeImpacto);
  if (quadro < 0) return false;
  const q = recortes[quadro];
  ctx.save();
  ctx.translate(mao.x, mao.y);
  ctx.imageSmoothingEnabled = true;
  if (efeito.carga) {
    const escala = .15;
    const w = q.largura * escala, h = q.altura * escala;
    ctx.drawImage(feixe, q.x, q.y, q.largura, q.altura, -w / 2, -h / 2, w, h);
  } else {
    const distancia = efeito.impacto?.distancia ?? efeito.distanciaPrevista;
    if (distancia > 0 && idade > 0) {
      const { direction } = efeito;
      const progresso = efeito.impacto ? 1 : Math.min(1, idade * FINAL_FLASH.velocidade / distancia);
      // A distância do servidor controla o avanço. A ponta visual encontra o centro da explosão.
      const destino = pesAlvo ?? efeito.impacto?.pesAlvo ?? efeito.pesAlvoPrevisto ?? {
        x: efeito.x + direction.x * distancia,
        y: efeito.y + direction.y * distancia - FINAL_FLASH.alturaMao
      };
      const dx = destino.x - mao.x, dy = destino.y - mao.y;
      const escala = .24;
      ctx.rotate(Math.atan2(dy, dx));
      if (desdeImpacto > FINAL_FLASH.sustentacao)
        ctx.globalAlpha *= Math.max(0, 1 - (desdeImpacto - FINAL_FLASH.sustentacao) / FINAL_FLASH.dissipacao);
      desenharFeixeSegmentado(ctx, feixe, q, escala, Math.hypot(dx, dy) * progresso, q.altura * escala);
    }
  }
  ctx.restore();
  return true;
}

export function desenharImpactoFinalFlash(ctx, impacto, tempo, pesAlvo = impacto.pesAlvo) {
  carregarFinalFlash();
  const quadro = Math.floor((tempo - impacto.started) / FINAL_FLASH.impactoQuadro + 1e-8);
  if (quadro < 0 || quadro >= FINAL_FLASH.impactoQuadros || !explosao.complete || !explosao.naturalWidth)
    return false;
  const largura = 512, altura = 320, escala = .47;
  const w = largura * escala, h = altura * escala;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(explosao, quadro % 4 * largura, Math.floor(quadro / 4) * altura, largura, altura,
    pesAlvo.x - w / 2, pesAlvo.y - h / 2, w, h);
  ctx.restore();
  return true;
}
