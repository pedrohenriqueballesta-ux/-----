import test from 'node:test';
import assert from 'node:assert/strict';
import { instalarPainelMovel, limitarPosicaoPainel } from '../public/render/painel-movel.mjs';

test('limita janela à tela sem perder cabeçalho ou botão de fechar', () => {
  assert.deepEqual(limitarPosicaoPainel({ x: -30, y: -20 }, { w: 340, h: 300 }, { w: 800, h: 600 }), { x: 8, y: 8 });
  assert.deepEqual(limitarPosicaoPainel({ x: 1000, y: 900 }, { w: 340, h: 300 }, { w: 800, h: 600 }), { x: 452, y: 292 });
});

test('arrasta só pelo cabeçalho, salva ao soltar, restaura ao reabrir e adapta a tela menor', () => {
  const originais = { localStorage: globalThis.localStorage, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight };
  const memoria = new Map(); let gravacoes = 0;
  try {
    globalThis.innerWidth = 1000; globalThis.innerHeight = 800;
    globalThis.localStorage = { getItem: k => memoria.get(k) ?? null, setItem: (k, v) => { gravacoes++; memoria.set(k, v); } };
    const criar = () => {
      const eventos = {}, capturas = new Set();
      const cabecalho = { addEventListener: (k, f) => { eventos[k] = f; }, classList: { add() {}, remove() {} },
        setPointerCapture: id => capturas.add(id), hasPointerCapture: id => capturas.has(id), releasePointerCapture: id => capturas.delete(id) };
      const painel = { open: true, style: {}, getBoundingClientRect: () => ({ left: 500, top: 300, width: 340, height: 280 }) };
      return { eventos, painel, controle: instalarPainelMovel(painel, cabecalho, 'posicao') };
    };
    const { eventos, painel, controle } = criar();
    assert.equal(controle.restaurar(), false);
    const e = (x, y, botao = false) => ({ pointerId: 1, button: 0, clientX: x, clientY: y, preventDefault() {}, target: { closest: () => botao ? {} : null } });
    eventos.pointerdown(e(520,320,true)); eventos.pointermove(e(100,100)); eventos.pointerup(e(100,100));
    assert.equal(gravacoes, 0, 'botão de fechar não inicia arrasto');
    eventos.pointerdown({ ...e(520,320), button: 2 }); eventos.pointermove(e(100,100)); eventos.pointerup(e(100,100));
    assert.equal(gravacoes, 0, 'clique direito não move');
    eventos.pointerdown(e(520,320)); eventos.pointermove(e(521,321)); eventos.pointerup(e(521,321));
    assert.equal(gravacoes, 0, 'clique simples não fixa posição');
    eventos.pointerdown(e(520,320)); eventos.pointermove(e(120,120));
    assert.equal(painel.style.left, '100px'); assert.equal(painel.style.top, '100px');
    assert.equal(gravacoes, 0, 'só grava ao soltar');
    eventos.pointerup(e(120,120)); assert.equal(gravacoes, 1);
    assert.equal(controle.restaurar(), true); assert.equal(painel.style.left, '100px');
    const recarregado = criar(); assert.equal(recarregado.controle.restaurar(), true);
    assert.equal(recarregado.painel.style.top, '100px');
    globalThis.innerWidth = 390; globalThis.innerHeight = 320;
    recarregado.controle.restaurar();
    assert.equal(recarregado.painel.style.left, '42px'); assert.equal(recarregado.painel.style.top, '32px');
    assert.equal(gravacoes, 1, 'redimensionar não apaga a preferência original');
    globalThis.innerWidth = 1000; globalThis.innerHeight = 800;
    recarregado.controle.restaurar(); assert.equal(recarregado.painel.style.left, '100px');
    eventos.pointerdown(e(520,320)); eventos.pointermove(e(1500,1500)); eventos.pointercancel(e(1500,1500));
    assert.equal(painel.style.left, '652px'); assert.equal(painel.style.top, '512px');
    assert.equal(gravacoes, 2, 'cancelamento libera captura e preserva última posição visível');
  } finally {
    for (const [k, v] of Object.entries(originais)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; }
  }
});
