import { CONFIG } from '../nucleo/config.mjs';
import { ESTAGIOS_KAME } from './kamehameha.mjs';

export const GALICK = Object.freeze({
  quadro: 1 / 12, duracao: 2, carga: .65, mao: 20, alturaMao: 28,
  custo: CONFIG.skillCosts.galick, recarga: CONFIG.skillCooldowns.galick,
  dano: 1.5, velocidade: 560, vooMinimo: .34,
  impactoQuadros: 16, impactoQuadro: .09, sustentacaoContato: .24, dissipacao: 4 / 12
});

export const ESTAGIOS_GALICK = Object.freeze(ESTAGIOS_KAME.map(({ nivel, alcance }, i) =>
  Object.freeze({ versao: i + 1, nivel, alcance })));

export const estagioGalick = nivel => ESTAGIOS_GALICK.findLast(estagio => nivel >= estagio.nivel);

export function origemGalick(p, direcao, ateContato = GALICK.mao) {
  const mao = Math.min(GALICK.mao, ateContato);
  return { x: p.x + direcao.x * mao, y: p.y + direcao.y * mao };
}

export function quadroGalick(fase, idade, duracao = 4 * GALICK.quadro) {
  if (idade < 0) return -1;
  if (fase === 'sustentacao') return 8 + Math.floor(idade / GALICK.quadro + 1e-8) % 4;
  if (fase === 'dissipacao' && idade >= duracao) return -1;
  const quadro = Math.min(3, Math.floor(idade * 4 / duracao + 1e-8));
  return (fase === 'disparo' ? 4 : fase === 'dissipacao' ? 12 : 0) + quadro;
}

export function colunaPoseGalick(efeito, tempo) {
  if (!efeito) return null;
  if (efeito.castStarted === undefined) {
    const progresso = (tempo - efeito.started) / GALICK.carga;
    return progresso < .25 ? 0 : progresso < .6 ? 1 : 2;
  }
  if (efeito.impacto && tempo - efeito.impacto.started >= GALICK.sustentacaoContato + GALICK.dissipacao) return null;
  return 3;
}
