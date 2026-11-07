import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { BARREIRA_KI, quadroBarreira, desenharBarreira, carregarBarreira, removerFundoAzul } from '../public/render/barreira-ki.mjs';
import { Game } from '../public/shared/game.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';
import { statsFor } from '../public/shared/characters.mjs';

test('Barreira executa abertura uma vez, repete só 4–9 e remove após 10–15', () => {
  const efeito = { started: 100, until: 102.5 };
  assert.equal(quadroBarreira(efeito, 99.99), -1);
  for (let i = 0; i < 4; i++) assert.equal(quadroBarreira(efeito, 100 + i * 0.12), i);
  for (let i = 4; i < 21; i++) assert.equal(quadroBarreira(efeito, 100 + i * 0.12), 4 + (i - 4) % 6);
  for (let i = 0; i < 6; i++) assert.equal(quadroBarreira(efeito, 102.5 + i * 0.12), 10 + i);
  assert.equal(quadroBarreira(efeito, 103.22), -1);
  assert.equal(quadroBarreira(efeito, 110), -1);
  assert.equal(quadroBarreira(null, 100), -1);
});

test('PNG fornecido tem 16 células RGBA com fundo azul transparente', async () => {
  const png = await readFile(new URL('../public' + BARREIRA_KI.imagem, import.meta.url));
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  assert.deepEqual([w, h, png[24], png[25], png[28]], [1536, 1024, 8, 6, 0]);
  const partes = [];
  for (let p = 8; p < png.length;) {
    const n = png.readUInt32BE(p);
    if (png.toString('ascii', p + 4, p + 8) === 'IDAT') partes.push(png.subarray(p + 8, p + 8 + n));
    p += n + 12;
  }
  const bruto = inflateSync(Buffer.concat(partes)), stride = w * 4;
  let anterior = Buffer.alloc(stride), offset = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  const visiveis = new Array(16).fill(0);
  for (let y = 0; y < h; y++) {
    const filtro = bruto[offset++], linha = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? linha[x - 4] : 0, b = anterior[x], c = x >= 4 ? anterior[x - 4] : 0;
      linha[x] = bruto[offset++] + [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filtro];
    }
    removerFundoAzul(linha);
    for (let x = 0; x < w; x++) {
      const i = x * 4, alpha = linha[i + 3];
      if (linha[i] === 146 && linha[i + 1] === 242 && linha[i + 2] === 253) assert.equal(alpha, 0);
      if (alpha > 0) visiveis[Math.floor(y / 256) * 4 + Math.floor(x / 384)]++;
    }
    anterior = linha;
  }
  assert.ok(visiveis.every(n => n > 0), 'todos os quadros possuem arte visível');
});

test('render segue pés interpolados em oito direções e ataques; carrega imagem uma vez', () => {
  const original = globalThis.Image;
  const documentoOriginal = globalThis.document;
  let criadas = 0;
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData() {} }) }) };
  globalThis.Image = class { constructor() { criadas++; this.complete = false; this.naturalWidth = 0; } };
  try {
    const chamadas = [], ctx = { save() {}, restore() {}, drawImage(...args) { chamadas.push(args); } };
    const p = { barrier: { started: 0, until: 2.5 } };
    assert.equal(desenharBarreira(ctx, p, { x: 100, y: 200 }, 0.8), false);
    const img = carregarBarreira(); img.complete = true; img.naturalWidth = 1536;
    for (const level of [2, 20, 50, 100, 150]) for (let i = 0; i < 8; i++) {
      Object.assign(p, { level, facing: { x: Math.cos(i * Math.PI / 4), y: Math.sin(i * Math.PI / 4) }, moving: true, charge: { skill: 'kame' } });
      const pos = { x: 100 + i * 13, y: 200 + i * 7 };
      assert.equal(desenharBarreira(ctx, p, pos, 0.8), true);
      const a = chamadas.at(-1);
      assert.equal(a[5] + a[7] / 2, pos.x);
      assert.equal(a[6] + a[8] / 2, pos.y - BARREIRA_KI.centroAcimaDosPes);
      assert.deepEqual(a.slice(1, 5), [768, 256, 384, 256]);
    }
    assert.equal(criadas, 1);
    assert.equal(desenharBarreira(ctx, { ...p, dead: true }, { x: 0, y: 0 }, 0.8), false);
    assert.equal(desenharBarreira(ctx, p, { x: 0, y: 0 }, 3.22), false);
  } finally {
    if (original === undefined) delete globalThis.Image; else globalThis.Image = original;
    if (documentoOriginal === undefined) delete globalThis.document; else globalThis.document = documentoOriginal;
  }
});

test('limpeza remove o fundo azul sem recolorir energia nem perder alfa suave', () => {
  const dados = new Uint8ClampedArray([146,242,253,255, 148,240,252,100, 0,140,255,200, 10,30,90,40]);
  removerFundoAzul(dados);
  assert.deepEqual([...dados], [146,242,253,0, 148,240,252,0, 0,140,255,200, 10,30,90,40]);
});

test('VFX preserva custo, duração, redução de dano e recarga, e sincroniza observadores', () => {
  const g = new Game({ now: 1000, populate: false });
  const p = g.addPlayer('p'), outro = g.addPlayer('outro'), longe = g.addPlayer('longe');
  g.levar(p, lugar('inicial')); g.levar(outro, lugar('inicial'));
  p.x += 180; p.seguroAte = 0; p.level = 50; p.stats = statsFor(50); p.hp = p.stats.hp; p.ki = p.stats.ki;
  const ki = p.ki, defesa = p.stats.defense;
  assert.equal(g.cast(p, 'barrier').ok, true);
  assert.equal(p.ki, ki - 30); assert.equal(CONFIG.skillCosts.barrier, 30);
  assert.equal(p.barrierUntil, 1002.5); assert.equal(p.barrierReady, 1008);
  const efeito = g.snapshot(outro.id).players.find(a => a.id === p.id).barrier;
  assert.deepEqual(efeito, { started: 1000, until: 1002.5 });
  assert.ok(!g.snapshot(longe.id).players.some(a => a.id === p.id));
  const m = g.addMob('melee', p.x + 100, p.y, p.area), hp = p.hp;
  g.hit(m, p, 100);
  assert.equal(hp - p.hp, Math.max(1, Math.round(28 * 100 / (100 + defesa * 3))));
  g.time = 1002.5;
  assert.equal(quadroBarreira(efeito, g.time), 10);
  const antes = p.hp; g.hit(m, p, 100);
  assert.equal(antes - p.hp, Math.max(1, Math.round(100 * 100 / (100 + defesa * 3))));
  assert.equal(g.cast(p, 'barrier').ok, false);
  g.time = 1008;
  assert.equal(g.cast(p, 'barrier').ok, true);
  assert.equal(g.snapshot(p.id).players.find(a => a.id === p.id).barrier.started, 1008);
});
