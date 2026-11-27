// Confere o versionamento do save (item 4): exportPlayer carimba a versão da shape e migrarSave
// sobe saves antigos (sem schema = versão 0) para a versão atual, de forma idempotente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { migrarSave, SAVE_SCHEMA } from '../public/shared/nucleo/characters.mjs';

test('exportPlayer carimba a versão atual da shape', () => {
  const g = new Game({ populate: false });
  const p = g.addPlayer('a', 'Teste', { name: 'Teste', vocacao: 'goku', character: 'Goku', level: 3, mercadoId: 'c', godmode: false });
  assert.equal(g.exportPlayer(p).schema, SAVE_SCHEMA);
});

test('migrarSave trata save legado (sem schema) como versão 0 e sobe para a atual', () => {
  const legado = { name: 'Velho', level: 50 }; // sem campo schema
  const migrado = migrarSave(legado);
  assert.equal(migrado.schema, SAVE_SCHEMA);
  assert.equal(migrado.name, 'Velho'); // não perde dados
});

test('migrarSave é idempotente e não rebaixa versões futuras', () => {
  const futuro = { name: 'Novo', schema: SAVE_SCHEMA + 5 };
  assert.equal(migrarSave(futuro).schema, SAVE_SCHEMA + 5, 'não rebaixa um save mais novo');
  const atual = { schema: SAVE_SCHEMA };
  assert.equal(migrarSave(migrarSave(atual)).schema, SAVE_SCHEMA);
});

test('migrarSave tolera entrada inválida', () => {
  assert.equal(migrarSave(null), null);
  assert.equal(migrarSave(undefined), undefined);
});
