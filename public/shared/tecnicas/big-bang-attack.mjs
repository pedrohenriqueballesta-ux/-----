import { CONFIG } from '../nucleo/config.mjs';
import { formaFinalFlash } from './final-flash.mjs';

export const BIG_BANG_ATTACK = Object.freeze({
  nivel: CONFIG.skills.bigBangAttack,
  custo: CONFIG.skillCosts.bigBangAttack,
  recarga: CONFIG.skillCooldowns.bigBangAttack,
  dano: 2.4,
  alcance: 440,
  carga: 0.55,
  velocidade: 850,
  poseDisparo: 0.24,
  impacto: 0.96,
  icone: '/assets/skills/big-bang-attack/icone.png'
});

export const formaBigBangAttack = formaFinalFlash;

// Deslocamento da palma nas linhas S, SE, E, NE, N da folha do Vegeta.
// O eixo X acompanha o mesmo espelhamento das poses de Oeste.
const PALMAS = [
  [[-9, -22], [-8, -23], [-10, -24]],
  [[-7, -24], [-4, -26], [4, -25]],
  [[-3, -25], [12, -29], [15, -30]],
  [[7, -28], [15, -35], [18, -36]],
  [[6, -30], [10, -33], [10, -34]]
];

export function colunaCargaBigBang(tempo, carga) {
  return 1 + Math.min(2, Math.max(0, Math.floor((tempo - carga.started) * 3 / BIG_BANG_ATTACK.carga)));
}

export function maoBigBang(pos, direcao, coluna = 3) {
  const linha = Math.round(Math.atan2(Math.abs(direcao.x), direcao.y) / (Math.PI / 4));
  const [dx, dy] = PALMAS[linha][coluna - 1];
  const avanco = direcao.y * 13;
  return { x: pos.x + dx * (direcao.x < 0 ? -1 : 1), y: pos.y + avanco, altura: avanco - dy };
}
