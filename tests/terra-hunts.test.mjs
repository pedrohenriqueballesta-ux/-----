import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { areaPorId, PORTAIS } from '../public/shared/nucleo/config.mjs';
import { pesLivres, podeAndar } from '../public/shared/mundo/passagem.mjs';

// Terra Selvagem (Pedro, 22–23/11/2026): hub na clareira e hunt 1, o Descampado do Oeste.
test('Terra Selvagem: chegadas e portais em chão livre; a nave da Cidade do Oeste leva ao hub', () => {
  for (const id of ['terra-hub', 'terra-descampado']) { const z = areaPorId(id); assert.ok(pesLivres('terra-hunts', z.chegada.x, z.chegada.y, 15, id), id); }
  for (const o of PORTAIS.filter(o => o.planet === 'terra-hunts')) assert.ok(pesLivres('terra-hunts', o.x, o.y, 15, o.area), o.id);
  assert.ok(PORTAIS.find(o => o.id === 'terra-nave').destinos.includes('terra-hub'));
});
test('Descampado: estradinhas que saem da hunt são só visuais (não se anda nelas)', () => {
  // Estrada do norte e trilha do sul, em px do mapa da hunt (1536×1024) → atlas (x0 2923, ×2) → mundo (×1.8).
  for (const [x, y] of [[915, 60], [930, 900]]) assert.equal(podeAndar('terra-hunts', (2923 + x * 2) * 1.8, y * 2 * 1.8, 'terra-descampado'), false);
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
