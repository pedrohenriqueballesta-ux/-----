import test from 'node:test';
import assert from 'node:assert/strict';

test('Auto Hunt abre como painel não modal e alterna o estado acessível sem iniciar a caça', async () => {
  const chaves = ['document','innerWidth','innerHeight','addEventListener'];
  const originais = Object.fromEntries(chaves.map(k => [k, globalThis[k]]));
  const atributos = new Map(), metodos = [];
  const painel = { open: false, style: {}, show() { this.open = true; metodos.push('show'); },
    close() { this.open = false; metodos.push('close'); }, showModal() { throw new Error('Não deve bloquear o jogo'); } };
  const botao = { setAttribute(k, v) { atributos.set(k, v); } };
  try {
    globalThis.innerWidth = 1600; globalThis.innerHeight = 950;
    globalThis.addEventListener = () => {};
    globalThis.document = { documentElement: { style: { setProperty() {} } },
      getElementById: id => id === 'autoHuntDialog' ? painel : id === 'autoHuntButton' ? botao : null };
    const { alternarAutoHunt, encaixarAutoHunt } = await import('../public/client/hud.mjs');
    alternarAutoHunt();
    assert.equal(painel.open, true); assert.equal(atributos.get('aria-expanded'), 'true');
    const caixas = { '.hud-topo': { bottom: 80 }, '.hud-mapa': { bottom: 310 }, '.hud-zoom': { bottom: 350 },
      '.hud-tecnicas': { top: 790 }, '.hud-auto': { top: 900 } };
    document.querySelector = seletor => ({ getBoundingClientRect: () => caixas[seletor] });
    encaixarAutoHunt();
    assert.equal(painel.style.maxHeight, '380px');
    assert.equal(painel.style.bottom, '168px');
    globalThis.innerHeight = 568;
    caixas['.hud-mapa'].bottom = 210; caixas['.hud-zoom'].bottom = 225;
    caixas['.hud-tecnicas'].top = 430; caixas['.hud-auto'].top = 500;
    encaixarAutoHunt();
    assert.equal(painel.style.maxHeight, '189px', 'encolhe para caber entre as informações');
    assert.equal(painel.style.bottom, '146px', 'preserva a barra de habilidades');
    alternarAutoHunt();
    assert.equal(painel.open, false); assert.equal(atributos.get('aria-expanded'), 'false');
    assert.deepEqual(metodos, ['show','close']);
  } finally {
    for (const [k, v] of Object.entries(originais)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; }
  }
});
