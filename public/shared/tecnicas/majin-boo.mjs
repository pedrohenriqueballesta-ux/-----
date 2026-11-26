import { KAME } from './kamehameha.mjs';

const tecnica = (id, nome, icone, parametros) => Object.freeze({
  id, nome, icone: '/assets/skills/majin-boo/majin_boo_' + icone + '.png', ...parametros
});

export const CLONES_BOO = tecnica('cloneSummoning', 'Invocação de Clones', 'clone_summoning', {
  nivel: 60, ki: 25, recarga: 45, carga: 1.2, materializa: .6, revela: .9, duracao: 20,
  vida: .12, dano: .12, defesa: .02, defesaMaxima: 1, alcanceSoco: 70, cadencia: .45,
  distanciaMaxima: 5 * KAME.tile, raioProtecao: 4 * KAME.tile,
  descricao: 'Os clones seguem o Boo e atacam o inimigo marcado por até 20 s.'
});
export const SUPERNOVA_BOO = tecnica('supernova', 'Supernova', 'supernova', {
  nivel: 100, ki: 20, recarga: 25, carga: 1.2, alcance: 6 * KAME.tile,
  duracao: 6, abertura: .5, fechamento: .5, pulsoInicial: .5, intervalo: 1, pulsos: 6,
  lentidao: .35, parada: .25 * KAME.tile, minimoCombo: 2,
  descricao: 'Abre um vórtice nos pés do alvo marcado. Puxa e desacelera inimigos e aplica até seis pulsos de dano.'
});
export const ANGRY_BOO = tecnica('angryExplosion', 'Angry Explosion', 'angry_explosion', {
  nivel: 100, ki: 30, recarga: 35, carga: 1, duracao: 1, explosao: .35,
  minimoCombo: 3,
  descricao: 'Causa uma explosão instantânea em todos os inimigos dentro do raio ao redor do Boo.'
});
export const TECNICAS_BOO = Object.freeze(Object.fromEntries(
  [CLONES_BOO, SUPERNOVA_BOO, ANGRY_BOO].map(t => [t.id, t])
));
// Forma ativa no instante da conjuração. Raios e atração são definidos em tiles.
const ESTAGIOS_BOO = Object.freeze(Object.fromEntries([
  // Forma        Clones  Stun (s)  Dano do raio  Raio Nova  Atração  Dano/pulso  Raio Angry  Dano Angry  Escala da fumaça
  ['base',          1,      1.4,       .18,         3,       .45,       .28,        4,        2.4,          .56],
  ['evilBoo',       1,      1.7,       .26,         4,       .7,        .4,         5,        3.2,          .68],
  ['superBoo',      2,      2,         .34,         4.5,     1,         .5,         5.5,      3.8,          .74],
  ['buutenks',      3,      2.3,       .42,         5,       1.3,       .6,         6,        4.5,          .8],
  ['buuhan',        4,      2.6,       .50,         5.5,     1.6,       .72,        6.5,      5.3,          .86],
  ['kidBoo',        5,      2.9,       .58,         6,       1.9,       .85,        7,        6.4,          .92]
].map(([forma, clones, stun, danoChocolate, raioNova, atracao, danoNova, raioAngry, danoAngry, escalaFumaca]) => [
  forma, Object.freeze({ clones, stun, danoChocolate, raioNova: raioNova * KAME.tile, atracao: atracao * KAME.tile,
    danoNova, raioAngry: raioAngry * KAME.tile, danoAngry, escalaFumaca })
])));
export const estagioTecnicasBoo = forma => Object.hasOwn(ESTAGIOS_BOO, forma) ? ESTAGIOS_BOO[forma] : ESTAGIOS_BOO.base;

export const custoTecnicaBoo = (tecnica, maxKi) => Math.ceil(maxKi * tecnica.ki / 100);
