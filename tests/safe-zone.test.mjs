import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { ZONES, lugar, naZonaSegura } from '../public/shared/config.mjs';
import { statsFor } from '../public/shared/characters.mjs';
const passar = (g, s) => { for (let t = 0; t < s; t += .05) g.tick(.05); };
for (const z of ZONES.filter(z => !z.segura)) {
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
