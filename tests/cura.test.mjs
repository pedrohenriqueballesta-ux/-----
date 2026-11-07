import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { CURA, curaPorNivel } from '../public/shared/cura.mjs';
import { statsFor } from '../public/shared/characters.mjs';
import { lugar } from '../public/shared/config.mjs';
import { createGameServer } from '../server.mjs';

function cena(nivel = 1) {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  Object.assign(p, { level: nivel, stats: statsFor(nivel), hp: statsFor(nivel).hp / 2, ki: statsFor(nivel).ki,
    autoFood: false, autoHeal: false });
  return { g, p };
}
const perto = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);

test('cura evolui nos marcos 1, 20, 50, 100 e 150+, conforme tabela', () => {
  for (const [nivel, rank, percentual, custo] of [[1,1,.02,10], [19,1,.02,10], [20,2,.025,12], [49,2,.025,12],
    [50,3,.03,14], [99,3,.03,14], [100,4,.035,16], [149,4,.035,16], [150,5,.04,18], [200,5,.04,18]]) {
    const { g, p } = cena(nivel), hp = p.hp, ki = p.ki;
    assert.equal(curaPorNivel(nivel).nivel, rank);
    assert.equal(g.action(p.id, { type: 'skill', skill: 'heal' }).ok, true);
    perto(p.hp - hp, p.stats.hp * percentual);
    assert.equal(ki - p.ki, custo); assert.equal(p.healReady, g.time + 1.5);
  }
});

test('limita HP ao máximo e não gasta Ki nem cooldown em vida cheia, falta de Ki, morte ou desconexão', () => {
  const { g, p } = cena(20);
  p.hp = p.stats.hp - 0.1;
  assert.equal(g.cast(p, 'heal').ok, true); assert.equal(p.hp, p.stats.hp);
  for (const preparar of [() => { p.hp = p.stats.hp; }, () => { p.hp = 1; p.ki = 11; },
    () => { p.hp = 0; }, () => { p.hp = 1; p.connected = false; }]) {
    p.ki = 100; p.healReady = 0; p.connected = true; preparar();
    const antes = [p.hp, p.ki, p.healReady];
    assert.equal(g.cast(p, 'heal').ok, false); assert.deepEqual([p.hp, p.ki, p.healReady], antes);
  }
});

test('tecla, automação e pedidos repetidos compartilham a mesma recarga de 1,5s', () => {
  const { g, p } = cena(100), hp = p.hp, ki = p.ki;
  for (let i = 0; i < 20; i++) g.cast(p, 'heal', i % 2 === 0);
  perto(p.hp - hp, p.stats.hp * .035); assert.equal(ki - p.ki, 16);
  g.time += 1.499; assert.equal(g.cast(p, 'heal').ok, false);
  g.time += .001; assert.equal(g.cast(p, 'heal').ok, true);
  assert.equal(ki - p.ki, 32);
});

test('autocura usa limite estrito de 70%, respeita configuração e pode ser desligada', () => {
  for (const modo of ['autoHunt', 'autoSkills']) {
    const { g, p } = cena(50); p.autoHeal = true; p[modo] = true;
    p.hp = p.stats.hp * .7; g.updatePlayer(p, 0);
    assert.equal(p.healReady, 0, '70% exatos não ativa');
    p.hp -= 1; const ki = p.ki;
    g.updatePlayer(p, 0); assert.equal(p.ki, ki - 14);
    const hp = p.hp; g.updatePlayer(p, 0); assert.equal(p.hp, hp);
    g.time += 1.5; p.hp = p.stats.hp * .4;
    g.action(p.id, { type: 'healThreshold', value: 40 }); g.updatePlayer(p, 0);
    assert.equal(p.hp, p.stats.hp * .4);
    g.action(p.id, { type: 'healThreshold', value: 80 });
    g.action(p.id, { type: 'toggle', key: 'autoHeal', value: false });
    g.updatePlayer(p, 0); assert.equal(p.hp, p.stats.hp * .4);
    g.action(p.id, { type: 'toggle', key: 'autoHeal', value: true });
    g.updatePlayer(p, 0); perto(p.hp, p.stats.hp * .43);
  }
});

