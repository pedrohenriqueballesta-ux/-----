import test from 'node:test';
import assert from 'node:assert/strict';
import { CANAL_STATUS_POPUP, resumirStatusPopout, instalarStatusPopout } from '../public/client/stats-popout.mjs';
import { poseGokuPopout } from '../public/render/goku-popout.mjs';

function snapshot({ hp = 60, autoHunt = true, moving = false } = {}) {
  return {
    selfId: 'p1', time: 1000, events: [], kamehamehas: [], genkiCharges: [],
    self: { name: 'Goku', character: 'Goku', vocacao: 'goku', forma: 'base', level: 20, hp, ki: 40, autoHunt, stats: { hp: 100, ki: 80, mobility: 110 }, huntAnalyzer: { xpHora: 1234.6 } },
    players: [{ id: 'p1', name: 'Goku', moving, montaria: null, facing: { x: 1, y: 0 }, forma: 'base', transformed: false, charge: null, dead: hp <= 0, dashing: false, genkiLancado: null, genkiDirecao: null }]
  };
}

test('resumo pop-out expõe vida, Ki, XP/h e status de caça', () => {
  assert.deepEqual(resumirStatusPopout(snapshot()), {
    nome: 'Goku', vocacao: 'Goku', nivel: 20, estado: 'cacando', hp: 60, hpMax: 100, hpPercentual: 60,
    ki: 40, kiMax: 80, kiPercentual: 50, xpHora: 1234.6,
    sprite: { id: 'p1', moving: false, facing: { x: 1, y: 0 }, dead: false, transformed: false, forma: 'base', charge: null,
      dashing: false, genkiLancado: null, genkiCarga: null, rajadaStarted: undefined, kameStarted: undefined, socoStarted: undefined,
      movementSpeed: 110, serverTime: 1000 }
  });
});

test('resumo diferencia exploração manual, repouso e morte', () => {
  assert.equal(resumirStatusPopout(snapshot({ autoHunt: false, moving: true })).estado, 'explorando');
  assert.equal(resumirStatusPopout(snapshot({ autoHunt: false })).estado, 'repouso');
  assert.equal(resumirStatusPopout(snapshot({ hp: 0 })).estado, 'morto');
  assert.equal(resumirStatusPopout(null), null);
});

test('resumo da sprite acompanha direção, movimento, forma e animação de ataque do snapshot', () => {
  const estado = snapshot({ autoHunt: false, moving: true });
  estado.players[0].facing = { x: 0, y: -1 };
  estado.players[0].forma = 'kaioken'; estado.players[0].dashing = true;
  estado.events.push({ type: 'punch', playerId: 'p1', at: 999.8 });
  const sprite = resumirStatusPopout(estado).sprite;
  assert.equal(sprite.forma, 'kaioken');
  assert.equal(sprite.moving, true);
  assert.deepEqual(sprite.facing, { x: 0, y: -1 });
  assert.equal(sprite.dashing, true);
  assert.equal(sprite.socoStarted, 999.8);
  assert.equal(sprite.movementSpeed, 110);
});

test('sprite escolhe a folha correta para repouso, caminhada, golpe, rajada, Kame e SSJ', () => {
  const parado = { moving: false, forma: 'base' };
  assert.match(poseGokuPopout(parado, 1)[0].file, /base\/parado\.png$/);
  assert.match(poseGokuPopout({ ...parado, moving: true }, 2, 80)[0].file, /base\/andar\.png$/);
  assert.match(poseGokuPopout({ ...parado, socoStarted: 9.8 }, 10)[0].file, /base\/soco\.png$/);
  assert.match(poseGokuPopout({ ...parado, rajadaStarted: 9.8 }, 10)[0].file, /base\/rajada-ki\.png$/);
  assert.match(poseGokuPopout({ ...parado, charge: { until: 10.65 } }, 10)[0].file, /base\/kamehameha\.png$/);
  assert.match(poseGokuPopout({ moving: false, forma: 'ssj', transformed: true }, 1)[0].file, /ssj\/parado\.png$/);
});

test('botão abre uma janela compacta e o canal transmite só o resumo de status', () => {
  const listeners = {}, mensagens = [];
  class CanalFake {
    constructor(nome) { assert.equal(nome, CANAL_STATUS_POPUP); }
    addEventListener(tipo, fn) { listeners[tipo] = fn; }
    postMessage(mensagem) { mensagens.push(mensagem); }
    close() {}
  }
  const janelaAberta = { focus() {} }, chamadas = [];
  const windowRef = { BroadcastChannel: CanalFake, open: (...args) => { chamadas.push(args); return janelaAberta; } };
  let clique;
  const botao = { addEventListener: (tipo, fn) => { assert.equal(tipo, 'click'); clique = fn; } };
  const popout = instalarStatusPopout({ botao, windowRef, obterSnapshot: () => snapshot() });
  popout.atualizar(snapshot());
  assert.equal(mensagens.at(-1).tipo, 'status');
  assert.equal(mensagens.at(-1).status.estado, 'cacando');
  assert.equal(mensagens.at(-1).status.self, undefined, 'não envia o snapshot completo');
  assert.equal(clique(), janelaAberta);
  assert.equal(chamadas[0][0], '/status-popout.html');
  assert.match(chamadas[0][2], /width=350,height=300/);
  listeners.message({ data: { tipo: 'pedir-status' } });
  assert.equal(mensagens.at(-1).status.nome, 'Goku');
  popout.fechar();
});

test('usa Document Picture-in-Picture como janela sempre visível e móvel quando disponível', async () => {
  class CanalFake { constructor() {} addEventListener() {} postMessage() {} close() {} }
  const elementos = [];
  const doc = {
    title: '', documentElement: { style: {} }, head: { append: node => elementos.push(node) },
    body: { style: {}, append: node => elementos.push(node) },
    createElement: tag => ({ tag, style: {}, addEventListener() {} })
  };
  const handlers = {}, pipWindow = { document: doc, closed: false, focus() {}, addEventListener: (tipo, fn) => { handlers[tipo] = fn; } };
  const chamadas = [];
  const windowRef = {
    BroadcastChannel: CanalFake,
    documentPictureInPicture: { window: null, requestWindow: options => { chamadas.push(options); return Promise.resolve(pipWindow); } },
    open: () => assert.fail('não deve abrir popup comum quando Picture-in-Picture existe')
  };
  let clique;
  const botao = { addEventListener: (_, fn) => { clique = fn; } };
  const popout = instalarStatusPopout({ botao, windowRef, obterSnapshot: () => snapshot() });
  assert.equal(await clique(), pipWindow);
  assert.deepEqual(chamadas, [{ width: 350, height: 300 }]);
  assert.equal(doc.title, 'Status · Dragon Ball Idle');
  assert.ok(elementos.some(el => el.tag === 'link' && el.href === '/status-popout.css'));
  assert.ok(elementos.some(el => el.tag === 'iframe' && el.src === '/status-popout.html'));
  assert.equal(await popout.abrir(), pipWindow, 'reativa a janela existente sem criar outra');
  handlers.pagehide();
  popout.fechar();
});
