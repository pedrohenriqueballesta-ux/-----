import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';

function cena() {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  p.autoFood = false; p.autoHeal = false; p.autoHunt = true;
  return { g, p };
}
const limitar = (g, p, key, value) => g.action(p.id, { type: 'automationThreshold', key, value });

test('limites padrão e configuração de cura, Ki e semente são validados no servidor', () => {
  const { g, p } = cena();
  assert.deepEqual([p.healThreshold, p.kiThreshold, p.seedThreshold], [70, 25, 30]);
  for (const key of ['healThreshold', 'kiThreshold', 'seedThreshold']) {
    for (const value of [0, -1, 101, 40.5, '60', null, NaN, Infinity]) {
      const antes = p[key]; assert.equal(limitar(g, p, key, value).ok, false); assert.equal(p[key], antes);
    }
    assert.equal(limitar(g, p, key, 1).ok, true);
    assert.equal(limitar(g, p, key, 100).ok, true);
    assert.equal(g.snapshot(p.id).self[key], 100);
  }
  assert.equal(limitar(g, p, 'hp', 99).ok, false);
  assert.equal(limitar(g, p, '__proto__', 99).ok, false);
  assert.equal(g.action(p.id, { type: 'healThreshold', value: 70 }).ok, true, 'ação anterior compatível');
});

test('poção usa o limite personalizado, estoque e recarga existente, sem duplicar uso', () => {
  const { g, p } = cena(); p.autoKi = true;
  limitar(g, p, 'kiThreshold', 60); p.ki = p.stats.ki * .6;
  const itens = p.inventory.ki;
  g.updatePlayer(p, 0); assert.equal(p.inventory.ki, itens, 'limite exato não usa');
  p.ki -= 1; const ki = p.ki;
  g.updatePlayer(p, 0);
  assert.equal(p.inventory.ki, itens - 1);
  assert.equal(p.ki, Math.min(p.stats.ki, ki + p.stats.ki * .45));
  assert.equal(p.kiReady, g.time + CONFIG.kiCooldown);
  p.ki = 0; g.updatePlayer(p, 0); assert.equal(p.inventory.ki, itens - 1);
  g.time = p.kiReady; g.updatePlayer(p, 0); assert.equal(p.inventory.ki, itens - 2);
  p.inventory.ki = 0; p.ki = 0; g.time += CONFIG.kiCooldown;
  g.updatePlayer(p, 0); assert.equal(p.ki, 0, 'sem item não recupera Ki');
});

test('semente usa potência selecionada, limite próprio e mesma recarga para todas as potências', () => {
  const { g, p } = cena(); p.autoSeed = true; p.hp = p.stats.hp * .6;
  limitar(g, p, 'seedThreshold', 60);
  g.action(p.id, { type: 'selectSeed', potency: 30 });
  const n = p.inventory.seed30;
  g.updatePlayer(p, 0); assert.equal(p.inventory.seed30, n);
  p.hp -= 1; const hp = p.hp; g.updatePlayer(p, 0);
  assert.equal(p.inventory.seed30, n - 1); assert.equal(p.hp, hp + p.stats.hp * .3);
  assert.equal(p.seedReady, g.time + CONFIG.seedCooldown);
  g.action(p.id, { type: 'selectSeed', potency: 100 }); p.hp = 1;
  const n100 = p.inventory.seed100;
  g.updatePlayer(p, 0); assert.equal(p.inventory.seed100, n100);
  g.time = p.seedReady; g.updatePlayer(p, 0);
  assert.equal(p.inventory.seed100, n100 - 1); assert.equal(p.hp, p.stats.hp);
});

test('controles desligados, safe zone e desconexão impedem consumo automático', () => {
  for (const modo of ['desligado', 'principal desligado', 'safe', 'desconectado']) {
    const { g, p } = cena(); p.autoKi = modo !== 'desligado'; p.autoSeed = modo !== 'desligado';
    p.hp = 1; p.ki = 0;
    if (modo === 'principal desligado') p.autoHunt = false;
    if (modo === 'safe') g.levar(p, lugar('inicial'));
    if (modo === 'desconectado') p.connected = false;
    const inventario = { ...p.inventory };
    g.updatePlayer(p, 0); assert.deepEqual(p.inventory, inventario, modo);
  }
});

