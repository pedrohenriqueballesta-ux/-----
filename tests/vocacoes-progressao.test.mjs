import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCACOES, vocacaoDoPersonagem } from '../public/shared/sistemas/vocacoes.mjs';
import { CONFIG, lugar } from '../public/shared/nucleo/config.mjs';
import { createPlayer, xpForLevel, statsFor } from '../public/shared/nucleo/characters.mjs';
import { Game } from '../public/shared/nucleo/game.mjs';
import { perfilPersonagem } from '../public/shared/sistemas/perfil.mjs';

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

test('teto chega ao nível 1.000 e o progresso legado preserva nível e XP acumulado', () => {
  assert.equal(CONFIG.progression.nivelMaximo, 1000);
  const p = createPlayer('teste', 'Goku', { character: 'Goku', level: 1000, xp: 123456 });
  assert.equal(p.level, 1000);
  assert.equal(p.xp, 123456);
  assert.equal(p.vocacao, 'goku');
  assert.equal(p.character, 'Goku');
  const game = new Game({ now: 1000, populate: false });
  const conectado = game.addPlayer('max', 'Goku', { level: 1000, xp: 123456 });
  assert.deepEqual([game.snapshot(conectado.id).self.xp, game.snapshot(conectado.id).self.xpNext], [0, 0]);
  assert.deepEqual([perfilPersonagem(conectado).xp, perfilPersonagem(conectado).xpNext], [0, 0]);
  const salvo = createPlayer('antigo', 'Antigo', { level: 100, xp: xpForLevel(100) * 3 });
  assert.equal(salvo.level, 100);
  assert.equal(salvo.xp, xpForLevel(100) * 3, 'XP acumulado no antigo teto não é descartado');
});

test('curva preserva os níveis existentes e cresce até 1.000 sem saltos ou limites artificiais', () => {
  for (let level = 1; level <= 100; level++) assert.equal(xpForLevel(level), Math.round(30 * level ** 1.35));
  for (let level = 1; level < 1000; level++) assert.ok(xpForLevel(level + 1) > xpForLevel(level));
  assert.equal(xpForLevel(1000), 475468);
});

test('ganho de XP atravessa a fronteira 999→1.000 e para no nível máximo', () => {
  const game = new Game({ now: 1000, populate: false });
  const p = game.addPlayer('teste');
  game.levar(p, lugar('inicial'));
  p.level = CONFIG.progression.nivelMaximo - 1;
  p.stats = statsFor(p.level, p.vocacao);
  p.xp = xpForLevel(p.level) - 1;
  game.awardXp(p, 2);
  assert.equal(p.level, 1000);
  assert.equal(p.xp, 1);
  game.awardXp(p, 50000);
  assert.equal(p.level, 1000);
  assert.equal(p.xp, 1, 'o XP não cresce sem limite ao alcançar o teto');
});