test('valida limite no servidor e persiste preferência/recarga sem explorar reconexão', () => {
  const { g, p } = cena();
  for (const value of [-1, 0, 101, 70.5, NaN, Infinity, '80', null]) {
    assert.equal(g.action(p.id, { type: 'healThreshold', value }).ok, false);
    assert.equal(p.healThreshold, 70);
  }
  g.action(p.id, { type: 'healThreshold', value: 85 });
  g.cast(p, 'heal');
  const salvo = g.exportPlayer(p), q = g.addPlayer('q', 'Outro', salvo);
  assert.equal(q.healThreshold, 85); assert.equal(q.autoHeal, false); assert.equal(q.healReady, p.healReady);
  assert.equal(g.cast(q, 'heal').ok, false);
  const antigo = g.addPlayer('antigo', 'Antigo', { level: 1 });
  assert.equal(antigo.healThreshold, CURA.limitePadrao); assert.equal(antigo.autoHeal, true);
});

test('cura é universal, não muda direção, movimento, alvo, ataques, carga ou cooldowns alheios', () => {
  const { g, p } = cena(50);
  p.character = 'Personagem futuro'; p.input = { x: 1, y: 0 }; p.facing = { x: -1, y: 0 };
  p.targetId = 'alvo'; p.charge = { until: g.time + 1, direction: p.facing };
  p.basicReady = 1020; p.kameReady = 1030; p.seedReady = 1040;
  const antes = structuredClone([p.input, p.facing, p.charge, p.targetId, p.basicReady, p.kameReady, p.seedReady]);
  assert.equal(g.cast(p, 'heal').ok, true);
  assert.deepEqual([p.input, p.facing, p.charge, p.targetId, p.basicReady, p.kameReady, p.seedReady], antes);
  const x = p.x; g.setInput(p.id, { x: 1, y: 0 }); g.tick(.05);
  assert.ok(p.x > x, 'continua andando durante a cura');
});

test('autocura não depende de alvo e funciona durante ataque sem curar outro jogador ou lugar', () => {
  const { g, p } = cena(20), outro = g.addPlayer('outro'), distante = g.addPlayer('distante');
  g.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  p.autoHeal = true; p.autoSkills = true; p.autoAttack = true;
  const m = g.addMob('melee', p.x + 40, p.y, p.area); m.hp = m.maxHp = 10000; m.agressivo = false;
  p.targetId = m.id; const vidaOutro = outro.hp;
  g.levar(outro, lugar('inicial')); g.tick(.05);
  assert.ok(p.hp > p.stats.hp / 2); assert.ok(m.hp < m.maxHp, 'ataque no mesmo tick');
  assert.equal(outro.hp, vidaOutro);
  assert.ok(g.snapshot(outro.id).events.some(e => e.type === 'heal' && e.playerId === p.id));
  assert.ok(!g.snapshot(distante.id).events.some(e => e.type === 'heal' && e.playerId === p.id));
  assert.equal(g.snapshot(p.id).self.cura.custo, 12);
});

test('jogador desconectado não continua se curando', () => {
  const { g, p } = cena(); p.autoHeal = true; p.autoHunt = true; p.connected = false;
  const antes = [p.hp, p.ki]; g.tick(.1); assert.deepEqual([p.hp, p.ki], antes);
});

test('autocura repete a cada 1,5s sem regeneração gratuita, sem alvo e sem pausar ataques', () => {
  const { g, p } = cena(50); p.autoHeal = true; p.autoSkills = true;
  p.basicReady = g.time + 100; // impede a recuperação provisória de Ki durante a medição
  const hp = p.hp, ki = p.ki;
  for (let i = 0; i < 120; i++) g.tick(.05);
  perto(p.hp - hp, 4 * p.stats.hp * .03);
  assert.equal(ki - p.ki, 4 * 14);
});

test('API concorrente aceita apenas uma cura e não confia em cura/custo enviados pelo cliente', async () => {
  const app = await createGameServer({ port: 0, dataDir: null, populate: false });
  try {
    const base = 'http://127.0.0.1:' + app.port;
    const entrada = await (await fetch(base + '/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Teste' }) })).json();
    const p = app.game.players.get(entrada.playerId); p.hp = 60; p.autoHeal = false;
    // Sem regeneração provisória de Ki interferindo na medição da API.
    p.basicReady = app.game.time + 100;
    const ki = p.ki;
    const resultados = await Promise.all(Array.from({ length: 8 }, () => fetch(base + '/api/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + entrada.token },
      body: JSON.stringify({ type: 'skill', skill: 'heal', amount: 999999, cost: 0 })
    }).then(r => r.json())));
    assert.equal(resultados.filter(r => r.ok).length, 1);
    perto(p.hp, 62.4); assert.equal(p.ki, ki - 10);
  } finally { await app.close(); }
});
