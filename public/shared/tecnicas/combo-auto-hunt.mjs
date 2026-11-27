import { CONFIG } from '../nucleo/config.mjs';
import { formasDaVocacao } from './formas.mjs';
import { TECNICAS_BOO, custoTecnicaBoo } from './majin-boo.mjs';
import { CHOCOLATE_BEAM } from './chocolate-beam.mjs';
import { GALICK } from './galick-gun.mjs';
import { RYUKEN } from './ryuken.mjs';
import { KAME, SUPER_KAME } from './kamehameha.mjs';

const ofensivas = {
  boo: ['chocolateBeam', ...Object.keys(TECNICAS_BOO)],
  vegeta: ['galick', 'finalFlash', 'bigBangAttack'],
  goku: ['kame', 'superKamehameha', 'ryuken', 'genki']
};
const custos = { ...CONFIG.skillCosts, galick: GALICK.custo, chocolateBeam:CHOCOLATE_BEAM.custo, ryuken: RYUKEN.custo, superKamehameha: SUPER_KAME.custo };

export const MAX_MINIMO_MOBS_COMBO = 4;
export const RAIO_MOBS_COMBO = 4 * KAME.tile;
export const minimoMobsPadrao = id => TECNICAS_BOO[id]?.minimoCombo ?? 1;

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
    if (linha.minMobs !== undefined &&
      (!Number.isInteger(linha.minMobs) || linha.minMobs < 1 || linha.minMobs > MAX_MINIMO_MOBS_COMBO)) return null;
    vistos.add(linha.id);
  }
  return { ordem: valor.ordem.map(({ id, ki, minMobs }) => minMobs === undefined ? { id, ki } : { id, ki, minMobs }), reserva: valor.reserva, buff: valor.buff, buffMaisAlto: valor.buffMaisAlto ?? false };
}

export function kiPermiteCombo(p, id, minimo = 0) {
  const custo = Object.hasOwn(TECNICAS_BOO, id) ? custoTecnicaBoo(TECNICAS_BOO[id], p.stats.ki) : custos[id];
  return p.ki >= p.stats.ki * minimo / 100 && p.ki - custo >= p.stats.ki * p.comboAutoHunt.reserva / 100;
}
