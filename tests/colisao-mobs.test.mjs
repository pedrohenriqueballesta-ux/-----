import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { OBSTACLES } from '../public/shared/config.mjs';

function cena() {
  const game = new Game({ populate: false });
  const mob = (x, y, corpo = 0) => {
    const m = game.addMob('melee', 4000, 2000);
    Object.assign(m, { planet: 'terra', area: null, x, y, corpo });
    return m;
  };
  return { game, mob };
}

test('mobs não atravessam uns aos outros mesmo com deslocamento grande', () => {
  const { game, mob } = cena(), a = mob(100, 100), b = mob(200, 100);
  game.move(a, 1, 0, 1, 400);
  assert.ok(a.x <= b.x - 44);
});

test('jogador atravessa um cerco de mobs e gigantes sem ser bloqueado ou empurrado', () => {
  const { game, mob } = cena(), p = game.addPlayer('jogador');
  Object.assign(p, { planet: 'terra', area: null, x: 300, y: 300 });
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    mob(300 + Math.cos(a) * 110, 300 + Math.sin(a) * 110, i % 2 ? 34 : 0);
  }
  const gigante = mob(300, 300, 62);
  game.separarMobs();
  assert.deepEqual([p.x, p.y], [300, 300], 'a separação não empurra o jogador');
  for (let i = 0; i < 20; i++) game.move(p, 1, 0, 0.05, 200);
  assert.deepEqual([p.x, p.y], [500, 300], 'sai do cerco atravessando os corpos');
  game.move(p, gigante.x - p.x, gigante.y - p.y, 1, 1);
  assert.deepEqual([p.x, p.y], [gigante.x, gigante.y], 'pode ocupar o mesmo ponto de um mob');
});

test('separa um grupo empilhado, incluindo gigantes', () => {
  const { game, mob } = cena();
  const grupo = [mob(300, 300), mob(300, 300), mob(300, 300, 34), mob(300, 300)];
  game.separarMobs();
  for (let i = 0; i < grupo.length; i++) for (let j = i + 1; j < grupo.length; j++) {
    const a = grupo[i], b = grupo[j];
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= game.raioMob(a) + game.raioMob(b) - 0.02);
  }
});

test('corpos mortos e mobs de outro lugar não bloqueiam movimento', () => {
  const { game, mob } = cena(), a = mob(100, 100), b = mob(200, 100), c = mob(250, 100);
  b.hp = 0; c.area = 'outro';
  game.move(a, 1, 0, 1, 200);
  assert.equal(a.x, 300);
});

test('separação respeita estruturas e movimento não atravessa paredes', () => {
  const { game, mob } = cena();
  const parede = { planet: 'terra', x: 200, y: 200, r: 30 };
  OBSTACLES.push(parede);
  try {
    const a = mob(140, 200), b = mob(140, 200);
    game.separarMobs();
    for (const m of [a, b]) assert.ok(Math.hypot(m.x - 200, m.y - 200) >= 52);
    const c = mob(100, 200, 34);
    game.move(c, 1, 0, 1, 400);
    assert.ok(c.x < 200);
  } finally { OBSTACLES.splice(OBSTACLES.indexOf(parede), 1); }
});
