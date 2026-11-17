import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { CHEFES_TESTE, CHEFES_RAROS } from '../public/shared/enemies.mjs';

test('God Mode invoca cada chefe no spawn habitual sem duplicá-lo', () => {
  const game = new Game({ now:1000, random:() => 0.5 });
  const player = game.addPlayer('tester');
  assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:'neva' }).ok, false);
  game.action(player.id, { type:'godmode' });
  assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:'__proto__' }).ok, false);

  for (const {type, area} of CHEFES_TESTE) {
    const bosses = [...game.mobs.values()].filter(m => m.type === type && m.area === area);
    assert.equal(bosses.length, 1, type + ' já deve existir no mundo');
    const boss = bosses[0];
    boss.hp = 0; boss.deadUntil = game.time + 3600;
    const result = game.action(player.id, { type:'godmodeSpawnBoss', boss:type });
    assert.equal(result.ok, true, type);
    assert.equal(boss.hp, boss.maxHp);
    assert.equal(boss.deadUntil, game.time);
    assert.deepEqual([boss.x, boss.y], [boss.homeX, boss.homeY]);
    if (CHEFES_RAROS[area] && !CHEFES_RAROS[area].todaHunt) {
      const spawn = CHEFES_RAROS[area];
      assert.ok(Math.hypot(boss.x - spawn.x, boss.y - spawn.y) <= spawn.r + 1, type);
    }
    assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:type }).ok, false, 'chefe vivo não é duplicado');
    assert.equal([...game.mobs.values()].filter(m => m.type === type && m.area === area).length, 1);
  }
});
