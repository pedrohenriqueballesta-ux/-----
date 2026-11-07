import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { ZONES, lugar, naZonaSegura, pontoNaZonaSegura } from '../public/shared/config.mjs';
import { caminhoPorTerra, pesLivres, deslocar } from '../public/shared/passagem.mjs';
import { pontoNoCirculo, spawnPoints } from '../public/shared/enemies.mjs';
import { statsFor } from '../public/shared/characters.mjs';
const passar = (g, s) => { for (let t = 0; t < s; t += .05) g.tick(.05); };
for (const z of ZONES.filter(z => !z.segura)) {
  test(z.id + ': auto caça contorna o quadrado para alcançar um mob do outro lado, sem entrar nem travar', () => {
    const a = z.id === 'inicial' ? Math.PI * 3 / 8 : 0;
    const de = { x: z.chegada.x + Math.cos(a) * 150, y: z.chegada.y + Math.sin(a) * 150 };
    const ate = { x: z.chegada.x - Math.cos(a) * 150, y: z.chegada.y - Math.sin(a) * 150 };
    const rota = caminhoPorTerra(z.planet, de, ate, z.id, 0, true);
    assert.ok(rota?.length, 'rota com desvio');
    let anterior = de;
    for (const ponto of rota) {
      const passos = Math.ceil(Math.hypot(ponto.x - anterior.x, ponto.y - anterior.y) / 3);
      for (let i = 1; i <= passos; i++) assert.equal(pontoNaZonaSegura(z.planet, z.id, anterior.x + (ponto.x - anterior.x) * i / passos, anterior.y + (ponto.y - anterior.y) * i / passos), false, 'segmento não atravessa a safe zone');
      anterior = ponto;
    }
    const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
    g.levar(p, lugar(z.id)); Object.assign(p, de); p.level = 60; p.stats = statsFor(60); p.hp = p.stats.hp;
    const m = g.addMob('melee', ate.x, ate.y, z.id); m.speed = 0; m.attackReady = Infinity;
    g.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
    for (let i = 0; i < 240; i++) { g.tick(.05); assert.equal(naZonaSegura(p), false); }
    assert.ok(Math.hypot(p.x - m.x, p.y - m.y) < 70, 'chegou ao alvo sem bater na borda');
  });
  test(z.id + ': spawn direto e renascimento corrigem pontos seguros antigos', () => {
    const g = new Game({ now: 1000, populate: false }), m = g.addMob('melee', z.chegada.x, z.chegada.y, z.id);
    assert.equal(naZonaSegura(m), false); assert.ok(pesLivres(z.planet, m.x, m.y, 15, z.id));
    m.homeX = z.chegada.x; m.homeY = z.chegada.y; m.hp = 0; m.deadUntil = g.time;
    g.tick(.05); assert.equal(naZonaSegura(m), false); assert.equal(m.hp, m.maxHp);
    assert.equal(pontoNaZonaSegura(z.planet, z.id, m.homeX, m.homeY), false);
  });
  test(z.id + ': chegada protegida permanentemente e auto caça sai mesmo sem mobs', () => {
    const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
    g.levar(p, lugar(z.id)); p.autoAttack = false; p.autoSkills = false;
    passar(g, 10); assert.ok(naZonaSegura(p)); assert.ok(g.protegido(p));
    g.action(p.id, { type: 'hunt' }); passar(g, 4);
    assert.equal(naZonaSegura(p), false, 'saiu do quadrado');
    assert.equal(p.autoHunt, true); assert.equal(g.protegido(p), false);
  });
}
test('safe zone bloqueia dano, habilidades, aggro e golpes pendentes; sair restaura combate', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar('inicial')); p.level = 60; p.stats = statsFor(60); p.ki = p.stats.ki;
  const m = g.addMob('saibaman', p.x + 50, p.y, p.area), hp = p.hp, mhp = m.hp;
  passar(g, 5);
  assert.equal(p.hp, hp); assert.equal(m.hp, mhp); assert.ok(!m.alvoId);
  for (const skill of ['basic', 'ki', 'kame', 'genki']) assert.equal(g.cast(p, skill).ok, false);
  assert.equal(g.hit(p, m, 100), false); assert.equal(g.hit(m, p, 100), false);
  p.charge = { until: g.time, direction: { x: 1, y: 0 } }; g.tick(.05);
  assert.equal(p.charge, null); assert.equal(m.hp, mhp);
  assert.equal(g.snapshot(p.id).self.naZonaSegura, true);
  p.x += 100; assert.equal(g.hit(p, m, 10), true); assert.equal(g.hit(m, p, 10), true);
  p.x -= 100; passar(g, .1); assert.ok(!m.ameaca?.has(p.id));
});
test('spawn distribuído e sorteio/fallback de chefes nunca usam as safe zones', () => {
  for (const random of [() => 0, () => .5, () => .999999]) {
    for (const s of spawnPoints(random)) assert.equal(naZonaSegura({ ...s, planet: ZONES.find(z => z.id === s.area).planet }), false);
    for (const area of ['dificil', 'vegeta-lava', 'vegeta-cratera']) {
      const z = ZONES.find(z => z.id === area), ponto = pontoNoCirculo(random, area);
      assert.equal(pontoNaZonaSegura(z.planet, area, ponto.x, ponto.y, 24), false);
    }
  }
});
test('entrada manual continua livre; movimento automático não cruza a borda', () => {
  const z = ZONES.find(z => z.id === 'media'), x = z.chegada.x + 100, y = z.chegada.y;
  const manual = deslocar(z.planet, x, y, -1, 0, 30, 15, z.id);
  const automatico = deslocar(z.planet, x, y, -1, 0, 30, 15, z.id, true);
  assert.equal(pontoNaZonaSegura(z.planet, z.id, ...manual), true);
  assert.equal(pontoNaZonaSegura(z.planet, z.id, ...automatico), false);
});
test('patrulha sem inimigos vivos também contorna a safe zone, sem insistir contra a borda', () => {
  const z = ZONES.find(z => z.id === 'media'), g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar(z.id)); p.x += 150;
  const m = g.addMob('guerreiro', z.chegada.x - 150, z.chegada.y, z.id);
  m.hp = 0; m.deadUntil = Infinity;
  g.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  for (let i = 0; i < 240; i++) { g.tick(.05); assert.equal(naZonaSegura(p), false); }
  assert.ok(Math.hypot(p.x - m.homeX, p.y - m.homeY) < 70, 'patrulha chegou ao outro lado');
});
test('projéteis em voo não ferem jogador protegido nem causam dano a partir da safe zone', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar('inicial')); p.autoAttack = false; p.autoSkills = false;
  const m = g.addMob('saibaman', p.x + 50, p.y, p.area), hp = p.hp, mhp = m.hp;
  for (const [owner, ownerType, x, dx] of [[m, 'mob', p.x + 20, -1], [p, 'player', m.x - 20, 1]]) {
    g.projectiles.push({ id: g.uid('s'), owner: owner.id, ownerType, planet: p.planet, area: p.area,
      x, y: p.y, dx, dy: 0, speed: 100, damage: 1000, ttl: 1, kind: ownerType === 'player' ? 'genki' : 'deathbeam' });
  }
  passar(g, .2); assert.equal(p.hp, hp); assert.equal(m.hp, mhp);
});
