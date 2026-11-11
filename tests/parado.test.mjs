import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image = class { complete = true; naturalWidth = 1024; };
const { Game } = await import('../public/shared/game.mjs');
const { PARADO } = await import('../public/art/parado.mjs');
const { drawWalk } = await import('../public/art/atlas.mjs');
const { art } = await import('../public/art/assets.mjs');
const { VOADORES } = await import('../public/art/voadores.mjs');

// Tipo de mob no mundo → `kind` da caminhada (PASSO). Os que voam pairam parados e ficam de fora (Pedro, 10/11/2026).
const KIND = { subboss: 'alien', freezaBoss: 'freezaPe' };
test('todo mob que anda no mundo tem folha PARADO (5×4) com a imagem registrada', () => {
  const tipos = new Set([...new Game({ now: 1000 }).mobs.values()].map(m => m.type).filter(t => !(t in VOADORES)));
  assert.ok(tipos.size >= 20);
  for (const t of tipos) {
    const kind = KIND[t] || t, p = PARADO[kind];
    assert.ok(p, t + ': sem folha PARADO');
    assert.equal(p[0].rows, 5, t); assert.equal(p[0].columns, 4, t); assert.ok(art[p[1]], t + ': imagem não registrada');
  }
});

test('parado desenha a folha PARADO e respira; andando desenha a caminhada', () => {
  for (const kind of Object.keys(PARADO)) {
    const usadas = [], ctx = { save() {}, restore() {}, translate() {}, scale() {}, drawImage(img, sx) { usadas.push([img, sx]); } };
    for (const t of [0, .34, .67, 1]) assert.ok(drawWalk(ctx, kind, { x: 0, y: 0, travelled: 0 }, 70, { x: 0, y: 1 }, false, 96, 0, t), kind);
    assert.ok(usadas.every(([img]) => img === art[PARADO[kind][1]]), kind + ': parado usa a folha PARADO');
    assert.equal(new Set(usadas.map(([, sx]) => sx)).size, 4, kind + ': 4 quadros de respiração');
    usadas.length = 0; drawWalk(ctx, kind, { x: 0, y: 0, travelled: 30 }, 70, { x: 0, y: 1 }, true, 96, 0, 1);
    assert.ok(usadas.length && usadas.every(([img]) => img !== art[PARADO[kind][1]]), kind + ': andando não usa a folha PARADO');
  }
});
