// Confere o módulo de telemetria (server/telemetria.mjs): grava JSONL com versão/id/timestamp,
// registra erro com pilha, faz flush em lote, e fica inerte sem pasta de dados (como em teste).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Telemetria, TELEMETRIA_VERSAO } from '../server/telemetria.mjs';

async function pasta() {
  const dir = resolve(tmpdir(), 'dbi-tele-' + Math.random().toString(36).slice(2));
  await mkdir(dir, { recursive: true });
  return dir;
}

test('inerte sem pasta de dados: registrar não quebra e nada é gravado', () => {
  const t = new Telemetria({});
  assert.equal(t.ativo, false);
  t.registrar('nivel_up', { nivel: 2 }); // não deve lançar
  assert.equal(t.buffer.length, 0);
});

test('registra evento com versão, id, timestamp e props, e grava no JSONL do dia', async () => {
  const dir = await pasta();
  try {
    let relogio = Date.parse('2026-11-27T10:00:00Z');
    const t = new Telemetria({ dir, agora: () => relogio, flushMs: 1e9 });
    t.registrar('nivel_up', { nivel: 7, tempoJogoS: 1234 });
    assert.equal(t.buffer.length, 1);
    await t.flush();
    const arquivo = resolve(dir, 'eventos-2026-11-27.jsonl');
    const linhas = (await readFile(arquivo, 'utf8')).trim().split('\n');
    assert.equal(linhas.length, 1);
    const ev = JSON.parse(linhas[0]);
    assert.equal(ev.v, TELEMETRIA_VERSAO);
    assert.equal(ev.tipo, 'nivel_up');
    assert.equal(ev.nivel, 7);
    assert.equal(ev.tempoJogoS, 1234);
    assert.equal(ev.t, relogio);
    assert.match(ev.id, /[0-9a-f-]{36}/);
    await t.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('erro registra origem, mensagem e pilha (truncada)', async () => {
  const dir = await pasta();
  try {
    const t = new Telemetria({ dir, flushMs: 1e9 });
    t.erro('tick', new Error('falhou no tick'), { jogador: 'abc' });
    await t.flush();
    const ev = JSON.parse((await readFile(t.arquivoDoDia(), 'utf8')).trim());
    assert.equal(ev.tipo, 'erro_servidor');
    assert.equal(ev.origem, 'tick');
    assert.equal(ev.mensagem, 'falhou no tick');
    assert.equal(ev.jogador, 'abc');
    assert.ok(ev.stack.includes('Error: falhou no tick'));
    await t.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('flush em lote grava várias linhas de uma vez e esvazia o buffer', async () => {
  const dir = await pasta();
  try {
    const t = new Telemetria({ dir, flushMs: 1e9 });
    t.registrar('a', {}); t.registrar('b', {}); t.registrar('c', {});
    assert.equal(t.buffer.length, 3);
    await t.flush();
    assert.equal(t.buffer.length, 0);
    const linhas = (await readFile(t.arquivoDoDia(), 'utf8')).trim().split('\n');
    assert.equal(linhas.length, 3);
    assert.deepEqual(linhas.map(l => JSON.parse(l).tipo), ['a', 'b', 'c']);
    await t.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});
