import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCACOES, vocacaoDoPersonagem } from '../public/shared/vocacoes.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';
import { createPlayer, xpForLevel, statsFor } from '../public/shared/characters.mjs';
import { Game } from '../public/shared/game.mjs';

test('o catálogo mantém apenas a vocação jogável atual e desconhecidas preservam o fallback Goku', () => {
  assert.deepEqual(Object.keys(VOCACOES), ['goku']);
  assert.equal(vocacaoDoPersonagem('vegeta').id, 'goku');
  assert.equal(vocacaoDoPersonagem({ vocacao: 'gohan' }).id, 'goku');
});

test('atributos de Goku seguem a configuração do catálogo sem alterar a curva atual', () => {
  assert.deepEqual(statsFor(1, 'goku'), {
    hp: 120, ki: 80, attack: 12, defense: 2, healing: 1, capacity: 20, lootChance: 0.35, mobility: 175
  });
  assert.deepEqual(statsFor(100, 'goku'), {
    hp: 2298, ki: 1070, attack: 289.2, defense: 2 + 99 * 0.65, healing: 8.92,
    capacity: 20 + 99 * 1.3, lootChance: 0.8, mobility: 235
  });
  assert.deepEqual(statsFor(100, 'vegeta'), statsFor(100, 'goku'));
});

test('teto atual continua 100 e personagem legado restaura no mesmo nível máximo', () => {
  assert.equal(CONFIG.progression.nivelMaximo, 100);
  const p = createPlayer('teste', 'Goku', { character: 'Goku', level: 1000 });
  assert.equal(p.level, 100);
  assert.equal(p.vocacao, 'goku');
  assert.equal(p.character, 'Goku');
});

test('ganho de XP não ultrapassa o teto atual nem muda a curva', () => {
  const game = new Game({ now: 1000, populate: false });
  const p = game.addPlayer('teste');
  game.levar(p, lugar('inicial'));
  p.level = CONFIG.progression.nivelMaximo;
  p.stats = statsFor(p.level, p.vocacao);
  p.xp = xpForLevel(p.level) - 1;
  game.awardXp(p, 2);
  assert.equal(p.level, 100);
  assert.equal(p.xp, xpForLevel(100) + 1);
});
