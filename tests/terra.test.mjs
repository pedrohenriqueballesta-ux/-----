import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { PLANETS, PORTAIS, lugar, mercadorPerto } from '../public/shared/nucleo/config.mjs';
import { podeAndar, pesLivres } from '../public/shared/mundo/passagem.mjs';
import { PRACA_TERRA, TAMANHO_TERRA, naAguaDaTerra } from '../public/shared/mundo/terra.mjs';

// Terra = Cidade do Oeste, cidade do rio (planta D2, Pedro 16/11/2026); por enquanto só o chão.
test('a Terra tem o tamanho da planta (6×6 telas); chegada no largo e o teleporte na porta da nave, em chão livre', () => {
  assert.deepEqual({ w: PLANETS.terra.w, h: PLANETS.terra.h }, TAMANHO_TERRA);
  const portal = PORTAIS.find(o => o.id === 'terra-nave');
  assert.deepEqual({ x: portal.x, y: portal.y }, PRACA_TERRA.portal);
  assert.deepEqual(PLANETS.terra.spawn, PRACA_TERRA.chegada);
  for (const p of [PRACA_TERRA.chegada, PRACA_TERRA.portal]) assert.ok(pesLivres('terra', p.x, p.y, 15));
  assert.ok(Math.hypot(portal.x - PRACA_TERRA.chegada.x, portal.y - PRACA_TERRA.chegada.y) > 55, 'chega fora do portal');
  assert.equal(lugar('terra').segura, true);
});
test('rio, lago e floresta da borda bloqueiam; as três pontes e o píer deixam passar', () => {
  assert.equal(podeAndar('terra', 100, 100), false, 'floresta');
  assert.equal(podeAndar('terra', 2700, 3750), false, 'rio');
  assert.equal(podeAndar('terra', 7250, 1650), false, 'lago');
  for (const x of [1500, 3800, 6200]) {
    const y = x === 1500 ? 3250 : x === 3800 ? 3550 : 3750;
    assert.ok(naAguaDaTerra(x + 300, y) || naAguaDaTerra(x - 300, y), 'há água dos lados da ponte em ' + x);
    assert.equal(podeAndar('terra', x, y), true, 'ponte em ' + x);
  }
  assert.equal(podeAndar('terra', 4160, 3900), true, 'píer');
});
test('da chegada, o jogador atravessa a ponte do centro e chega à margem sul andando', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  assert.equal(p.planet, 'terra');
  const alvo = { x: 3800, y: 4600 };
  assert.equal(g.action(p.id, { type: 'moveTo', ...alvo }).ok, true);
  for (let i = 0; i < 2400 && p.moveTo; i++) { g.tick(.05); assert.ok(pesLivres('terra', p.x, p.y, 15), 'nunca entra na água'); }
  assert.ok(Math.hypot(p.x - alvo.x, p.y - alvo.y) < 25, 'chegou (' + Math.round(p.x) + ',' + Math.round(p.y) + ')');
});
test('quarteirões: prédios dentro do quarteirão, sem cruzar outro; nos lotes de interação só provisórios; piso livre andável', async () => {
  const { OBJETOS_TERRA, LOTES_INTERACAO, QUARTEIROES } = await import('../public/shared/mundo/terra-cidade.mjs');
  const cruza = (a, b) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 && b.y0 < a.y1;
  const predios = OBJETOS_TERRA.filter(o => o.tipo === 'cenario' || o.tipo === 'muro');
  assert.ok(predios.length >= 25);
  for (const p of predios) {
    const desenho = { x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h, y1: p.y };
    assert.ok(QUARTEIROES.some(q => desenho.x0 >= q.x0 - 1 && desenho.x1 <= q.x1 + 1 && p.y <= q.y1 && p.y > q.y0), p.id + ' dentro de um quarteirão');
    // Prédio de cenário em lote de interação só como PROVISÓRIO (sai quando a Loja, o Mercado etc. chegarem).
    for (const l of Object.values(LOTES_INTERACAO)) if (cruza({ ...desenho, y0: p.bloqueio.y0 }, l) && p.tipo === 'cenario' && p.x > l.x0 && p.x < l.x1) assert.ok(p.provisorio, p.id + ' no lote de interação sem ser provisório');
    for (const q of predios) if (q !== p && q.y === p.y) assert.ok(!cruza(desenho, { x0: q.x - q.w / 2, x1: q.x + q.w / 2, y0: q.y - q.h, y1: q.y }), p.id + ' × ' + q.id);
    if ('ABGH'.includes(p.arte)) assert.equal(p.y, 950, p.id + ': torre alta só na fileira de cima');
  }
  // Piso do quarteirão andável; só o construído bloqueia (Pedro, 17/11/2026).
  const bloqueado = (x, y) => OBJETOS_TERRA.some(o => o.bloqueio && x > o.bloqueio.x0 - 16 && x < o.bloqueio.x1 + 16 && y > o.bloqueio.y0 - 16 && y < o.bloqueio.y1 + 16);
  for (const q of QUARTEIROES) {
    assert.equal(podeAndar('terra', (q.x0 + q.x1) / 2, q.y1 + 30), true, 'calçada da frente livre');
    for (let x = q.x0 + 20; x < q.x1; x += 40) for (let y = q.y0 + 20; y < q.y1; y += 40)
      if (!bloqueado(x, y)) assert.equal(podeAndar('terra', x, y), true, `piso livre em ${x},${y}`);
  }
});
test('decoração solta só na grama: nunca na água, na rua, em quarteirão nem em cima da nave', async () => {
  const { OBJETOS_TERRA, RUAS, QUARTEIROES, NAVE_GOKU } = await import('../public/shared/mundo/terra-cidade.mjs');
  const deco = OBJETOS_TERRA.filter(o => o.tipo === 'deco');
  assert.ok(deco.length > 150);
  const dentro = (c, x, y) => x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1;
  for (const d of deco) {
    for (const [dx, dy] of [[0, 0], [-d.w / 2, 0], [d.w / 2, 0]]) {
      assert.equal(naAguaDaTerra(d.x + dx, d.y + dy), false, d.id + ' na água');
      assert.ok(!RUAS.some(r => dentro(r, d.x + dx, d.y + dy)), d.id + ' na rua');
      assert.ok(!QUARTEIROES.some(q => dentro(q, d.x + dx, d.y + dy)), d.id + ' em quarteirão');
    }
    assert.ok(!(Math.abs(d.x - NAVE_GOKU.x) < NAVE_GOKU.w / 2 && d.y < NAVE_GOKU.y + 40 && d.y > NAVE_GOKU.y - NAVE_GOKU.h), d.id + ' na nave');
  }
});
test('a nave do Goku é o teleporte da Terra: da chegada, o jogador anda até a porta e o portal abre ali', () => {
  const portal = PORTAIS.find(o => o.id === 'terra-nave');
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  assert.equal(g.action(p.id, { type: 'moveTo', x: portal.x, y: portal.y }).ok, true);
  for (let i = 0; i < 3000 && p.moveTo; i++) g.tick(.05);
  assert.ok(Math.hypot(p.x - portal.x, p.y - portal.y) <= 55, 'chegou à porta (' + Math.round(p.x) + ',' + Math.round(p.y) + ')');
});

