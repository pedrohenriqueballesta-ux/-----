import test from 'node:test';
import assert from 'node:assert/strict';

test('folhas pendentes ou ausentes usam reserva sem travar o desenho dos mobs de Vegeta', async () => {
  const imagemOriginal = globalThis.Image;
  globalThis.Image = class { complete = false; naturalWidth = 0; };
  try {
    const { loaded, art } = await import('../public/art/assets.mjs');
    const { drawLutador, LUTADORES } = await import('../public/art/lutadores.mjs');
    assert.equal(loaded(undefined), false);
    assert.equal(loaded(null), false);
    assert.equal(loaded({ complete: false, naturalWidth: 100 }), false);
    assert.equal(loaded({ complete: true, naturalWidth: 0 }), false);
    assert.equal(loaded({ complete: true, naturalWidth: 100 }), true);
    for (const tipo of Object.keys(LUTADORES)) {
      for (const moving of [false, true]) {
        assert.equal(drawLutador({}, tipo, 100, 100, moving, { x: 1, y: 0 }, 0), false, tipo);
      }
    }
    // Quando a folha chega, o desenho volta a usá-la normalmente, sem recarregar a página.
    Object.assign(art.nappaPasso, { complete: true, naturalWidth: 100 });
    let desenhou = false;
    const ctx = { save() {}, restore() {}, translate() {}, scale() {}, drawImage() { desenhou = true; } };
    assert.equal(drawLutador(ctx, 'nappa', 100, 100, false, { x: 1, y: 0 }, 0), true);
    assert.equal(desenhou, true);
  } finally {
    if (imagemOriginal === undefined) delete globalThis.Image;
    else globalThis.Image = imagemOriginal;
  }
});
