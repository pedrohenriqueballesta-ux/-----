import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CURA_VFX, quadroCura, carregarCura, desenharCura } from '../public/render/cura.mjs';
import { Game } from '../public/shared/game.mjs';
import { statsFor } from '../public/shared/characters.mjs';
import { lugar } from '../public/shared/config.mjs';

test('cura VFX toca exatamente 24 frames a 40 FPS e desaparece em 0,6s sem loop', () => {
  const efeito = { started: 1000 };
  for (let i = 0; i < 24; i++) assert.equal(quadroCura(efeito, 1000 + i / 40), i);
  assert.equal(quadroCura(efeito, 999.9), -1);
  assert.equal(quadroCura(efeito, 1000.5999), 23);
  assert.equal(quadroCura(efeito, 1000.6), -1);
  assert.equal(quadroCura(efeito, 1001.5), -1);
  assert.equal(quadroCura(null, 1000), -1);
});

test('folha fornecida usa RGBA transparente e grade 8×3 de 256×256', async () => {
  const png = await readFile(new URL('../public' + CURA_VFX.imagem, import.meta.url));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20), png[24], png[25]], [2048, 768, 8, 6]);
});

test('render acompanha personagem em todas as direções, não acumula efeitos e prepara arte uma vez', () => {
  const imagemOriginal = globalThis.Image, documentoOriginal = globalThis.document;
  let imagens = 0, telas = 0;
  const limpezas = [], chamadas = [], alfas = [];
  globalThis.Image = class { constructor() { imagens++; this.complete = false; this.naturalWidth = 0; this.naturalHeight = 768; } };
  globalThis.document = { createElement: () => { telas++; return { getContext: () => ({ drawImage() {}, clearRect(...args) { limpezas.push(args); } }) }; } };
  try {
    const ctx = { globalAlpha: 1, pilha: [], save() { this.pilha.push(this.globalAlpha); },
      restore() { this.globalAlpha = this.pilha.pop(); }, drawImage(...args) { chamadas.push(args); alfas.push(this.globalAlpha); } };
    const p = { heal: { started: 0 }, charge: { skill: 'kame' }, moving: true };
    assert.equal(desenharCura(ctx, p, { x: 0, y: 0 }, .1), false);
    const img = carregarCura(); img.complete = true; img.naturalWidth = 2048;
    for (let i = 0; i < 24; i++) {
      p.facing = { x: Math.cos(i * Math.PI / 4), y: Math.sin(i * Math.PI / 4) };
      const pos = { x: 100 + i * 2, y: 200 + i * 3 };
      assert.equal(desenharCura(ctx, p, pos, i / 40), true);
      const a = chamadas.at(-1);
      assert.deepEqual(a.slice(1, 5), [i % 8 * 256, Math.floor(i / 8) * 256, 256, 256]);
      assert.equal(a[5] + a[7] / 2, pos.x);
      assert.equal(a[6] + 220 * CURA_VFX.escala, pos.y);
      assert.equal(ctx.globalAlpha, 1, 'não altera opacidade das outras skills');
    }
    assert.equal(imagens, 1); assert.equal(telas, 1); assert.equal(limpezas.length, 24);
    assert.deepEqual(limpezas[0], [0, 0, 52, 24]);
    assert.deepEqual(limpezas[23], [1792, 512, 52, 24]);
    assert.ok(alfas.every(a => a === .55));
    assert.equal(chamadas.length, 24, 'um desenho por frame, sem cópias empilhadas');
    assert.equal(desenharCura(ctx, p, { x: 0, y: 0 }, .6), false);
    assert.equal(desenharCura(ctx, { ...p, dead: true }, { x: 0, y: 0 }, .1), false);
  } finally {
    if (imagemOriginal === undefined) delete globalThis.Image; else globalThis.Image = imagemOriginal;
    if (documentoOriginal === undefined) delete globalThis.document; else globalThis.document = documentoOriginal;
  }
});

test('somente cura aceita gera timestamp; snapshots e ativações consecutivas não reiniciam o efeito anterior', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  p.hp = 20; p.ki = 80;
  assert.equal(g.snapshot(p.id).players[0].heal, null);
  assert.equal(g.action(p.id, { type: 'skill', skill: 'heal' }).ok, true);
  for (let i = 0; i < 5; i++) {
    assert.equal(g.cast(p, 'heal', true).ok, false);
    assert.deepEqual(g.snapshot(p.id).players[0].heal, { started: 1000 });
  }
  g.time = 1000.6;
  assert.equal(quadroCura(g.snapshot(p.id).players[0].heal, g.time), -1);
  g.time = 1000.7; assert.equal(g.cast(p, 'heal').ok, true);
  assert.deepEqual(g.snapshot(p.id).players[0].heal, { started: 1000.7 });
  assert.equal(quadroCura(g.snapshot(p.id).players[0].heal, g.time), 0);
  assert.equal(p.ki, 60); assert.ok(Math.abs(p.hp - 24.8) < 1e-9);
});

test('autocura anima em movimento e junto ao ataque; outros lugares não recebem o personagem/efeito', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p'), distante = g.addPlayer('longe');
  p.level = 20; p.stats = statsFor(20); p.hp = 100; p.ki = 200;
  g.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  p.autoHeal = true; p.autoSkills = true; p.autoAttack = true; p.autoHunt = true; p.autoFood = false;
  const m = g.addMob('melee', p.x + 60, p.y, p.area); m.hp = m.maxHp = 10000; m.agressivo = false;
  p.targetId = m.id;
  const x = p.x; g.tick(.05);
  assert.ok(p.x > x); assert.ok(m.hp < m.maxHp); assert.ok(p.hp > 100);
  const jogador = g.snapshot(p.id).players.find(a => a.id === p.id);
  assert.equal(jogador.heal.started, g.time);
  assert.equal(quadroCura(jogador.heal, g.time), 0);
  assert.ok(!g.snapshot(distante.id).players.some(a => a.id === p.id));
});