test('sem carros por enquanto e nada sobre o piso dos quarteirões além de prédios e muros', async () => {
  const { OBJETOS_TERRA, QUARTEIROES } = await import('../public/shared/mundo/terra-cidade.mjs');
  assert.ok(!OBJETOS_TERRA.some(o => ['taxi', 'onibus'].includes(o.arte)));
  for (const o of OBJETOS_TERRA) if (!['cenario', 'muro', 'rua'].includes(o.tipo))
    assert.ok(!QUARTEIROES.some(q => o.x > q.x0 && o.x < q.x1 && o.y > q.y0 && o.y < q.y1), o.id + ' no piso do quarteirão');
});
test('varredura da cidade: nada atrás de prédio/muro, nada por cima de rua ou água, mobiliário só no meio-fio, prédios sem passar do fundo', async () => {
  const { conferirCidade } = await import('../public/shared/mundo/terra-cidade.mjs');
  assert.deepEqual(conferirCidade(), []);
});
test('Loja do Karin e Mercado de comida: nos lotes da chegada, botão de interação na frente e loja liberada ali', async () => {
  const { INTERACOES, interacaoPerto, MERCADORES_TERRA } = await import('../public/shared/mundo/terra.mjs');
  const { ATALHOS } = await import('../public/shared/tecnicas/atalhos.mjs');
  assert.deepEqual(INTERACOES.filter(i => i.loja).map(i => i.loja), ['karin', 'comida']);
  const cc = INTERACOES.find(i => i.arte === 'capsula_corp');
  assert.deepEqual(cc.servicos, ['Comprar equipamentos', 'Vender drops', 'Melhorar equipamentos']);
  assert.ok(pesLivres('terra', cc.porta.x, cc.porta.y, 15) && interacaoPerto(cc.porta.x, cc.porta.y) === cc, 'Corporação Cápsula: frente livre e com botão');
  for (const i of INTERACOES.filter(i => i.loja)) {
    assert.ok(pesLivres('terra', i.porta.x, i.porta.y, 15), i.nome + ': frente livre');
    assert.equal(interacaoPerto(i.porta.x, i.porta.y)?.loja, i.loja);
    assert.equal(podeAndar('terra', i.x, i.y - 30), false, i.nome + ': o prédio bloqueia');
    const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p'); p.x = i.porta.x; p.y = i.porta.y;
    assert.ok(mercadorPerto(p), i.nome + ': dá para comprar na frente');
  }
  assert.equal(MERCADORES_TERRA.length, 2);
  assert.equal(interacaoPerto(PLANETS.terra.spawn.x, PLANETS.terra.spawn.y + 600), null);
  assert.deepEqual(ATALHOS.find(a => a.id === 'interagir').teclas, ['e']);
});
