// Persistência do jogo em SQLite (item P0 do backlog de arquitetura).
// Por que existe: antes tudo vivia num único data/save.json reescrito inteiro a cada 5 s — frágil
// (perde entre um save e um crash, sem transação, sem consulta). Aqui guardamos o MESMO objeto
// `stored` de sempre ({ __auth, __mercado, __guildas, <token legado>: save, ... }), mas em SQLite
// com transação atômica + WAL: durável, sem reescrever o arquivo todo, e base para offline/consulta.
//
// Usa o SQLite EMBUTIDO do Node (node:sqlite) — zero dependência, sem build nativo, mantém o
// "clona e roda". Requer Node 24+ (onde node:sqlite roda sem flag).
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { readFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const SCHEMA_VERSAO = 1;

export class Armazenamento {
  constructor(dir) {
    this.db = new DatabaseSync(resolve(dir, 'jogo.db'));
    // WAL + synchronous NORMAL: durável a crash com boa performance (padrão recomendado do SQLite).
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('CREATE TABLE IF NOT EXISTS estado (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)');
    this.db.exec('CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)');
    if (!this.db.prepare('SELECT valor FROM meta WHERE chave = ?').get('schemaVersion'))
      this.db.prepare('INSERT INTO meta (chave, valor) VALUES (?, ?)').run('schemaVersion', String(SCHEMA_VERSAO));
    this.selTudo = this.db.prepare('SELECT chave, valor FROM estado');
    this.umaLinha = this.db.prepare('SELECT 1 FROM estado LIMIT 1');
    this.upsert = this.db.prepare('INSERT INTO estado (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor');
    this.del = this.db.prepare('DELETE FROM estado WHERE chave = ?');
  }

  vazio() { return !this.umaLinha.get(); }

  // Reconstrói o objeto `stored` a partir das linhas (uma linha por chave de topo).
  carregar() {
    const obj = {};
    for (const { chave, valor } of this.selTudo.all()) { try { obj[chave] = JSON.parse(valor); } catch {} }
    return obj;
  }

  // Grava o objeto inteiro numa transação: upsert de cada chave e remove as que sumiram
  // (ex.: token legado migrado para conta). Atômico — ou grava tudo, ou nada.
  salvar(stored) {
    const chaves = Object.keys(stored), presentes = new Set(chaves);
    this.db.exec('BEGIN');
    try {
      for (const k of chaves) this.upsert.run(k, JSON.stringify(stored[k]));
      for (const { chave } of this.selTudo.all()) if (!presentes.has(chave)) this.del.run(chave);
      this.db.exec('COMMIT');
    } catch (e) { try { this.db.exec('ROLLBACK'); } catch {} throw e; }
  }

  fechar() { try { this.db.close(); } catch {} }
}

// Migração única do save.json antigo para o banco, só se o banco ainda estiver vazio.
// Preserva o arquivo renomeando-o (não apaga histórico).
export async function migrarSaveJson(armazenamento, dir) {
  if (!armazenamento.vazio()) return false;
  const caminho = resolve(dir, 'save.json');
  if (!existsSync(caminho)) return false;
  let antigo;
  try { antigo = JSON.parse(await readFile(caminho, 'utf8')); } catch { return false; }
  if (!antigo || typeof antigo !== 'object') return false;
  armazenamento.salvar(antigo);
  await rename(caminho, resolve(dir, 'save.json.migrado-' + Date.now())).catch(() => {});
  return true;
}
