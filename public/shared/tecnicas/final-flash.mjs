import { CONFIG } from '../nucleo/config.mjs';
import { FORMAS } from './formas.mjs';

export const FINAL_FLASH = Object.freeze({
  nivel: CONFIG.skills.finalFlash,
  custo: CONFIG.skillCosts.finalFlash,
  recarga: CONFIG.skillCooldowns.finalFlash,
  carga: 1,
  alcance: 416,
  dano: 4,
  velocidade: 1600,
  disparo: .20,
  sustentacao: .60,
  dissipacao: .24,
  impactoQuadros: 16,
  impactoQuadro: .065,
  mao: 19,
  alturaMao: 29,
  icone: '/assets/skills/final-flash/icone.png'
});

const formas = new Set(FORMAS.filter(f => f.vocacoes?.includes('vegeta')).map(f => f.forma));
export const formaFinalFlash = forma => formas.has(forma);

export function origemFinalFlash(p, direcao, ateContato = FINAL_FLASH.mao) {
  const mao = Math.min(FINAL_FLASH.mao, ateContato);
  return { x: p.x + direcao.x * mao, y: p.y + direcao.y * mao };
}

// Entrada do raio no círculo de colisão do mob, medida desde a mão.
export function contatoFinalFlash(origem, direcao, alvo, raio) {
  const dx = alvo.x - origem.x, dy = alvo.y - origem.y;
  const frente = dx * direcao.x + dy * direcao.y;
  const lateral = dx * direcao.y - dy * direcao.x;
  const dentro = raio * raio - lateral * lateral;
  if (dentro < 0) return Infinity;
  const metade = Math.sqrt(dentro);
  return frente + metade < 0 ? Infinity : Math.max(0, frente - metade);
}

export function colunaPoseFinalFlash(efeito, tempo) {
  if (!efeito) return null;
  if (efeito.carga) return Math.min(2, Math.max(0, Math.floor((tempo - efeito.started) / FINAL_FLASH.carga * 3)));
  if (efeito.impacto && tempo - efeito.impacto.started >= FINAL_FLASH.sustentacao) return null;
  // No quarto quadro as mãos se juntam na direção do feixe.
  return 3;
}
