import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { RAIOS_POR_FORMA } from '../public/art/raios-transformacoes.mjs';
import { descargaTransformacao, desenharRaiosTransformacao } from '../public/render/vfx/raios-transformacao.mjs';

test('a folha única é RGBA em grade 6 × 6 de células 211 × 206', async () => {
  const url = new URL('../public/assets/skills/raios-transformacao/aura_raios_universal_36f_rgba.png', import.meta.url);
  const folha = await readFile(url);
  assert.equal(folha.readUInt32BE(16), 211 * 6);
  assert.equal(folha.readUInt32BE(20), 206 * 6);
  assert.equal(folha[24], 8);
  assert.equal(folha[25], 6);
});

test('descargas variam por jogador e forma, com cadência estável e os 36 quadros', () => {
  assert.deepEqual(Object.keys(RAIOS_POR_FORMA), ['vegeta']);
  assert.deepEqual(Object.keys(RAIOS_POR_FORMA.vegeta), ['ssj', 'ssjGod', 'ssjBlue', 'ultraEgo']);
  for (const [forma, config] of Object.entries(RAIOS_POR_FORMA.vegeta)) {
    const semPausa = { ...config, pausa: 0 };
    const quadros = new Set();
    let inicio, quadroAnterior;
    let viuPausa = false;
    for (let ms = 0; ms < 60000; ms++) {
      const tempo = ms / 1000;
      const { quadro, opacidade } = descargaTransformacao('vegeta-1', forma, tempo, semPausa);
      if (quadro !== quadroAnterior) {
        if (inicio > 0) assert.ok(ms - inicio >= config.intervaloMs[0] && ms - inicio <= config.intervaloMs[1]);
        inicio = ms;
        quadroAnterior = quadro;
      }
      assert.ok(opacidade > 0 && opacidade <= config.opacidade);
      quadros.add(quadro);
      viuPausa ||= descargaTransformacao('vegeta-1', forma, tempo, config) === null;
    }
    assert.equal(quadros.size, 36);
    assert.ok(viuPausa);
    const sequencia = id => Array.from({ length: 30 }, (_, i) => descargaTransformacao(id, forma, i / 8, config));
    assert.deepEqual(sequencia('vegeta-1'), sequencia('vegeta-1'));
    assert.notDeepEqual(sequencia('vegeta-1'), sequencia('vegeta-2'));
  }
});

test('reutiliza a textura e aplica o reforço de cada paleta em uma passada', t => {
  const imagens = [], texturas = [], desenhos = [];
  const original = [255, 255, 255, 0, 255, 255, 255, 64, 255, 255, 255, 255];
  globalThis.Image = class {
    constructor() { imagens.push(this); }
  };
  globalThis.document = { createElement: () => {
    const tela = { getContext: () => ({
      drawImage() {},
      getImageData: () => ({ data: new Uint8ClampedArray(original) }),
      putImageData: ({ data }) => { tela.pixels = [...data]; }
    }) };
    texturas.push(tela);
    return tela;
  } };
  t.after(() => { delete globalThis.Image; delete globalThis.document; });
  const ctx = {
    globalAlpha: .5,
    save() { this.alphaAnterior = this.globalAlpha; },
    restore() { this.globalAlpha = this.alphaAnterior; },
    drawImage(...args) { desenhos.push({ args, alpha: this.globalAlpha }); }
  };
  const jogador = { id: 'v1', vocacao: 'vegeta', forma: 'ssj' };
  const desenhar = (alteracoes = {}, pos = { x: 30, y: 80 }, tempo = 0) =>
    desenharRaiosTransformacao(ctx, { ...jogador, ...alteracoes }, pos, tempo, 70, RAIOS_POR_FORMA);
  for (const alteracoes of [{ forma: 'base' }, { forma: 'majin' }, { forma: 'ssj4' }, { forma: 'ssj2' },
    { vocacao: 'goku' }, { dead: true }]) assert.equal(desenhar(alteracoes), false);
  assert.equal(imagens.length, 0);
  assert.equal(desenhar(), false);
  Object.assign(imagens[0], { complete: true, naturalWidth: 1266, naturalHeight: 1236 });
  const tempoAtivo = forma => Array.from({ length: 30 }, (_, i) => i / 10)
    .find(tempo => descargaTransformacao(jogador.id, forma, tempo, RAIOS_POR_FORMA.vegeta[forma]));
  const tempo = tempoAtivo('ssj');
  assert.ok(desenhar({}, undefined, tempo));
  assert.ok(desenhar({}, { x: 43, y: 74 }, tempo));
  assert.equal(texturas.length, 1);
  assert.deepEqual(texturas[0].pixels.filter((_, i) => i % 4 === 3), [0, 192, 255]);
  assert.notDeepEqual(texturas[0].pixels, original);
  assert.equal(desenhos[0].args[0], desenhos[1].args[0]);
  assert.equal(desenhos[1].args[5] - desenhos[0].args[5], 13);
  assert.equal(desenhos[1].args[6] - desenhos[0].args[6], -6);
  assert.ok(desenhos[0].alpha >= .5 * .96 * .85 && desenhos[0].alpha <= .5 * .96);
  assert.equal(ctx.globalAlpha, .5);
  for (const forma of ['ssjGod', 'ssjBlue', 'ultraEgo']) {
    assert.ok(desenhar({ forma }, undefined, tempoAtivo(forma)));
    assert.equal(desenhar({ forma: 'base' }), false);
  }
  assert.equal(texturas.length, 4);
  assert.equal(imagens.length, 1);
  assert.equal(desenhos.length, 5);
  assert.deepEqual(texturas[1].pixels.filter((_, i) => i % 4 === 3), [0, 224, 255]);
  assert.deepEqual(texturas[2].pixels.filter((_, i) => i % 4 === 3), [0, 224, 255]);
  assert.deepEqual(texturas[3].pixels.filter((_, i) => i % 4 === 3), [0, 224, 255]);
  assert.ok(desenhos[2].alpha >= .5 * .92 && desenhos[2].alpha <= .5);
  assert.ok(desenhos[3].alpha >= .5 * .92 && desenhos[3].alpha <= .5);
  assert.ok(desenhos[4].alpha >= .5 * .92 && desenhos[4].alpha <= .5);
  assert.equal(ctx.globalAlpha, .5);

  const god = RAIOS_POR_FORMA.vegeta.ssjGod;
  const medirAncora = quadro => {
    const instante = Array.from({ length: 600 }, (_, i) => i / 10)
      .find(tempo => descargaTransformacao(jogador.id, 'ssjGod', tempo, god)?.quadro === quadro);
    assert.ok(Number.isFinite(instante));
    assert.ok(desenhar({ forma: 'ssjGod' }, undefined, instante));
    const [, , , largura, , x, , larguraDesenhada] = desenhos.at(-1).args;
    return (30 - x) * largura / larguraDesenhada;
  };
  assert.ok(Math.abs(medirAncora(24) - 124.5) < 1e-9);
  assert.ok(Math.abs(medirAncora(17) - 94) < 1e-9);
});
