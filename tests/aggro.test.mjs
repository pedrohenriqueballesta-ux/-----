import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, lugar } from '../public/shared/index.mjs';
import { statsFor } from '../public/shared/characters.mjs';
import { mobStats } from '../public/shared/enemies.mjs';

// Mundo vazio numa hunt larga do Vegeta, com um mob e jogadores colocados à mão.
function cena({ tipo = 'oozaru', area = 'vegeta-lava', jogadores = 1 } = {}) {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 });
  const ps = Array.from({ length: jogadores }, (_, i) => {
    const p = game.addPlayer('p' + i); p.level = 60; p.stats = statsFor(60); p.hp = p.stats.hp;
    game.levar(p, lugar(area)); p.seguroAte = 0; return p;
  });
  const c = lugar(area).chegada, m = game.addMob(tipo, c.x + 600, c.y, area);
  m.attackReady = Infinity; // só movimento e escolha de alvo, sem dano no meio
  return { game, ps, m };
}
const passar = (game, s) => { for (let t = 0; t < s; t += 0.05) game.tick(0.05); };
const colocar = (p, m, dx, dy = 0) => { p.x = m.x + dx; p.y = m.y + dy; p.input = { x: 0, y: 0 }; };

test('aggro por proximidade: mob agressivo nota o jogador a ~420 (antes só a 300) e vai até ele', () => {
  const { game, ps: [p], m } = cena();
  colocar(p, m, -420);
  passar(game, 0.1); assert.equal(m.alvoId, p.id);
  const antes = Math.hypot(p.x - m.x, p.y - m.y); passar(game, 2);
  assert.ok(Math.hypot(p.x - m.x, p.y - m.y) < antes - 100, 'perseguiu');
});

test('fora do raio de aggro o mob fica parado em casa', () => {
  const { game, ps: [p], m } = cena();
  colocar(p, m, -(m.aggro + 80)); passar(game, 2);
  assert.equal(m.alvoId ?? null, null); assert.ok(Math.hypot(m.x - m.homeX, m.y - m.homeY) < 12);
});

test('aggro por ataque: mob atingido de longe reage, e mob neutro só reage quando provocado', () => {
  const { game, ps: [p], m } = cena();
  m.agressivo = false; colocar(p, m, -700);
  passar(game, 1); assert.equal(m.alvoId ?? null, null, 'neutro ignora quem passa');
  colocar(p, m, -200); passar(game, 1); assert.equal(m.alvoId ?? null, null, 'nem de perto');
  game.hit(p, m, 50); passar(game, 0.1);
  assert.equal(m.alvoId, p.id, 'provocado, persegue');
});

test('limite de perseguição: passa do limite, larga o alvo, volta para casa e recupera a vida', () => {
  const { game, ps: [p], m } = cena();
  game.hit(p, m, 400); const ferido = m.hp;
  m.x = m.homeX - m.perseguicao - 10; colocar(p, m, -100);
  passar(game, 0.1); assert.equal(m.voltando, true); assert.equal(m.alvoId, null);
  passar(game, 20);
  assert.ok(Math.hypot(m.x - m.homeX, m.y - m.homeY) < 40, 'voltou'); assert.equal(m.voltando, false);
  assert.ok(m.hp > ferido && m.hp === m.maxHp, 'curado ao chegar');
});

test('perda de aggro: jogador morto, desconectado ou em área protegida deixa de ser alvo', () => {
  for (const sumir of [p => { p.hp = 0; }, p => { p.connected = false; }, (p, game) => { p.seguroAte = game.time + 10; }]) {
    const { game, ps: [p], m } = cena();
    colocar(p, m, -200); passar(game, 0.1); assert.equal(m.alvoId, p.id);
    sumir(p, game); passar(game, 0.1);
    assert.ok(!m.ameaca?.has(p.id), 'esqueceu');
  }
});

test('vários jogadores: persegue quem causou mais ameaça e não troca de alvo à toa', () => {
  const { game, ps: [a, b], m } = cena({ jogadores: 2 });
  colocar(a, m, -150); colocar(b, m, 150);
  game.hit(a, m, 100); passar(game, 0.1); assert.equal(m.alvoId, a.id);
  game.hit(b, m, 110); passar(game, 0.1); assert.equal(m.alvoId, a.id, '10% a mais não basta (folga de 20%)');
  game.hit(b, m, 100); passar(game, 0.1); assert.equal(m.alvoId, b.id, 'bem mais ameaça troca o alvo');
});

test('configurável por mob, com padrões: mob grande enxerga mais longe; chefe persegue menos longe', () => {
  const comum = mobStats('tsufuruGuerreiro', 'vegeta-planicies'), oozaru = mobStats('oozaru', 'vegeta-lava'), chefe = mobStats('oozaruSuper', 'vegeta-lava');
  assert.equal(comum.agressivo, true);
  assert.ok(oozaru.aggro > comum.aggro && chefe.aggro > oozaru.aggro);
  assert.ok(chefe.perseguicao < comum.perseguicao);
});

test('caça automática segue funcionando com o aggro (abate mobs e não fica presa)', () => {
  const game = new Game({ now: 1000, random: () => 0.5 }), p = game.addPlayer('a');
  p.level = 36; p.stats = statsFor(36); p.hp = p.stats.hp; game.levar(p, lugar('vegeta-planicies')); game.action(p.id, { type: 'hunt' });
  for (let i = 0; i < 120 / 0.05; i++) { game.tick(0.05); if (p.hp > 0 && !p.autoHunt) game.action(p.id, { type: 'hunt' }); }
  assert.ok(p.kills >= 3, 'abates: ' + p.kills); assert.equal(p.area, 'vegeta-planicies');
});
