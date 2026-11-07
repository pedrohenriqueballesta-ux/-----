import test from 'node:test';
import assert from 'node:assert/strict';
import { MINIMAPA, tamanhoMinimapa, zoomMinimapa, vistaMinimapa, pontoDoMinimapa, arrastarMinimapa } from '../public/render/minimapa.mjs';
import { Game } from '../public/shared/game.mjs';
import { PLANETS, ZONES, OBSTACLES } from '../public/shared/config.mjs';
import { zoomFromWheel } from '../public/render/camera.mjs';

test('tamanho fica entre o atual e o dobro; zoom do minimapa tem limites independentes da câmera', () => {
  assert.equal(tamanhoMinimapa(.5), 1); assert.equal(tamanhoMinimapa(3), 2);
  for (const tamanho of [1,1.25,1.5,1.75,2]) assert.equal(tamanhoMinimapa(tamanho), tamanho);
  assert.equal(zoomMinimapa(1, -1e6), 4); assert.equal(zoomMinimapa(1, 1e6), 1);
  assert.equal(zoomFromWheel(1, -10000), 2, 'câmera preserva os próprios limites');
  assert.ok(Math.abs(zoomMinimapa(1, -16) - zoomMinimapa(1, -1, 1)) < 1e-9);
  assert.ok(Math.abs(zoomMinimapa(1, -600) - zoomMinimapa(1, -1, 2)) < 1e-9);
});

test('clique corresponde ao recorte exibido, com zoom e tamanhos diferentes', () => {
  const mundo = { w: 10000, h: 8000 }, jogador = { x: 5000, y: 4000 };
  for (const zoom of [1,1.5,2,4]) {
    const vista = vistaMinimapa(mundo, null, jogador, 240, 176, zoom);
    assert.equal(vista.w, MINIMAPA.vista / zoom);
    for (const tamanho of [1,1.5,2]) {
      const caixa = { left: 100, top: 70, width: 240 * tamanho, height: 176 * tamanho };
      const centro = pontoDoMinimapa(caixa.left + caixa.width / 2, caixa.top + caixa.height / 2, caixa, vista);
      assert.deepEqual(centro, jogador);
      const canto = pontoDoMinimapa(caixa.left + caixa.width, caixa.top + caixa.height, caixa, vista);
      assert.deepEqual(canto, { x: vista.x + vista.w, y: vista.y + vista.h });
      assert.equal(pontoDoMinimapa(caixa.left - 1, caixa.top, caixa, vista), null);
    }
  }
  assert.equal(pontoDoMinimapa(0, 0, { left: 0, top: 0, width: 0, height: 0 }, null), null);
});

test('minimapa e cliques permanecem dentro do lugar atual, inclusive nas bordas e com zoom afastado', () => {
  for (const area of ZONES) for (const zoom of [1,2,4]) {
    const mundo = PLANETS[area.planet];
    for (const jogador of [{ x: area.x, y: area.y }, { x: area.x + area.w, y: area.y + area.h }]) {
      const vista = vistaMinimapa(mundo, area, jogador, 480, 352, zoom);
      assert.ok(vista.x >= area.x - 1e-9 && vista.y >= area.y - 1e-9);
      assert.ok(vista.x + vista.w <= area.x + area.w + 1e-9 && vista.y + vista.h <= area.y + area.h + 1e-9);
    }
  }
});

test('cada aumento de zoom altera o recorte, inclusive quando a área cabe inteira', () => {
  for (const mundo of [PLANETS.terra, { w: 300, h: 200 }, { w: 10000, h: 8000 }]) {
    let anterior = vistaMinimapa(mundo, null, null, 240, 176, 1);
    for (const zoom of [1.1,1.25,1.5,2,3,4]) {
      const atual = vistaMinimapa(mundo, null, null, 240, 176, zoom);
      assert.ok(atual.w < anterior.w && atual.h < anterior.h, 'zoom tem efeito visível');
      anterior = atual;
    }
  }
});

test('arrasto desloca só a visão, respeita bordas e mantém o clique alinhado com o mapa explorado', () => {
  const mundo = { w: 10000, h: 8000 }, limite = { x: 1000, y: 1000, w: 6000, h: 4000 };
  const vista = vistaMinimapa(mundo, limite, { x: 4000, y: 3000 }, 240, 176, 2);
  const caixa = { left: 10, top: 20, width: 240, height: 176 };
  const centro = arrastarMinimapa(vista, 60, 44, caixa, limite);
  assert.deepEqual(centro, { x: 3700, y: 2780 });
  const deslocada = vistaMinimapa(mundo, limite, centro, 240, 176, 2);
  assert.deepEqual(pontoDoMinimapa(130, 108, caixa, deslocada), centro);
  const borda = arrastarMinimapa(vista, -1e6, -1e6, caixa, limite);
  const final = vistaMinimapa(mundo, limite, borda, 240, 176, 2);
  assert.equal(final.x + final.w, limite.x + limite.w);
  assert.equal(final.y + final.h, limite.y + limite.h);
});

test('destino obtido pelo minimapa usa o movimento autoritativo e contorna estrutura sem atravessá-la', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  p.x = 100; p.y = 300;
  const obstaculo = { planet: 'terra', x: 300, y: 300, r: 55 };
  OBSTACLES.push(obstaculo);
  try {
    const vista = vistaMinimapa(PLANETS.terra, null, p, 240, 176);
    const caixa = { left: 20, top: 30, width: 480, height: 352 };
    const destino = pontoDoMinimapa(20 + 500 / 1100 * 480, 30 + 300 / 760 * 352, caixa, vista);
    assert.ok(Math.abs(destino.x - 500) < 1e-9 && Math.abs(destino.y - 300) < 1e-9);
    assert.equal(g.action(p.id, { type: 'moveTo', ...destino }).ok, true);
    let desvio = 0;
    for (let i = 0; i < 400 && p.moveTo; i++) {
      g.tick(.05); desvio = Math.max(desvio, Math.abs(p.y - 300));
      assert.ok(Math.hypot(p.x - obstaculo.x, p.y - obstaculo.y) >= 70 - 1e-9);
    }
    assert.ok(desvio > 55, 'traçou desvio da estrutura');
    assert.ok(Math.hypot(p.x - 500, p.y - 300) < 20, 'chegou ao destino');
    assert.equal(p.area, null); assert.equal(p.planet, 'terra');
  } finally { OBSTACLES.splice(OBSTACLES.indexOf(obstaculo), 1); }
});
