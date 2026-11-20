import { KAME, estagioKame, geometriaKame } from '../../shared/tecnicas/kamehameha.mjs';
import { spriteFacing } from '../mapa/camera.mjs';
// Convenção de cinco linhas do atlas do Vegeta (a mesma tabela de
// personagens em art/atlas.mjs), mantida local para não carregar o catálogo de
// imagens no renderer de efeitos/testes Node.
const SHEET_VIEWS = [
  { row: 0, flip: false }, { row: 1, flip: false }, { row: 2, flip: false },
  { row: 3, flip: false }, { row: 4, flip: false }, { row: 3, flip: true },
  { row: 2, flip: true }, { row: 1, flip: true }
];

const PASTA = '/assets/skills/galick-gun/evolucoes/';
const MARCOS = [40, 80, 120, 160, 200];
const FOLHAS = [
  { arquivo: 'v1.png', largura: 457, altura: 234 },
  { arquivo: 'v2.png', largura: 457, altura: 234 },
  { arquivo: 'v3.png', largura: 430, altura: 248 },
  { arquivo: 'v4.png', largura: 457, altura: 234 },
  { arquivo: 'v5.png', largura: 457, altura: 234 },
];
const IMPACTO = { arquivo: 'impacto.png', largura: 326, altura: 326 };
const imagens = new Map();
function carregar(arquivo) {
  if (!imagens.has(arquivo)) {
    const imagem = new Image();
    imagem.src = PASTA + arquivo;
    imagens.set(arquivo, imagem);
  }
  const imagem = imagens.get(arquivo);
  return imagem.complete && imagem.naturalWidth ? imagem : null;
}

// Centro da palma na célula da folha 05_GALICK_GUN (256 × 307,2 px).
// Estes são pontos anatômicos, não offsets do feixe: a mesma palma é usada
// durante carga e disparo; só a arte do feixe muda de quadro. A conversão para
// o mundo repete exatamente a transformação de draw() em vegeta.mjs.
const PALMAS = [
  { x: 128, y: 190 }, // S
  { x: 174, y: 186 }, // SE
  { x: 193, y: 181 }, // E
  { x: 194, y: 177 }, // NE
  { x: 143, y: 180 }, // N
];
export function origemVisualGalick(pos, direcao) {
  const vista = SHEET_VIEWS[spriteFacing(direcao)];
  const ponto = PALMAS[vista.row];
  const escala = 70 / 307.2;
  return {
    x: pos.x + (ponto.x - 128) * escala * (vista.flip ? -1 : 1),
    y: pos.y + (ponto.y - 307.2) * escala + 6,
  };
}
export function estagioVisualGalick(nivel) {
  const estagio = estagioKame(nivel);
  return { ...FOLHAS[MARCOS.indexOf(estagio.nivel)], numero: MARCOS.indexOf(estagio.nivel) + 1,
    escala: estagio.escala * KAME.escalaVisual, alcance: estagio.alcance };
}
function quadro(ctx, imagem, folha, frame, x, y, largura, altura) {
  ctx.drawImage(imagem, frame % 4 * folha.largura, Math.floor(frame / 4) * folha.altura,
    folha.largura, folha.altura, x, y, largura, altura);
}

function feixe(ctx, imagem, folha, frame, distancia) {
  if (distancia <= 0) return false;
  const { largura: fw, altura: fh, escala } = folha;
  const origemFonte = Math.round(fw * .22), pontaFonte = Math.round(fw * .16);
  const origemNatural = origemFonte * escala, pontaNatural = pontaFonte * escala;
  // Preserva a origem e a ponta completas. Só uma coluna do núcleo central
  // preenche o percurso; repetir blocos largos da arte criava cortes visíveis.
  const ajuste = Math.min(1, distancia / (origemNatural + pontaNatural));
  const origem = origemNatural * ajuste, ponta = pontaNatural * ajuste;
  const altura = fh * escala;
  const meio = Math.max(0, distancia - origem - ponta);
  const sx = frame % 4 * fw, sy = Math.floor(frame / 4) * fh;
  // O núcleo branco do frame está na faixa central. Uma coluna de 2 px,
  // desenhada primeiro, liga as duas regiões sem costuras periódicas.
  if (meio > 0) ctx.drawImage(imagem, sx + Math.round(fw * .57), sy, 2, fh,
    origem - .5, -altura / 2, meio + 1, altura);
  ctx.drawImage(imagem, sx, sy, origemFonte, fh,
    0, -altura / 2, origem, altura);
  ctx.drawImage(imagem, sx + fw - pontaFonte, sy, pontaFonte, fh,
    origem + meio, -altura / 2, ponta, altura);
  return true;
}

export function desenharGalickComProfundidade(ctx, efeito, tempo, redesenharLancador = null) {
  const folha = estagioVisualGalick(efeito.nivel);
  const imagem = carregar(folha.arquivo), impacto = carregar(IMPACTO.arquivo);
  const direcao = efeito.visualDirection || efeito.direction || { x: 1, y: 0 };
  let desenhou = false;
  if (imagem) {
    ctx.save();
    ctx.translate(efeito.x, efeito.y);
    ctx.rotate(Math.atan2(direcao.y, direcao.x));
    ctx.imageSmoothingEnabled = true;
    if (efeito.until) {
      // A concentração começa somente na segunda metade da carga; não há efeito antes das mãos.
      const idade = tempo - efeito.started;
      if (idade >= 0) {
        const frame = Math.min(3, Math.floor(idade / KAME.quadro));
        const altura = folha.altura * folha.escala;
        // Os frames 0–3 trazem a esfera no centro da célula, não na borda.
        quadro(ctx, imagem, folha, frame, -folha.largura * .48 * folha.escala,
          -altura / 2, folha.largura * folha.escala, altura);
        desenhou = true;
      }
    } else {
      const geometria = geometriaKame(efeito.nivel, tempo - efeito.started);
      if (geometria) {
        const alcance = Math.max(0, geometria.alcance + (efeito.alcanceVisualExtra || 0));
        const contato = efeito.alvoDistancia ?? alcance;
        const distancia = Math.max(0, Math.min(alcance, contato));
        desenhou = feixe(ctx, imagem, folha, geometria.frame, distancia);
      }
    }
    ctx.restore();
  }
  if (impacto && efeito.impacto) {
    const idade = tempo - efeito.impacto.started;
    const frame = Math.floor(idade / KAME.quadro);
    if (frame >= 0 && frame < 16) {
      const tamanho = Math.max(96, folha.altura * folha.escala * 1.5);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      quadro(ctx, impacto, IMPACTO, frame,
        efeito.impacto.contatoX - tamanho / 2,
        efeito.impacto.contatoY - KAME.alturaMao - tamanho / 2,
        tamanho, tamanho);
      ctx.restore();
      desenhou = true;
    }
  }
  if (desenhou && direcao.y <= 0) redesenharLancador?.();
  return desenhou;
}
