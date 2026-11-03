import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLANETS } from '../public/shared/index.mjs';
import { naEscala } from '../public/shared/config.mjs';
import { podeAndar, emTerra } from '../public/shared/passagem.mjs';

const world = () => new Game({ now: 1000, populate: false, random: () => 0.99 });

test('Namekusei: mar bloqueia, praça da Vila e chegada são caminháveis, Terra é livre', () => {
  assert.equal(podeAndar('namek', 60, 60), false, 'canto do mapa é mar');
  // Pontos em px da imagem do solo, levados para o mundo pela escala.
  assert.equal(podeAndar('namek', naEscala(3000), naEscala(1860)), false, 'mar entre a nave e o campo de batalha');
  assert.equal(podeAndar('namek', naEscala(1140), naEscala(2940)), false, 'mar ao sul');
  const { x, y } = PLANETS.namek.spawn;
  assert.equal(podeAndar('namek', x, y), true, 'chegada na praça da Vila');
  assert.equal(podeAndar('terra', 60, 60), true);
});

test('o personagem para na beira da água e não entra no mar', () => {
  const game = world(), p = game.addPlayer('a');
  p.planet = 'namek'; p.x = PLANETS.namek.spawn.x; p.y = PLANETS.namek.spawn.y;
  for (let i = 0; i < 400; i++) { game.setInput(p.id, { x: -1, y: 0 }); game.tick(0.05); }
  assert.equal(podeAndar('namek', p.x, p.y), true, 'continua em terra');
  assert.ok(p.x > 15, 'parou antes da borda do mapa');
});

test('quem nasce dentro da água consegue sair dela', () => {
  const game = world(), p = game.addPlayer('a');
  p.planet = 'namek'; p.x = 60; p.y = 60;
  const x = p.x; game.setInput(p.id, { x: 1, y: 0 }); game.tick(0.1);
  assert.ok(p.x > x, 'não fica preso no mar');
});

test('regiões e mobs de Namekusei ficam em terra firme, e o mercador na Vila', async () => {
  const { ZONES, MERCHANT } = await import('../public/shared/config.mjs');
  const game = new Game({ now: 1000, random: () => 0.5 });
  const mobs = [...game.mobs.values()];
  assert.ok(mobs.filter(m => m.area === 'inicial').length >= 12, 'Planícies com mobs suficientes');
  assert.ok(mobs.filter(m => m.area === 'media').length >= 8, 'Campo de Batalha com mobs suficientes');
  assert.ok(mobs.filter(m => m.area === 'dificil').length >= 8, 'Planalto com mobs suficientes');
  assert.equal(mobs.filter(m => m.area === 'vila').length, 0, 'Vila sem mobs');
  for (const m of mobs) assert.equal(podeAndar('namek', m.x, m.y, m.area), true, m.name + ' nasceu na água ou fora da área');
  assert.equal(podeAndar('namek', MERCHANT.x, MERCHANT.y), true);
  const vila = ZONES.find(z => z.id === 'vila');
  assert.ok(MERCHANT.x > vila.x && MERCHANT.x < vila.x + vila.w && MERCHANT.y > vila.y && MERCHANT.y < vila.y + vila.h, 'mercador dentro da Vila');
  const { x, y } = PLANETS.namek.spawn;
  assert.ok(x > vila.x && x < vila.x + vila.w && y > vila.y && y < vila.y + vila.h, 'chegada dentro da Vila (segura)');
});

test('a predição do cliente para na beira da água no mesmo ponto que o servidor', async () => {
  const { deslocar } = await import('../public/shared/passagem.mjs');
  const game = world(), p = game.addPlayer('a');
  p.planet = 'namek'; p.x = PLANETS.namek.spawn.x; p.y = PLANETS.namek.spawn.y;
  for (let i = 0; i < 400; i++) { game.setInput(p.id, { x: 1, y: 0 }); game.tick(0.05); }
  assert.ok(p.x > naEscala(900) && p.x < naEscala(1100), 'parou no mar a leste da Vila, não na borda do mapa (x=' + Math.round(p.x) + ')');
  // Encostado na água, a predição não pode avançar mais do que o servidor aceitaria.
  const [px, py] = deslocar('namek', p.x, p.y, 1, 0, p.stats.mobility * 0.2);
  assert.deepEqual([px, py], [p.x, p.y]);
});