test('preferências de recuperação e potência persistem sem reativar caça ao reconectar', () => {
  const { g, p } = cena();
  for (const [key, value] of [['healThreshold', 65], ['kiThreshold', 45], ['seedThreshold', 20]]) limitar(g, p, key, value);
  for (const key of ['autoHeal', 'autoKi', 'autoSeed']) g.action(p.id, { type: 'toggle', key, value: true });
  g.action(p.id, { type: 'selectSeed', potency: 50 });
  p.autoHunt = true; p.autoAttack = true; p.autoSkills = true;
  const salvo = g.exportPlayer(p), q = g.addPlayer('reconectado', 'Teste', salvo);
  assert.deepEqual([q.healThreshold, q.kiThreshold, q.seedThreshold, q.seedSelected], [65,45,20,50]);
  assert.deepEqual([q.autoHeal, q.autoKi, q.autoSeed, q.autoFood], [true,true,true,false]);
  assert.deepEqual([q.autoHunt, q.autoAttack, q.autoSkills], [false,false,false]);
  const antigo = g.addPlayer('antigo', 'Antigo', { kiThreshold: '90', seedThreshold: -5, seedSelected: 999 });
  assert.deepEqual([antigo.kiThreshold, antigo.seedThreshold, antigo.seedSelected], [25,30,15]);
});

test('iniciar e pausar a caça preserva limites de recuperação e toggles independentes', () => {
  const { g, p } = cena(); limitar(g, p, 'kiThreshold', 55); limitar(g, p, 'seedThreshold', 35);
  assert.equal(g.action(p.id, { type: 'hunt', enabled: true }).ok, true);
  assert.equal(p.autoHunt, true); assert.equal(p.autoAttack, true); assert.equal(p.autoSkills, true);
  g.action(p.id, { type: 'toggle', key: 'autoSkills', value: false });
  assert.equal(p.autoHunt, true); assert.equal(p.autoSkills, false);
  g.action(p.id, { type: 'hunt', enabled: false });
  assert.equal(p.autoHunt, false); assert.deepEqual([p.kiThreshold,p.seedThreshold], [55,35]);
});

test('Auto Hunt OFF bloqueia todo combate e recuperação mesmo com opções marcadas', () => {
  const { g, p } = cena();
  for (const key of ['autoAttack','autoSkills','autoHeal','autoKi','autoSeed','autoFood']) p[key] = true;
  g.action(p.id, { type: 'hunt', enabled: false });
  const m = g.addMob('melee', p.x + 30, p.y, p.area); m.hp = m.maxHp = 10000;
  p.targetId = m.id; p.hp = 1; p.ki = p.stats.ki * .1;
  const antes = structuredClone([p.hp,p.ki,p.inventory,m.hp]);
  g.updatePlayer(p, 0);
  assert.deepEqual([p.hp,p.ki,p.inventory,m.hp], antes);
  assert.equal(p.charge, null); assert.equal(g.projectiles.length, 0);
  assert.ok(['autoAttack','autoSkills','autoHeal','autoKi','autoSeed','autoFood'].every(key => p[key]));
  p.ki = p.stats.ki;
  assert.equal(g.cast(p, 'heal').ok, true, 'uso manual continua disponível');
});

test('desligar cancela carga automática pendente e preserva carga manual', () => {
  for (const automated of [true,false]) {
    const { g, p } = cena();
    const alvo = g.addMob('melee', p.x+70, p.y, p.area);
    p.charge = { targetId:alvo.id, automated, until: g.time + .2, started: g.time, direction: {x:1,y:0}, nivel:1 };
    g.action(p.id, { type:'hunt', enabled:false });
    g.updatePlayer(p, 0);
    assert.equal(Boolean(p.charge), !automated);
  }
});