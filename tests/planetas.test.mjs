import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLANETS, PLANETAS_DE_HUNT, PORTAIS, ZONES, MERCADORES, HOUSES, DECORACAO, zonasDe, lugar } from '../public/shared/index.mjs';
import { casaBloqueia, decoracaoBloqueia } from '../public/shared/config.mjs';
import { podeAndar } from '../public/shared/passagem.mjs';

// Regras que valem para todo planeta de hunt (Namekusei hoje; Planeta Vegeta em seguida): quando um
// planeta novo entrar, estes testes conferem a ficha dele sem precisar de teste novo.

test('cada área pertence a um planeta de hunt, com id único no jogo inteiro', () => {
  const ids = ZONES.map(z => z.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos: ' + ids);
  for (const z of ZONES) {
    assert.ok(PLANETS[z.planet]?.hunts, z.id + ' aponta para um planeta de hunt');
    assert.ok(z.cor, z.id + ' tem cor');
    assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= PLANETS[z.planet].w + 1 && z.y + z.h <= PLANETS[z.planet].h + 1, z.id + ' cabe no planeta');
  }
});

test('ficha de cada planeta: Vila segura, hunts do próprio planeta com nível, chegada andável', () => {
  for (const mundo of PLANETAS_DE_HUNT) {
    const vila = lugar(mundo.vila);
    assert.equal(vila.planet, mundo.id); assert.equal(vila.segura, true, mundo.id + ': Vila segura');
    assert.deepEqual(zonasDe(mundo.id).map(z => z.id).sort(), [mundo.vila, ...mundo.hunts].sort(), mundo.id + ': áreas = Vila + hunts');
    for (const id of mundo.hunts) {
      const h = lugar(id);
      assert.equal(h.planet, mundo.id); assert.equal(h.segura, false); assert.ok(h.nivel, id + ' tem faixa de nível');
    }
    for (const z of zonasDe(mundo.id)) assert.ok(podeAndar(mundo.id, z.chegada.x, z.chegada.y, z.id), z.id + ': chegada em chão andável');
  }
});

test('portais: Terra leva a toda Vila; cada Vila leva à Terra e a cada hunt; cada hunt tem saída', () => {
  const terra = PORTAIS.filter(o => o.planet === 'terra');
  assert.deepEqual(terra.flatMap(o => o.destinos).sort(), PLANETAS_DE_HUNT.map(p => p.vila).sort());
  for (const mundo of PLANETAS_DE_HUNT) {
    const daVila = PORTAIS.filter(o => o.planet === mundo.id && o.area === mundo.vila).flatMap(o => o.destinos);
    assert.deepEqual(daVila.sort(), ['terra', ...mundo.hunts].sort(), mundo.id + ': portais da Vila');
    for (const id of mundo.hunts) {
      const saida = PORTAIS.filter(o => o.planet === mundo.id && o.area === id);
      assert.equal(saida.length, 1, id + ': uma saída');
      assert.deepEqual([...saida[0].destinos].sort(), [mundo.vila, ...mundo.hunts.filter(h => h !== id)].sort());
    }
  }
  for (const o of PORTAIS) {
    for (const d of o.destinos) assert.ok(lugar(d), o.id + ' → ' + d + ' existe');
    if (o.area) assert.ok(podeAndar(o.planet, o.x, o.y, o.area), o.id + ' fica em chão andável da área');
  }
});

test('mercador só atende quem está no mesmo planeta e na mesma área', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.99 }), p = game.addPlayer('a');
  const m = MERCADORES[0];
  game.levar(p, lugar(m.area)); p.x = m.x; p.y = m.y + 40;
  assert.equal(game.buy(p, 'food').ok, true, 'perto do mercador, na Vila');
  p.planet = 'terra'; p.area = null;
  assert.equal(game.buy(p, 'food').ok, false, 'mesmas coordenadas em outro planeta');
});

test('mobs nascem no planeta da área deles', () => {
  const game = new Game({ now: 1000, random: () => 0.5 });
  assert.ok(game.mobs.size > 0);
  for (const m of game.mobs.values()) assert.equal(m.planet, lugar(m.area).planet, m.type + ' em ' + m.area);
});

test('casas e árvores só bloqueiam no planeta delas', () => {
  const casa = HOUSES[0], arvore = DECORACAO.find(d => d.raio);
  assert.equal(casaBloqueia(casa.planet, casa.x, casa.pegada.centro), true);
  assert.equal(casaBloqueia('outro', casa.x, casa.pegada.centro), false);
  assert.equal(decoracaoBloqueia(arvore.planet, arvore.x, arvore.y), true);
  assert.equal(decoracaoBloqueia('outro', arvore.x, arvore.y), false);
});

