import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, PORTAIS, PLANETS, lugar } from '../public/shared/nucleo/config.mjs';
import { mobStats, spawnPoints } from '../public/shared/nucleo/enemies.mjs';
import { xpAjustadoPorNivel, fatorXPPorDiferencaNivel } from '../public/shared/sistemas/progressao.mjs';
import { statsFor, xpForLevel } from '../public/shared/nucleo/characters.mjs';

test('todas as hunts atuais têm nível recomendado e cada mob tem nível de referência próprio', () => {
  const hunts = [...PLANETS.namek.hunts, ...PLANETS.vegeta.hunts];
  assert.equal(hunts.length, 9);
  for (const area of hunts) {
    const faixa = lugar(area).nivel;
    assert.ok(faixa[0] >= 1 && faixa[1] <= 150 && faixa[0] < faixa[1], area);
  }
  for (const spawn of spawnPoints(() => 0.5)) {
    const mob = mobStats(spawn.type, spawn.area);
    assert.ok(Number.isInteger(mob.level) && mob.level >= 1 && mob.level <= 150, spawn.area + ':' + spawn.type);
  }
});

test('XP de mobs iguais ao nível mantém recompensa integral; diferença reduz sem zerar', () => {
  assert.equal(fatorXPPorDiferencaNivel(20, 20), 1);
  assert.equal(xpAjustadoPorNivel(100, 60, 60), 100);
  assert.equal(xpAjustadoPorNivel(100, 70, 10), 71);
  assert.ok(fatorXPPorDiferencaNivel(1000, 60) >= CONFIG.progression.penalidadeXP.minimo);
  assert.ok(xpAjustadoPorNivel(100, 1000, 60) > 0, 'hunt antiga segue útil para XP');
  assert.equal(xpAjustadoPorNivel(0, 100, 1), 0);
});

test('recompensa de abate usa o nível da criatura e continua no servidor', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
  const p = game.addPlayer('xp', 'Teste', { level: 50 });
  game.levar(p, lugar('vegeta-planicies')); p.x += 180; p.seguroAte = 0;
  const mob = game.addMob('tsufuruGuerreiro', p.x + 100, p.y, 'vegeta-planicies');
  assert.equal(mob.level, 40);
  game.hit(p, mob, 100000);
  assert.equal(p.xp, xpAjustadoPorNivel(mob.xp, p.level, mob.level));
  assert.equal(p.kills, 1);
});

test('Auto Hunt continua abatendo mobs antigos e recebendo XP reduzido em nível avançado', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
  const p = game.addPlayer('auto-xp', 'Teste', { level: 100 });
  game.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  const mob = game.addMob('melee', p.x + 60, p.y, 'inicial');
  p.autoHunt = true; p.autoAttack = true;
  for (let i = 0; i < 80 && p.kills === 0; i++) game.tick(0.05);
  assert.equal(p.kills, 1);
  assert.ok(p.xp > 0 && p.xp < mob.xp, 'XP positivo, reduzido pela diferença de níveis');
});

test('expansão não bloqueia acesso a hunts recomendadas para níveis mais altos', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 });
  const p = game.addPlayer('baixo', 'Teste', { level: 1 });
  game.levar(p, lugar('vegeta-cidade'));
  const portal = PORTAIS.find(o => o.area === 'vegeta-cidade' && o.destinos.includes('vegeta-cratera'));
  p.x = portal.x; p.y = portal.y;
  assert.equal(game.usePortal(p, 'vegeta-cratera').ok, true);
  assert.equal(p.level, 1);
  assert.equal(p.area, 'vegeta-cratera');
});

test('atributos de Goku continuam progredindo e mobs de Vegeta escalam até o nível recomendado', () => {
  assert.equal(statsFor(100, 'goku').attack, 289.2);
  assert.ok(statsFor(1000, 'goku').attack > statsFor(100, 'goku').attack);
  assert.deepEqual(
    ['hp', 'attack', 'defesa', 'xp'].map(key => mobStats('tsufuruGuerreiro', 'vegeta-planicies')[key]),
    [2272, 73, 27, 324]
  );
  const broly = mobStats('broly', 'vegeta-cratera');
  assert.equal(broly.level, 150);
  assert.ok(broly.hp > 5900 && broly.attack > 150 && broly.xp > 2600);
  assert.equal(xpForLevel(1), 30);
  assert.equal(xpForLevel(100), Math.round(30 * 100 ** 1.35));
});

test('God Mode leva ao nível máximo e desligá-lo restaura nível e recursos reais', () => {
  const game = new Game({ now: 1000, populate: false });
  const p = game.addPlayer('godmode', 'Teste', { level: 37, hp: 321, ki: 123, zeni: 456 });
  assert.equal(game.action(p.id, { type: 'godmode' }).ok, true);
  assert.equal(p.level, 1000);
  assert.equal(p.stats.hp, statsFor(1000).hp);
  assert.equal(p.stats.attack, statsFor(1000).attack);
  assert.equal(p.hp, p.stats.hp);
  assert.equal(p.ki, p.stats.ki);
  assert.equal(p.xp, 0);
  assert.equal(game.action(p.id, { type: 'godmode' }).ok, true);
  assert.deepEqual([p.level, p.hp, p.ki, p.zeni], [37, 321, 123, 456]);
});
