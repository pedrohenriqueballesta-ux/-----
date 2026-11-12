// Ryuken / Punho do Dragão: as três folhas de efeito da equipe (12/11/2026), só energia, apontando para a direita.
// Lançamento (pose + energia no punho, uma vez), voo (o dragão em loop, movido pelo servidor até o alvo) e impacto
// (explosão no alvo, uma vez). O jogo gira cada quadro para a direção; virado para a esquerda, espelha na vertical
// para o dragão não voar de cabeça para baixo. Apresentação apenas: alvo, dano e tempos vêm do servidor.
import { RYUKEN } from '../shared/ryuken.mjs';
import { KAME } from '../shared/kamehameha.mjs';

export const RYUKEN_ARTE = Object.freeze({
  // No molde do lançamento o Goku tem 200 px (com o cabelo) e o punho fica em (110, 128); no jogo o SSJ3 tem ~74:
  // escala 0,37 em todas as fases, para a cabeça do dragão manter o tamanho entre o lançamento e o voo.
  escala: 0.37,
  lancamento: { imagem: '/assets/skills/ryuken/lancamento/spritesheet.png', largura: 384, altura: 256, ancora: [110, 128] },
  voo: { imagem: '/assets/skills/ryuken/voo/spritesheet.png', largura: 384, altura: 192, ancora: [374, 72] },   // ponta do focinho
  impacto: { imagem: '/assets/skills/ryuken/impacto/spritesheet.png', largura: 256, altura: 256, ancora: [128, 128] }
});
const COLUNAS = 4;
const imagens = new Map();
export function carregarRyuken() {
  for (const fase of ['lancamento', 'voo', 'impacto']) if (!imagens.has(fase)) {
    const img = new Image(); img.src = RYUKEN_ARTE[fase].imagem; imagens.set(fase, img);
  }
}
// Quadro de cada fase pela idade; voo em loop, as outras uma vez (-1 quando acabou).
export function quadroRyuken(fase, idade) {
  if (!Number.isFinite(idade) || idade < 0) return -1;
  const q = Math.floor((idade + 1e-9) / RYUKEN.quadro);
  return fase === 'voo' ? q % RYUKEN.quadros : q < RYUKEN.quadros ? q : -1;
}
function desenharFase(ctx, fase, quadro, x, y, dx, dy) {
  carregarRyuken(); const img = imagens.get(fase), a = RYUKEN_ARTE[fase], e = RYUKEN_ARTE.escala;
  if (quadro < 0 || !img.complete || !img.naturalWidth) return false;
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx)); if (dx < 0) ctx.scale(1, -1);
  ctx.drawImage(img, quadro % COLUNAS * a.largura, Math.floor(quadro / COLUNAS) * a.altura, a.largura, a.altura,
    -a.ancora[0] * e, -a.ancora[1] * e, a.largura * e, a.altura * e);
  ctx.restore(); return true;
}
// Punho do jogador no mundo: o mesmo ponto de onde sai o Kamehameha.
export const punhoRyuken = (pos, d) => ({ x: pos.x + d.x * KAME.mao, y: pos.y + d.y * KAME.mao - KAME.alturaMao });

export function desenharLancamentoRyuken(ctx, jogador, pos, tempo) {
  const r = jogador?.ryuken; if (!r || jogador.dead) return false;
  const d = r.direction, punho = punhoRyuken(pos, d);
  return desenharFase(ctx, 'lancamento', quadroRyuken('lancamento', tempo - r.started), punho.x, punho.y, d.x, d.y);
}
export const desenharVooRyuken = (ctx, s, tempo, pos = s) => desenharFase(ctx, 'voo', quadroRyuken('voo', tempo - s.started), pos.x, pos.y, s.dx, s.dy);
export const desenharImpactoRyuken = (ctx, e, tempo) => desenharFase(ctx, 'impacto', quadroRyuken('impacto', tempo - e.started), e.x, e.y, e.dx, e.dy);
