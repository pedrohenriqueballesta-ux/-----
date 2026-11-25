import { CONFIG } from '../nucleo/config.mjs';

// XP necessário para passar do nível informado para o próximo.
// A curva de 1–100 é mantida por compatibilidade com o progresso já acumulado.
export function xpForLevel(level) {
  const nivel = Math.max(1, Math.floor(Number(level) || 1));
  const curva = CONFIG.progression.curvaXP;
  if (nivel <= curva.preservarAteNivel) {
    return Math.round(curva.coeficiente * Math.pow(nivel, curva.expoentePreservado));
  }
  const base = curva.coeficiente * Math.pow(curva.preservarAteNivel, curva.expoentePreservado);
  return Math.round(base * Math.pow(nivel / curva.preservarAteNivel, curva.expoenteAvancado));
}

// Perde níveis inteiros e transporta a porcentagem da barra de XP para o nível de destino.
export function progressoAposMorte(nivel, xp) {
  if (nivel <= 1) return { nivel: 1, xp: 0, perda: xp };
  const { niveisPorFaixa } = CONFIG.progression.perdaXpMorte;
  const destino = Math.max(1, nivel - 1 - Math.floor((nivel - 1) / niveisPorFaixa));
  const fracao = Math.min(xp / xpForLevel(nivel), 1 - 1 / xpForLevel(nivel));
  const xpRestante = Math.floor(fracao * xpForLevel(destino));
  let perda = xp - xpRestante;
  for (let n = destino; n < nivel; n++) perda += xpForLevel(n);
  return { nivel: destino, xp: xpRestante, perda };
}

// Mobs abaixo do jogador continuam rendendo XP, em escala progressiva e sem corte abrupto.
export function fatorXPPorDiferencaNivel(nivelJogador, nivelMob) {
  const diferenca = Math.max(0, Math.floor(Number(nivelJogador) || 1) - Math.floor(Number(nivelMob) || 1));
  const regra = CONFIG.progression.penalidadeXP;
  return Math.max(regra.minimo, Math.pow(1 + diferenca / regra.escalaDiferenca, -regra.expoente));
}

export function xpAjustadoPorNivel(xpBase, nivelJogador, nivelMob) {
  const xp = Number(xpBase);
  if (!Number.isFinite(xp) || xp <= 0) return 0;
  return Math.max(1, Math.round(xp * fatorXPPorDiferencaNivel(nivelJogador, nivelMob)));
}
