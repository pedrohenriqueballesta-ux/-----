import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { FOLHAS_VEGETA_GOD } from '../public/art/personagens/vegeta/vegeta-folhas.mjs';
import { DIRECTIONS } from '../public/render/mapa/camera.mjs';

test('as sete folhas God mantêm a grade 5×4, alfa e originais verificados pelo manifesto', async () => {
  const pasta = new URL('../public/assets/vegeta/god/', import.meta.url);
  const fontes = new URL('fontes/', pasta);
  const manifesto = JSON.parse(await readFile(new URL('MANIFESTO.json', fontes), 'utf8'));
  const folhas = Object.values(FOLHAS_VEGETA_GOD);
  assert.equal(folhas.length, 7);
  for (const [folha] of folhas) {
    const nome = folha.file.split('/').at(-1);
    const png = await readFile(new URL(nome, pasta));
    const fonte = await readFile(new URL(nome, fontes));
    assert.equal(createHash('sha256').update(fonte).digest('hex'), manifesto.find(f => f.arquivo.endsWith('/' + nome)).sha256);
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1536);
    assert.equal(png[25], 6);
    assert.equal(folha.frames.length, 5);
    for (const [r, linha] of folha.frames.entries()) {
      assert.equal(linha.length, 4);
      for (const [c, [x, y, w, h, ax, ay]] of linha.entries()) {
        assert.equal(x, c * 256);
        assert.equal(y, Math.round(r * 1536 / 5));
        assert.equal(ax, x + 128);
        assert.ok(x + w <= 1024 && y + h <= 1536 && ay > y && ay < y + h);
      }
    }
  }
});

test('God usa a folha certa em cada ação e espelha só as três direções à esquerda', async t => {
  const imagemAnterior = globalThis.Image;
  globalThis.Image = class { complete = true; naturalWidth = 1024; };
  t.after(() => {
    if (imagemAnterior === undefined) delete globalThis.Image;
    else globalThis.Image = imagemAnterior;
  });
  const { drawVegeta } = await import('../public/art/personagens/vegeta/vegeta.mjs');
  const { art } = await import('../public/art/assets.mjs');
  const casos = [
    ['parado', {}, null], ['andar', { moving: true }, null], ['soco', {}, .5],
    ['rajada', { rajadaStarted: .9 }, null], ['galick', { galick: { castStarted: 0, started: .65 } }, null],
    ['finalFlash', { finalFlash: { started: .8 } }, null], ['bigBang', { bigBang: { started: .8 } }, null]
  ];
  for (const [acao, estado, soco] of casos) {
    for (const [i, facing] of DIRECTIONS.entries()) {
      const espelhos = [], desenhos = [];
      const ctx = { save() {}, restore() {}, translate() {}, scale: (...args) => espelhos.push(args), drawImage: (...args) => desenhos.push(args) };
      assert.ok(drawVegeta(ctx, { forma: 'ssjGod', transformed: true, facing, ...estado }, { x: 10, y: 20 }, 1, soco));
      assert.deepEqual(espelhos, i >= 1 && i <= 3 ? [[-1, 1]] : []);
      assert.equal(desenhos[0][0], art[FOLHAS_VEGETA_GOD[acao][1]]);
    }
  }
});
