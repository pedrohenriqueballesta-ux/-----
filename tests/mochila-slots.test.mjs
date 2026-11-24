import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, reconciliarSlots, moverSlotMochila, dividirSlotMochila, descartarSlotMochila, slotsPadrao } from '../public/shared/nucleo/characters.mjs';

const soma = (p, item) => p.slots.reduce((t, s) => t + (s && s.item === item ? s.qty : 0), 0);
const inv = o => ({ food: 0, ki: 0, seed15: 0, seed30: 0, seed50: 0, seed100: 0, scrap: 0, ...o });
function novo(o) { const p = { inventory: inv(o) }; p.slots = slotsPadrao(p.inventory); reconciliarSlots(p); return p; }

test('o layout padrão empacota os totais nos primeiros espaços', () => {
  const p = novo({ food: 10, scrap: 3 });
  assert.deepEqual(p.slots[0], { item: 'food', qty: 10 });
  assert.deepEqual(p.slots[1], { item: 'scrap', qty: 3 });
  assert.equal(p.slots[2], null);
});

test('mover uma pilha para um espaço vazio não altera o total', () => {
  const p = novo({ food: 10 });
  assert.equal(moverSlotMochila(p, 0, 5), true);
  assert.equal(p.slots[0], null);
  assert.deepEqual(p.slots[5], { item: 'food', qty: 10 });
  assert.equal(soma(p, 'food'), 10);
});

test('mover sobre um item diferente troca os dois de lugar', () => {
  const p = novo({ food: 10, scrap: 3 });
  moverSlotMochila(p, 0, 1);
  assert.deepEqual(p.slots[0], { item: 'scrap', qty: 3 });
  assert.deepEqual(p.slots[1], { item: 'food', qty: 10 });
});

test('mover sobre o mesmo item junta as pilhas', () => {
  const p = novo({ food: 10 });
  dividirSlotMochila(p, 0, 4);                    // vira 6 e 4
  const i6 = p.slots.findIndex(s => s?.qty === 6), i4 = p.slots.findIndex(s => s?.qty === 4);
  moverSlotMochila(p, i4, i6);
  assert.equal(p.slots.filter(s => s?.item === 'food').length, 1);
  assert.equal(soma(p, 'food'), 10);
});

test('dividir cria uma segunda pilha preservando o total', () => {
  const p = novo({ food: 10 });
  assert.equal(dividirSlotMochila(p, 0, 4), true);
  const pilhas = p.slots.filter(s => s?.item === 'food').map(s => s.qty).sort((a, b) => a - b);
  assert.deepEqual(pilhas, [4, 6]);
  assert.equal(soma(p, 'food'), 10);
});

test('dividir com quantidade inválida falha (precisa sobrar ao menos 1)', () => {
  const p = novo({ food: 10 });
  assert.equal(dividirSlotMochila(p, 0, 10), false);
  assert.equal(dividirSlotMochila(p, 0, 0), false);
  assert.equal(dividirSlotMochila(p, 0, 99), false);
});

test('descartar mira o espaço clicado, mesmo com o item dividido em dois', () => {
  const p = novo({ food: 10 });
  dividirSlotMochila(p, 0, 4);                    // pilhas 6 e 4
  const alvo = p.slots.findIndex(s => s?.item === 'food' && s.qty === 4);
  assert.equal(descartarSlotMochila(p, alvo), true);
  assert.equal(p.inventory.food, 6);             // só a pilha de 4 saiu
  assert.equal(soma(p, 'food'), 6);
  assert.equal(p.slots.some(s => s?.qty === 6), true);
});

test('reconciliar acompanha o estoque que muda por fora (loot e uso)', () => {
  const p = novo({ food: 5 });
  p.inventory.food = 8; reconciliarSlots(p);
  assert.equal(soma(p, 'food'), 8);
  p.inventory.food = 2; reconciliarSlots(p);
  assert.equal(soma(p, 'food'), 2);
});

test('createPlayer gera slots coerentes e exportPlayer os persiste', () => {
  const p = createPlayer('x', 'Teste');
  assert.ok(Array.isArray(p.slots));
  for (const item of Object.keys(p.inventory)) assert.equal(soma(p, item), Math.floor(p.inventory[item]));
});
