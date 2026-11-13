// Ryuken / Punho do Dragão — arte v2 da equipe (12/11/2026, alta qualidade, PNGs com brilho suave): quatro folhas de
// 16 quadros a 60 ms, só energia, apontando para a direita. Aura (meias-luas em órbita em volta do Goku enquanto ele
// carrega), lançamento (redemoinho e esfera no punho de onde o dragão nasce), voo (o dragão em loop, movido pelo
// servidor até o alvo, perto ou longe) e impacto (explosão no alvo). O jogo gira cada quadro para a direção; virado
// para a esquerda espelha na vertical para o dragão não voar de cabeça para baixo. Apresentação apenas.
import { RYUKEN } from '../shared/ryuken.mjs';
import { KAME } from '../shared/kamehameha.mjs';

// Escalas medidas nos moldes: no lançamento o Goku SSJ3 tinha 400 px e na aura 500 px (com o cabelo); no jogo ~74.
// O voo e o impacto usam a escala do lançamento, para a cabeça do dragão manter o tamanho entre as fases.
const ESCALA = 74 / 400;
export const RYUKEN_ARTE = Object.freeze({
  aura: { imagem: '/assets/skills/ryuken/aura/spritesheet.png', largura: 512, altura: 768, ancora: [256, 688], escala: 74 / 500 },
  lancamento: { imagem: '/assets/skills/ryuken/lancamento/spritesheet.png', largura: 768, altura: 512, ancora: [220, 256], escala: ESCALA },
  voo: { imagem: '/assets/skills/ryuken/voo/spritesheet.png', largura: 768, altura: 384, ancora: [707, 171], escala: ESCALA },   // ponta do focinho
  impacto: { imagem: '/assets/skills/ryuken/impacto/spritesheet.png', largura: 512, altura: 512, ancora: [256, 256], escala: ESCALA }
});
const COLUNAS = 4;
const imagens = new Map();
export function carregarRyuken() {
  for (const fase of Object.keys(RYUKEN_ARTE)) if (!imagens.has(fase)) {
    const img = new Image(); img.src = RYUKEN_ARTE[fase].imagem; imagens.set(fase, img);
  }
}
// Quadro de cada fase pela idade; voo em loop, as outras uma vez (-1 quando acabou).
export function quadroRyuken(fase, idade) {
  if (!Number.isFinite(idade) || idade < 0) return -1;
  const q = Math.floor((idade + 1e-9) / RYUKEN.quadro);
  return fase === 'voo' ? q % RYUKEN.quadros : q < RYUKEN.quadros ? q : -1;
}
function desenharFase(ctx, fase, quadro, x, y, dx, dy, girar = true) {
  carregarRyuken(); const img = imagens.get(fase), a = RYUKEN_ARTE[fase], e = a.escala;
  if (quadro < 0 || !img.complete || !img.naturalWidth) return false;
  ctx.save(); ctx.translate(x, y);
  if (girar) { ctx.rotate(Math.atan2(dy, dx)); if (dx < 0) ctx.scale(1, -1); } else if (dx < 0) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, quadro % COLUNAS * a.largura, Math.floor(quadro / COLUNAS) * a.altura, a.largura, a.altura,
    -a.ancora[0] * e, -a.ancora[1] * e, a.largura * e, a.altura * e);
  ctx.restore(); return true;
}
// Punho do jogador no mundo: o mesmo ponto de onde sai o Kamehameha.
export const punhoRyuken = (pos, d) => ({ x: pos.x + d.x * KAME.mao, y: pos.y + d.y * KAME.mao - KAME.alturaMao });

// Aura em volta do corpo (presa nos pés; não gira, só espelha quando ele olha para a esquerda).
export function desenharAuraRyuken(ctx, jogador, pos, tempo) {
  const r = jogador?.ryuken; if (!r || jogador.dead) return false;
  return desenharFase(ctx, 'aura', quadroRyuken('aura', tempo - r.started), pos.x, pos.y, r.direction.x, r.direction.y, false);
}
export function desenharLancamentoRyuken(ctx, jogador, pos, tempo) {
  const r = jogador?.ryuken; if (!r || jogador.dead) return false;
  const d = r.direction, punho = punhoRyuken(pos, d);
  return desenharFase(ctx, 'lancamento', quadroRyuken('lancamento', tempo - r.started), punho.x, punho.y, d.x, d.y);
}
export const desenharVooRyuken = (ctx, s, tempo, pos = s) => desenharFase(ctx, 'voo', quadroRyuken('voo', tempo - s.started), pos.x, pos.y, s.dx, s.dy);
export const desenharImpactoRyuken = (ctx, e, tempo) => desenharFase(ctx, 'impacto', quadroRyuken('impacto', tempo - e.started), e.x, e.y, e.dx, e.dy);
