import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { lugar } from '../public/shared/nucleo/config.mjs';
import { CHEFES_TESTE, CHEFES_RAROS, TIPOS_CHEFE } from '../public/shared/nucleo/enemies.mjs';

test('God Mode invoca cada chefe no spawn habitual sem duplicá-lo', () => {
  const game = new Game({ now:1000, random:() => 0.5 });
  const player = game.addPlayer('tester');
  assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:'neva' }).ok, false);
  game.action(player.id, { type:'godmode' });
  assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:'__proto__' }).ok, false);

  for (const {type, area, id} of CHEFES_TESTE.filter(b => !b.pessoal)) {
    const bosses = [...game.mobs.values()].filter(m => m.type === type && m.area === area);
    assert.equal(bosses.length, 1, type + ' já deve existir no mundo');
    const boss = bosses[0];
    boss.hp = 0; boss.deadUntil = game.time + 3600;
    const result = game.action(player.id, { type:'godmodeSpawnBoss', boss:id });
    assert.equal(result.ok, true, type);
    assert.equal(boss.hp, boss.maxHp);
    assert.equal(boss.deadUntil, game.time);
    assert.deepEqual([boss.x, boss.y], [boss.homeX, boss.homeY]);
    if (CHEFES_RAROS[area] && !CHEFES_RAROS[area].todaHunt) {
      const spawn = CHEFES_RAROS[area];
      assert.ok(Math.hypot(boss.x - spawn.x, boss.y - spawn.y) <= spawn.r + 1, type);
    }
    assert.equal(game.action(player.id, { type:'godmodeSpawnBoss', boss:id }).ok, false, 'chefe vivo não é duplicado');
    assert.equal([...game.mobs.values()].filter(m => m.type === type && m.area === area).length, 1);
  }
});

test('God Mode lista todos os chefes do jogo que existem numa hunt', () => {
  const game = new Game({ now:1000 }), noMundo = new Set([...game.mobs.values()].filter(m => TIPOS_CHEFE.has(m.type)).map(m => m.type));
  const pessoais = ['cellSemiperfeito', 'cellPerfeito', 'c17Infernal', 'superC17'];
  for (const tipo of [...noMundo, ...pessoais]) assert.ok(CHEFES_TESTE.some(b => b.type === tipo), tipo + ' falta no God Mode');
  assert.equal(new Set(CHEFES_TESTE.map(b => b.id)).size, CHEFES_TESTE.length, 'ids únicos');
});

test('God Mode invoca chefe de saga só para quem pediu, sem mexer no progresso da saga', () => {
  const game = new Game({ now:1000 }), p = game.addPlayer('p', 'Goku', { level: 900 }), q = game.addPlayer('q', 'Outro', { level: 900 });
  p.connected = q.connected = true; game.action(p.id, { type:'godmode' });
  for (const b of CHEFES_TESTE.filter(b => b.pessoal)) {
    assert.equal(game.action(p.id, { type:'godmodeSpawnBoss', boss:b.id }).ok, true, b.id);
    const m = [...game.mobs.values()].find(m => m.dono === p.id && m.type === b.type && m.area === b.area);
    assert.ok(m?.teste, b.id + ' nasceu como teste'); assert.equal(game.action(p.id, { type:'godmodeSpawnBoss', boss:b.id }).ok, false, 'não duplica');
    game.proximaSincroniaSaga = 0; game.tick(.01); assert.ok(game.mobs.has(m.id), b.id + ' não some na sincronia das sagas');
    game.levar(q, lugar(m.area)); q.x = m.x; q.y = m.y; assert.ok(!game.snapshot(q.id).mobs.some(x => x.id === m.id), 'o outro não vê');
    p.godmode = false; game.levar(p, lugar(m.area)); p.x = m.x; p.y = m.y;
    assert.equal(game.hit(p, m, 1e12), true); assert.ok(!game.mobs.has(m.id)); p.godmode = true;
  }
  assert.equal(p.sagaCell.etapa, 0, 'a Saga do Cell não andou'); assert.equal(p.sagaAndroides.venceuInfernal, false, 'nem a dos Androides');
  assert.equal(p.proximoSuperC17, undefined, 'nem o relógio do Super C17');
});
