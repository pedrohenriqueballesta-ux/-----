import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { areaPorId, PORTAIS } from '../public/shared/nucleo/config.mjs';
import { pesLivres, podeAndar } from '../public/shared/mundo/passagem.mjs';

// Terra Selvagem (Pedro, 22–23/11/2026): hub na clareira e hunt 1, o Descampado do Oeste.
test('Terra Selvagem: chegadas e portais em chão livre; a nave da Cidade do Oeste leva ao hub', () => {
  for (const id of ['terra-hub', 'terra-descampado', 'terra-deserto', 'terra-neve', 'terra-montanhas']) { const z = areaPorId(id); assert.ok(pesLivres('terra-hunts', z.chegada.x, z.chegada.y, 15, id), id); }
  for (const o of PORTAIS.filter(o => o.planet === 'terra-hunts')) assert.ok(pesLivres('terra-hunts', o.x, o.y, 15, o.area), o.id);
  assert.ok(PORTAIS.find(o => o.id === 'terra-nave').destinos.includes('terra-hub'));
});
test('Descampado: estradinhas que saem da hunt são só visuais (não se anda nelas)', () => {
  // Estrada do norte e trilha do sul, em px do mapa da hunt (1536×1024) → atlas (x0 2923, ×4, 16 partes) → mundo (×1).
  for (const [x, y] of [[915, 60], [930, 900]]) assert.equal(podeAndar('terra-hunts', 2923 + x * 4, y * 4, 'terra-descampado'), false);
});
test('Descampado: andar por clique pela grama e pela terra não trava nem treme (vaivém perto de árvore/pedra)', () => {
  const z = areaPorId('terra-descampado'); let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, { planet: 'terra-hunts', area: 'terra-descampado', chegada: z.chegada });
  let viradas = 0, chegou = 0;
  for (let k = 0; k < 40; k++) {
    let alvo; do alvo = { x: z.x + rnd() * z.w, y: z.y + rnd() * z.h }; while (!pesLivres('terra-hunts', alvo.x, alvo.y, 15, 'terra-descampado'));
    g.action(p.id, { type: 'moveTo', x: alvo.x, y: alvo.y });
    let ant = { x: p.x, y: p.y }, dirAnt = null;
    for (let i = 0; i < 1200 && p.moveTo; i++) {
      g.tick(.05); const d = Math.hypot(p.x - ant.x, p.y - ant.y);
      if (d > .5) { const dir = Math.atan2(p.y - ant.y, p.x - ant.x); if (dirAnt !== null) { let dd = Math.abs(dir - dirAnt); if (dd > Math.PI) dd = 2 * Math.PI - dd; if (dd > .6) viradas++; } dirAnt = dir; }
      ant = { x: p.x, y: p.y };
    }
    if (Math.hypot(p.x - alvo.x, p.y - alvo.y) < 40) chegou++;
  }
  // Destino colado num cantinho entre pedras pode ficar a ~40 da chegada (a condução direta para em vez de tremer).
  assert.ok(chegou >= 38, 'chegaram ' + chegou + ' de 40');
  // Antes da correção: ~3.200 viradas bruscas nestas 40 caminhadas (vaivém sem fim); depois, ~100.
  assert.ok(viradas < 200, 'viradas bruscas: ' + viradas);
});

