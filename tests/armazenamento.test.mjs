// Confere a persistência em SQLite (server/armazenamento.mjs): roundtrip do objeto stored,
// remoção de chaves que sumiram, durabilidade entre reaberturas e migração do save.json antigo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Armazenamento, migrarSaveJson } from '../server/armazenamento.mjs';

async function pasta() { return await mkdtemp(resolve(tmpdir(), 'dbi-db-')); }

test('salva e recarrega o objeto stored inteiro', async () => {
  const dir = await pasta();
  try {
    const a = new Armazenamento(dir);
    a.salvar({ __auth: { versao: 1, contas: [{ id: 'x' }] }, __mercado: { itens: [] }, abcdef: { name: 'Goku', level: 9 } });
    assert.deepEqual(a.carregar(), { __auth: { versao: 1, contas: [{ id: 'x' }] }, __mercado: { itens: [] }, abcdef: { name: 'Goku', level: 9 } });
    a.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('persiste entre reaberturas do banco (durável)', async () => {
  const dir = await pasta();
  try {
    const a = new Armazenamento(dir); a.salvar({ __auth: { contas: [{ id: 'y', level: 3 }] } }); a.fechar();
    const b = new Armazenamento(dir);
    assert.equal(b.carregar().__auth.contas[0].id, 'y');
    b.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('remove chaves que sumiram do stored (ex.: token legado migrado)', async () => {
  const dir = await pasta();
  try {
    const a = new Armazenamento(dir);
    a.salvar({ __auth: {}, tokenLegado: { name: 'velho' } });
    a.salvar({ __auth: {} }); // tokenLegado saiu
    const obj = a.carregar();
    assert.ok(!('tokenLegado' in obj));
    assert.ok('__auth' in obj);
    a.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('vazio() reflete se há dados', async () => {
  const dir = await pasta();
  try {
    const a = new Armazenamento(dir);
    assert.equal(a.vazio(), true);
    a.salvar({ __auth: {} });
    assert.equal(a.vazio(), false);
    a.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('migra o save.json antigo para o banco e renomeia o arquivo', async () => {
  const dir = await pasta();
  try {
    await writeFile(resolve(dir, 'save.json'), JSON.stringify({ __auth: { contas: [{ id: 'z' }] }, __mercado: { x: 1 } }), 'utf8');
    const a = new Armazenamento(dir);
    const migrou = await migrarSaveJson(a, dir);
    assert.equal(migrou, true);
    assert.equal(a.carregar().__auth.contas[0].id, 'z');
    assert.equal(existsSync(resolve(dir, 'save.json')), false, 'save.json foi renomeado');
    assert.ok((await readdir(dir)).some(f => f.startsWith('save.json.migrado-')));
    // Não migra de novo se o banco já tem dados.
    await writeFile(resolve(dir, 'save.json'), JSON.stringify({ __auth: { contas: [{ id: 'OUTRO' }] } }), 'utf8');
    assert.equal(await migrarSaveJson(a, dir), false);
    assert.equal(a.carregar().__auth.contas[0].id, 'z', 'manteve os dados já migrados');
    a.fechar();
  } finally { await rm(dir, { recursive: true, force: true }); }
});