test('árvores e cristais da Floresta Seca bloqueiam pela base na máscara do Planeta Vegeta', async () => {
  const { VEGETA_OBJETOS } = await import('../public/art/vegeta-objetos.mjs');
  for (const objeto of VEGETA_OBJETOS) {
    const x = objeto.x * PLANETS.vegeta.escala, y = objeto.y * PLANETS.vegeta.escala;
    assert.equal(podeAndar('vegeta', x, y, 'vegeta-floresta'), false, objeto.id + ': a base está marcada como obstáculo');
  }
});

test('Planeta Vegeta: caça automática roda cada uma das 5 hunts no nível recomendado sem travar', async () => {
  const { statsFor } = await import('../public/shared/characters.mjs');
  for (const area of PLANETS.vegeta.hunts) {
    const game = new Game({ now: 1000, random: () => 0.5 }), p = game.addPlayer('a'), nivel = lugar(area).nivel[0];
    p.level = nivel; p.stats = statsFor(nivel); p.hp = p.stats.hp; p.ki = p.stats.ki;
    game.levar(p, lugar(area)); game.action(p.id, { type: 'hunt' });
    const mobs = [...game.mobs.values()].filter(m => m.area === area);
    assert.ok(mobs.length >= 10, area + ': mobs suficientes (' + mobs.length + ')');
    // Morrer desliga a caça; o jogador religa ao voltar (aqui, logo que renasce).
    for (let i = 0; i < 120 / 0.05; i++) { game.tick(0.05); if (p.hp > 0 && !p.autoHunt) game.action(p.id, { type: 'hunt' }); }
    // Planícies e Cânions são de propósito duros no nível mínimo (Pedro, 05/11): 3 abates em 2 min já é caça viva.
    assert.ok(p.kills >= 3, area + ': só ' + p.kills + ' abates em 2 min');
    assert.equal(p.planet, 'vegeta'); assert.equal(p.area, area, area + ': saiu da hunt');
  }
});

test('Namekusei: caça automática cruza as 3 hunts sem ficar presa em água ou obstáculos', async () => {
  const { statsFor } = await import('../public/shared/characters.mjs');
  for (const area of PLANETS.namek.hunts) {
    const game = new Game({ now: 1000, random: () => 0.5 }), p = game.addPlayer('a'), nivel = lugar(area).nivel[0];
    p.level = nivel; p.stats = statsFor(nivel); p.hp = p.stats.hp; p.ki = p.stats.ki;
    game.levar(p, lugar(area)); game.action(p.id, { type: 'hunt' });
    for (let i = 0; i < 60 / 0.05; i++) game.tick(0.05);
    assert.ok(p.kills >= 5, area + ': só ' + p.kills + ' abates em 60 s');
    assert.ok(p.hp > 0, area + ': permaneceu vivo');
    assert.equal(p.area, area); assert.equal(p.autoHunt, true);
  }
});

test('Planícies Vermelhas: Tsufurujin Guerreiro < General < Hatchiyack, os três socam e disparam ki', async () => {
  const { SOCA_E_ATIRA } = await import('../public/shared/game.mjs');
  const game = new Game({ now: 1000, random: () => 0.5 });
  const mobs = [...game.mobs.values()].filter(m => m.area === 'vegeta-planicies');
  const n = t => mobs.filter(m => m.type === t).length;
  assert.deepEqual([n('tsufuruGuerreiro'), n('tsufuruGeneral'), n('hatchiyack')], [8, 5, 3]);
  const [g, m, h] = ['tsufuruGuerreiro', 'tsufuruGeneral', 'hatchiyack'].map(t => mobs.find(x => x.type === t));
  assert.ok(g.maxHp < m.maxHp && m.maxHp < h.maxHp && g.attack < m.attack && m.attack < h.attack && g.xp < m.xp && m.xp < h.xp);
  assert.deepEqual([g.name, m.name, h.name], ['Tsufurujin Guerreiro', 'Tsufurujin General', 'Hatchiyack']);
  for (const t of ['tsufuruGuerreiro', 'tsufuruGeneral', 'hatchiyack']) assert.ok(SOCA_E_ATIRA.has(t));
});

test('Cânions: Nappa < Raditz < Bardock, 10 na hunt (5 / 3 / 2), os três socam e disparam ki', async () => {
  const { SOCA_E_ATIRA } = await import('../public/shared/game.mjs');
  const game = new Game({ now: 1000, random: () => 0.5 });
  const mobs = [...game.mobs.values()].filter(m => m.area === 'vegeta-canions');
  const n = t => mobs.filter(m => m.type === t).length;
  assert.deepEqual([n('nappa'), n('raditz'), n('bardock')], [5, 3, 2]);
  const [a, b, c] = ['nappa', 'raditz', 'bardock'].map(t => mobs.find(x => x.type === t));
  assert.ok(a.maxHp < b.maxHp && b.maxHp < c.maxHp && a.attack < b.attack && b.attack < c.attack && a.xp < b.xp && b.xp < c.xp);
  assert.deepEqual([a.name, b.name, c.name], ['Nappa', 'Raditz', 'Bardock']);
  for (const t of ['nappa', 'raditz', 'bardock']) assert.ok(SOCA_E_ATIRA.has(t));
});