test('Deserto das Mesas: a trilha do meio é andável; mesas e o mar bloqueiam', () => {
  // px do mapa da hunt (1536×1024) → mundo: x0 9131, ×(8192/1536).
  const k = 8192 / 1536, M = (x, y) => [9131 + x * k, y * k];
  for (const [x, y] of [[870, 470], [880, 600], [760, 200]]) assert.ok(podeAndar('terra-hunts', ...M(x, y), 'terra-deserto'), 'trilha ' + x + ',' + y);
  for (const [x, y] of [[180, 260], [660, 320], [1040, 400], [100, 700]]) assert.equal(podeAndar('terra-hunts', ...M(x, y), 'terra-deserto'), false, 'bloqueia ' + x + ',' + y);
});
test('Deserto das Mesas: andar por clique chega ao destino sem tremer', () => {
  const z = areaPorId('terra-deserto'); let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, { planet: 'terra-hunts', area: 'terra-deserto', chegada: z.chegada });
  let chegou = 0;
  for (let k = 0; k < 20; k++) {
    let alvo; do alvo = { x: z.x + rnd() * z.w, y: z.y + rnd() * z.h }; while (!pesLivres('terra-hunts', alvo.x, alvo.y, 15, 'terra-deserto'));
    g.action(p.id, { type: 'moveTo', x: alvo.x, y: alvo.y });
    for (let i = 0; i < 2400 && p.moveTo; i++) g.tick(.05);
    if (Math.hypot(p.x - alvo.x, p.y - alvo.y) < 40) chegou++;
  }
  assert.ok(chegou >= 18, 'chegaram ' + chegou + ' de 20');
});

test('Montanhas Nevadas: campo de neve andável; lago, mar e picos bloqueiam; clique chega sem trava', () => {
  const k = 8192 / 1536, M = (x, y) => [17387 + x * k, y * k];   // px do mapa da hunt (1536×512) → mundo
  for (const [x, y] of [[900, 300], [1100, 200], [1300, 250]]) assert.ok(podeAndar('terra-hunts', ...M(x, y), 'terra-neve'), 'neve ' + x + ',' + y);
  for (const [x, y] of [[830, 470], [1300, 30], [400, 100]]) assert.equal(podeAndar('terra-hunts', ...M(x, y), 'terra-neve'), false, 'bloqueia ' + x + ',' + y);
  const z = areaPorId('terra-neve'); let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, { planet: 'terra-hunts', area: 'terra-neve', chegada: z.chegada });
  let chegou = 0;
  for (let i = 0; i < 20; i++) {
    let alvo; do alvo = { x: z.x + rnd() * z.w, y: z.y + rnd() * z.h }; while (!pesLivres('terra-hunts', alvo.x, alvo.y, 15, 'terra-neve'));
    g.action(p.id, { type: 'moveTo', x: alvo.x, y: alvo.y });
    for (let t = 0; t < 2400 && p.moveTo; t++) g.tick(.05);
    if (Math.hypot(p.x - alvo.x, p.y - alvo.y) < 40) chegou++;
  }
  assert.ok(chegou >= 18, 'chegaram ' + chegou + ' de 20');
});

test('Vale da Cachoeira: o vale é andável; rio, cachoeira e montanha bloqueiam; clique chega sem trava', () => {
  const k = 8192 / 1536, M = (x, y) => [25643 + x * k, y * k];   // px do mapa da hunt (1536×768) → mundo
  for (const [x, y] of [[600, 430], [700, 420], [520, 500]]) assert.ok(podeAndar('terra-hunts', ...M(x, y), 'terra-montanhas'), 'vale ' + x + ',' + y);
  for (const [x, y] of [[450, 230], [400, 560], [820, 300]]) assert.equal(podeAndar('terra-hunts', ...M(x, y), 'terra-montanhas'), false, 'bloqueia ' + x + ',' + y);
  const z = areaPorId('terra-montanhas'); let s = 13; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, { planet: 'terra-hunts', area: 'terra-montanhas', chegada: z.chegada });
  let chegou = 0;
  for (let i = 0; i < 20; i++) {
    let alvo; do alvo = { x: z.x + rnd() * z.w, y: z.y + rnd() * z.h }; while (!pesLivres('terra-hunts', alvo.x, alvo.y, 15, 'terra-montanhas'));
    g.action(p.id, { type: 'moveTo', x: alvo.x, y: alvo.y });
    for (let t = 0; t < 2400 && p.moveTo; t++) g.tick(.05);
    if (Math.hypot(p.x - alvo.x, p.y - alvo.y) < 40) chegou++;
  }
  assert.ok(chegou >= 18, 'chegaram ' + chegou + ' de 20');
});
