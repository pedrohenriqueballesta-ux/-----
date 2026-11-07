import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TELEPORTE, RelogioTeleport, enquadramentoTeleport, criarTransicaoTeleport } from '../public/render/teleporte.mjs';

test('16 quadros do GIF em exatamente 1,5 segundo, viagem única no trecho coberto e término sem loop', () => {
  assert.equal(TELEPORTE.passo * 16, 1.5);
  const r = new RelogioTeleport(); r.iniciar('vila');
  const quadros = [], viagens = [];
  for (let i = 0; i < 16; i++) {
    const e = r.atualizar(i === 0 ? 0 : TELEPORTE.passo, true);
    quadros.push(e.quadro);
    if (e.viajar) { viagens.push(e.quadro); r.confirmada = true; }
  }
  assert.deepEqual(quadros, Array.from({ length: 16 }, (_, i) => i));
  assert.deepEqual(viagens, [9]);
  assert.ok(TELEPORTE.troca < TELEPORTE.duracao - TELEPORTE.fadeSaida, 'mapa troca antes de começar o fade');
  r.atualizar(TELEPORTE.passo, true);
  assert.equal(r.ativa, false);
  assert.deepEqual(r.atualizar(10, true), { quadro: -1, viajar: false });
});

test('aguarda confirmação e mapa pronto no frame 12, sem repetir a requisição', () => {
  const r = new RelogioTeleport(); r.iniciar('media');
  let viagens = 0;
  for (let i = 0; i < 40; i++) { if (r.atualizar(0.1, true).viajar) viagens++; }
  assert.equal(viagens, 1); assert.equal(r.atualizar(0, true).quadro, 12);
  r.confirmada = true;
  assert.equal(r.atualizar(0.5, false).quadro, 12);
  assert.equal(r.atualizar(2 * TELEPORTE.passo + 0.001, true).quadro, 15);
  assert.equal(r.iniciar('terra'), false, 'ignora clique repetido');
});

test('erro ou espera excessiva libera a transição, permitindo tentar outra viagem', () => {
  const r = new RelogioTeleport(); r.iniciar('vila');
  r.erro = 'Servidor recusou'; r.atualizar(0.1);
  assert.equal(r.ativa, false);
  assert.equal(r.iniciar('terra'), true);
  r.atualizar(TELEPORTE.limiteEspera + TELEPORTE.revelar);
  assert.equal(r.ativa, false); assert.ok(r.erro);
});

test('16 frames extraídos do GIF e enquadramento sem deformar ou cortar a logo', async () => {
  assert.equal(TELEPORTE.imagens.length, 16);
  for (const arquivo of TELEPORTE.imagens) {
    const png = await readFile(new URL('../public' + arquivo, import.meta.url));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [414, 231]);
  }
  for (const [w, h] of [[1920,1080], [3440,1440], [390,844], [768,1024], [320,568]]) {
    const g = enquadramentoTeleport(w, h);
    assert.ok(Math.abs(g.w / g.h - 414 / 231) < 1e-9);
    assert.ok(g.x >= -1e-9 && g.y >= -1e-9 && g.w <= w + 1e-9 && g.h <= h + 1e-9);
    assert.ok(g.fundoW >= w - 1e-9 && g.fundoH >= h - 1e-9);
  }
});

test('integração da transição: confirma destino antes de revelar; erro de imagem não viaja', async () => {
  const originais = Object.fromEntries(['Image','document','window','requestAnimationFrame'].map(k => [k, globalThis[k]]));
  try {
    let falharImagem = false, recusar = false, removida = false, pronto = false, viagens = 0, concluidas = 0;
    const fila = [], avisos = [], desenhos = [];
    const ctx = { clearRect() {}, save() {}, restore() {}, drawImage(...args) { desenhos.push(args); } };
    globalThis.Image = class { decode() { return falharImagem ? Promise.reject(new Error('PNG indisponível')) : Promise.resolve(); } };
    globalThis.window = { innerWidth: 390, innerHeight: 844 };
    globalThis.document = { body: { append() {} }, createElement: () => ({ style: {}, setAttribute() {}, getContext: () => ctx, remove() { removida = true; } }) };
    globalThis.requestAnimationFrame = cb => fila.push(cb);
    const t = criarTransicaoTeleport({ viajar: async id => { assert.equal(id, 'vila'); viagens++; return recusar ? { ok: false, reason: 'Chegue perto de um portal para viajar.' } : { ok: true }; },
      pronto: () => pronto, concluir: () => concluidas++, avisar: s => avisos.push(s) });
    await t.iniciar('vila');
    assert.equal(t.ativa, true);
    await t.iniciar('vila');
    let agora = performance.now();
    for (let i = 0; i < 45; i++) {
      const cb = fila.shift(); assert.ok(cb);
      agora += 100; cb(agora); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    }
    assert.equal(viagens, 1); assert.equal(t.ativa, true); assert.equal(concluidas, 0);
    // O destino só fica pronto depois que a animação já está segurando a cobertura.
    pronto = true;
    for (let i = 0; i < 15 && fila.length; i++) {
      agora += 100; fila.shift()(agora); await Promise.resolve();
    }
    assert.equal(t.ativa, false); assert.equal(removida, true); assert.equal(concluidas, 1);
    assert.deepEqual(avisos, []); assert.ok(desenhos.length > 36);
    recusar = true;
    await t.iniciar('vila');
    agora = performance.now();
    for (let i = 0; i < 25 && fila.length; i++) {
      agora += 100; fila.shift()(agora); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    }
    assert.equal(t.ativa, false); assert.equal(viagens, 2); assert.equal(concluidas, 2);
    assert.deepEqual(avisos, ['Chegue perto de um portal para viajar.']);
    falharImagem = true;
    await t.iniciar('vila');
    assert.equal(viagens, 2); assert.equal(t.ativa, false); assert.equal(concluidas, 3);
    assert.deepEqual(avisos, ['Chegue perto de um portal para viajar.', 'PNG indisponível']);
  } finally {
    for (const [k, v] of Object.entries(originais)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; }
  }
});
