import { CONFIG } from '../nucleo/config.mjs';
import { formasDaVocacao } from './formas.mjs';
import { GALICK } from './galick-gun.mjs';
import { RYUKEN } from './ryuken.mjs';
import { SUPER_KAME } from './kamehameha.mjs';

const ofensivas = {
  vegeta: ['galick', 'finalFlash', 'bigBangAttack'],
  goku: ['kame', 'superKamehameha', 'ryuken', 'genki']
};
const custos = { ...CONFIG.skillCosts, galick: GALICK.custo, ryuken: RYUKEN.custo, superKamehameha: SUPER_KAME.custo };

export const tecnicasDoCombo = vocacao => ofensivas[vocacao] || [];

export function comboPadrao(vocacao) {
  return { ordem: tecnicasDoCombo(vocacao).map(id => ({ id, ki: 0 })), reserva: 20, buff: null, buffMaisAlto: false };
}

const porcentagem = n => Number.isInteger(n) && n >= 0 && n <= 100;

export function validarCombo(valor, vocacao) {
  const tecnicas = tecnicasDoCombo(vocacao);
  if (!valor || !porcentagem(valor.reserva) || !Array.isArray(valor.ordem) || valor.ordem.length > tecnicas.length) return null;
  if (valor.buffMaisAlto !== undefined && typeof valor.buffMaisAlto !== 'boolean') return null;
  if (valor.buff !== null && !formasDaVocacao(vocacao).some(f => f.forma === valor.buff)) return null;
  const vistos = new Set();
  for (const linha of valor.ordem) {
    if (!linha || !tecnicas.includes(linha.id) || !porcentagem(linha.ki) || vistos.has(linha.id)) return null;
    vistos.add(linha.id);
  }
  return { ordem: valor.ordem.map(({ id, ki }) => ({ id, ki })), reserva: valor.reserva, buff: valor.buff, buffMaisAlto: valor.buffMaisAlto ?? false };
}

export function kiPermiteCombo(p, id, minimo = 0) {
  const custo = custos[id];
  return p.ki >= p.stats.ki * minimo / 100 && p.ki - custo >= p.stats.ki * p.comboAutoHunt.reserva / 100;
}
