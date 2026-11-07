import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { lugar, OBSTACLES } from '../public/shared/config.mjs';
import { pesLivres, caminhoPorTerra } from '../public/shared/passagem.mjs';

function cena(area = 'inicial') {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar(area)); return { g, p };
}
function chegar(g, p) {
  for (let i = 0; i < 2400 && p.moveTo; i++) {
    g.tick(.05);
    assert.ok(pesLivres(p.planet, p.x, p.y, 15, p.area), 'permanece em chão válido');
  }
  assert.equal(p.moveTo, null, 'encerra a ordem de movimento');
  const fim = { x: p.x, y: p.y };
  for (let i = 0; i < 80; i++) g.tick(.05);
  assert.deepEqual({ x: p.x, y: p.y }, fim, 'não fica tremendo ou tentando novamente');
  assert.equal(p.moving, false);
}

test('clique na água é corrigido para a margem e para sem insistir no ponto original', () => {
  const { g, p } = cena(), alvo = { x: 2500, y: 2082 };
  assert.equal(pesLivres(p.planet, alvo.x, alvo.y, 15, p.area), false);
  g.action(p.id, { type: 'moveTo', ...alvo });
  const destino = { x: p.moveTo.x, y: p.moveTo.y };
  assert.notDeepEqual(destino, alvo);
  assert.ok(pesLivres(p.planet, destino.x, destino.y, 15, p.area));
  chegar(g, p);
  assert.ok(Math.hypot(p.x - destino.x, p.y - destino.y) < 2);
  // Um clique novo em terra continua funcionando após a parada.
  g.action(p.id, { type: 'moveTo', ...lugar('inicial').chegada }); chegar(g, p);
});

test('terra isolada por água usa somente a componente alcançável do jogador', () => {
  const { g, p } = cena('media'); p.x += 180;
  const alvo = { x: 5931, y: 3708 };
  assert.ok(pesLivres(p.planet, alvo.x, alvo.y, 15, p.area));
  assert.equal(caminhoPorTerra(p.planet, p, alvo, p.area), null);
  g.action(p.id, { type: 'moveTo', ...alvo });
  assert.notDeepEqual({ x: p.moveTo.x, y: p.moveTo.y }, alvo);
  chegar(g, p); assert.equal(p.area, 'media');
});

test('clique fora da hunt termina na borda caminhável sem atravessar para outro lugar', () => {
  const { g, p } = cena();
  g.action(p.id, { type: 'moveTo', x: 30, y: 30 });
  assert.ok(pesLivres(p.planet, p.moveTo.x, p.moveTo.y, 15, p.area));
  chegar(g, p); assert.equal(p.area, 'inicial');
});

test('clique dentro de uma estrutura para antes da colisão; teclado cancela a rota corrigida', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p'); p.x = 100; p.y = 300;
  const o = { planet: 'terra', x: 300, y: 300, r: 55 }; OBSTACLES.push(o);
  try {
    g.action(p.id, { type: 'moveTo', x: 300, y: 300 }); chegar(g, p);
    assert.ok(Math.hypot(p.x - o.x, p.y - o.y) >= 70);
    assert.ok(p.x > 220, 'chega ao limite acessível');
    g.action(p.id, { type: 'moveTo', x: 300, y: 300 });
    g.setInput(p.id, { x: -1, y: 0 }); assert.equal(p.moveTo, null);
  } finally { OBSTACLES.splice(OBSTACLES.indexOf(o), 1); }
});
