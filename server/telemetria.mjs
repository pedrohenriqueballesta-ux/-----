// Telemetria e observabilidade do jogo (item 8 do backlog de arquitetura).
// Por que existe: hoje somos cegos sobre o que o jogador faz (onde abandona, em que nível para)
// e sobre erros em produção. Aqui registramos eventos do funil e erros do servidor.
//
// Decisões:
// - Os eventos são gravados NO SERVIDOR, onde a ação autoritativa acontece — não confiamos no
//   cliente (mais confiável e à prova de trapaça). Eventos de UI pura virão por um canal à parte.
// - Armazenamento append-only em JSONL (uma linha = um evento), um arquivo por dia. Zero
//   dependência; fácil de migrar pro SQLite quando o P0 da persistência existir.
// - Escrita em lote (flush periódico) pra não bloquear o loop do jogo a cada evento.
// - Cada evento carrega versão de schema, id próprio e timestamp do servidor (padrão de telemetria).

import { appendFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export const TELEMETRIA_VERSAO = 1;

export class Telemetria {
  constructor({ dir = null, agora = () => Date.now(), flushMs = 1000 } = {}) {
    this.dir = dir;
    this.agora = agora;
    this.ativo = Boolean(dir); // sem pasta de dados (ex.: em teste) a telemetria fica inerte
    this.buffer = [];
    this.fila = Promise.resolve();
    if (this.ativo) { this.timer = setInterval(() => this.flush().catch(() => {}), flushMs); this.timer.unref?.(); }
  }

  // Enfileira um evento. tipo = nome curto do evento; dados = props enxutas e tipadas.
  registrar(tipo, dados = {}) {
    if (!this.ativo || typeof tipo !== 'string') return;
    this.buffer.push(JSON.stringify({ v: TELEMETRIA_VERSAO, id: randomUUID(), t: this.agora(), tipo, ...dados }));
  }

  // Erro do servidor: a pilha chega aqui em vez de morrer no console do processo.
  erro(origem, err, contexto = {}) {
    this.registrar('erro_servidor', {
      origem,
      mensagem: String(err?.message ?? err).slice(0, 500),
      stack: String(err?.stack ?? '').slice(0, 2000),
      ...contexto,
    });
  }

  arquivoDoDia() {
    return resolve(this.dir, 'eventos-' + new Date(this.agora()).toISOString().slice(0, 10) + '.jsonl');
  }

  // Grava o lote acumulado. Serializa as escritas (fila) pra não intercalar linhas.
  flush() {
    if (!this.ativo || !this.buffer.length) return this.fila;
    const linhas = this.buffer; this.buffer = [];
    const arquivo = this.arquivoDoDia();
    this.fila = this.fila.catch(() => {}).then(async () => {
      await mkdir(this.dir, { recursive: true });
      await appendFile(arquivo, linhas.join('\n') + '\n', 'utf8');
    });
    return this.fila;
  }

  async fechar() {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
    await this.fila.catch(() => {});
  }
}
