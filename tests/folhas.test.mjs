import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// Todas as folhas desenhadas (art/*-passo.mjs e art/*-golpe.mjs) entram aqui sozinhas.
const pasta = new URL('../public/art/', import.meta.url);
const modulos = (await readdir(pasta, {recursive: true}))
  .map(n => n.split('\\').join('/'))
  .filter(n => /-(passo|golpe)\.mjs$/.test(n)).sort();

test('existem folhas desenhadas para conferir', () => {
  assert.ok(modulos.some(n => n.endsWith('/goku-passo.mjs')) && modulos.some(n => n.endsWith('/saibaman-passo.mjs')), modulos.join(', '));
});

for (const nome of modulos) {
  test('folha desenhada ' + nome + ': 5 direções x 4 quadros dentro do PNG, âncora no chão', async () => {
    const sheet = Object.values(await import(new URL(nome, pasta)))[0];
    const bytes = await readFile(new URL('../public' + sheet.file, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), sheet.width);
    assert.equal(bytes.readUInt32BE(20), sheet.height);
    assert.equal(bytes[25], 6, 'PNG RGBA mantém transparência');
    assert.equal(sheet.frames.length, sheet.rows);
    for (const row of sheet.frames) {
      assert.equal(row.length, sheet.columns);
      assert.equal(new Set(row.map(f => f[0] + ',' + f[1])).size, sheet.columns, 'quadros distintos');
      for (const [x, y, w, h, ax, ay] of row) {
        assert.ok(x >= 0 && y >= 0 && x + w <= sheet.width && y + h <= sheet.height);
        assert.ok(ax > x && ax < x + w && ay > y && ay <= y + h);
      }
    }
    assert.ok(sheet.idleColumn >= 0 && sheet.idleColumn < sheet.columns);
  });
}

test('caminhada e golpe do mesmo personagem têm a mesma escala', async () => {
  const pares = modulos.filter(n => n.endsWith('-passo.mjs')).map(n => [n, n.replace('-passo', '-golpe')]).filter(([, g]) => modulos.includes(g));
  for (const [p, g] of pares) {
    const passo = Object.values(await import(new URL(p, pasta)))[0], golpe = Object.values(await import(new URL(g, pasta)))[0];
    assert.ok(Math.abs(passo.referenceHeight - golpe.referenceHeight) <= 6, p + ' x ' + g);
  }
});