test('ruínas bloqueiam pela base e não tapam a chegada nem o mercador (casas da Vila fora do mapa por ora)', async () => {
  const { HOUSES, MERCHANT, frenteDaCasa } = await import('../public/shared/config.mjs');
  assert.equal(HOUSES.filter(c => !c.ruina).length, 0, 'casas da Vila guardadas, fora do mapa');
  for (const c of HOUSES) {
    const f = frenteDaCasa(c, c.x);
    assert.equal(podeAndar('namek', c.x, f - 25), false, 'logo atrás da frente da base da ruína ' + c.sprite + ' bloqueia');
  }
  const { x, y } = PLANETS.namek.spawn;
  assert.equal(podeAndar('namek', x, y), true);
  assert.equal(podeAndar('namek', MERCHANT.x, MERCHANT.y), true);
});

test('casas destruídas ficam no Campo de Batalha, em terra, longe do subchefe', async () => {
  const { HOUSES, ZONES } = await import('../public/shared/config.mjs');
  const campo = ZONES.find(z => z.id === 'media'), ruinas = HOUSES.filter(c => c.ruina);
  assert.equal(ruinas.length, 6);
  const game = new Game({ now: 1000, random: () => 0.5 }), chefe = [...game.mobs.values()].find(m => m.type === 'subboss');
  for (const c of ruinas) {
    assert.ok(c.x > campo.x && c.x < campo.x + campo.w && c.y > campo.y && c.y < campo.y + campo.h, 'ruína ' + c.sprite + ' fora do Campo de Batalha');
    assert.ok(emTerra('namek', c.x, c.y));
    assert.ok(Math.hypot(c.x - chefe.x, c.y - chefe.y) > c.w / 2 + 200, 'ruína ' + c.sprite + ' em cima do chefe');
  }
  for (const m of game.mobs.values()) assert.equal(podeAndar('namek', m.x, m.y), true, m.name + ' nasceu dentro de uma casa');
});

test('encostado numa ruína, a predição do cliente para no mesmo ponto que o servidor', async () => {
  const { deslocar } = await import('../public/shared/passagem.mjs');
  const { HOUSES } = await import('../public/shared/config.mjs');
  const casa = HOUSES.find(c => c.ruina && c.sprite === 5), game = world(), p = game.addPlayer('a');
  // Vem de baixo, pela frente da casa, ao lado da porta, e anda para cima até a parede.
  p.planet = 'namek'; p.x = casa.x - casa.w * 0.3; p.y = casa.y + 40;
  for (let i = 0; i < 100; i++) { game.setInput(p.id, { x: 0, y: -1 }); game.tick(0.05); }
  assert.ok(p.y > casa.y - 6 && p.y < casa.y + 20, 'parou na base da casa (y=' + Math.round(p.y) + ')');
  const [px, py] = deslocar('namek', p.x, p.y, 0, -1, p.stats.mobility * 0.2);
  assert.deepEqual([px, py], [p.x, p.y]);
});

test('áreas fechadas: não se anda de uma área para outra, mesmo onde o chão continua', async () => {
  const { ZONES } = await import('../public/shared/config.mjs');
  const { deslocar } = await import('../public/shared/passagem.mjs');
  const inicial = ZONES.find(z => z.id === 'inicial');
  // Ponte de terra entre as Planícies e o Planalto: a borda leste da área inicial é um corte reto.
  const y = naEscala(1230), x = inicial.x + inicial.w - 20;
  assert.equal(podeAndar('namek', x + 40, y), true, 'há chão do outro lado do corte');
  assert.equal(podeAndar('namek', x + 40, y, 'inicial'), false, 'mas fora da área inicial');
  let px = x; for (let i = 0; i < 20; i++) [px] = deslocar('namek', px, y, 1, 0, 10, 15, 'inicial');
  assert.ok(px <= inicial.x + inicial.w, 'o passo para na borda da área');
});

test('cada portal fica em chão andável e é alcançável a pé da chegada da sua área', async () => {
  const { PORTAIS, lugar } = await import('../public/shared/config.mjs');
  const { pesLivres, caminhoPorTerra } = await import('../public/shared/passagem.mjs');
  for (const o of PORTAIS) {
    assert.ok(pesLivres(o.planet, o.x, o.y, 15, o.area), o.id + ' em lugar bloqueado');
    for (const d of o.destinos) assert.ok(lugar(d), o.id + ' leva a um destino que não existe: ' + d);
    if (o.area) assert.ok(caminhoPorTerra('namek', lugar(o.area).chegada, o, o.area), o.id + ' sem caminho a pé desde a chegada');
  }
});
