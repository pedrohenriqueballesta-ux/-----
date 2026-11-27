// Servidor WebSocket mínimo em Node puro (RFC 6455), sem dependências externas.
// Por que existe: o input do jogador e o estado do mundo viajavam por HTTP (POST a cada 70 ms
// + SSE). O POST por requisição engasgava sob latência (a trava de envio pulava pacotes e o
// servidor zerava o movimento após 0,35 s sem input), causando travadas e rollback ao andar.
// Um socket persistente e bidirecional remove esse atrito. O projeto não tem etapa de build
// nem dependências (regra do CLAUDE.md), então o protocolo é implementado à mão aqui.

import { createHash } from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// Chave de aceitação do handshake: base64( sha1( chaveDoCliente + GUID ) ).
export function chaveDeAceitacao(chaveCliente) {
  return createHash('sha1').update(chaveCliente + GUID).digest('base64');
}

export function ehUpgradeWebSocket(req) {
  return String(req.headers.upgrade || '').toLowerCase() === 'websocket'
    && typeof req.headers['sec-websocket-key'] === 'string'
    && req.headers['sec-websocket-key'].length > 0;
}

// Monta um quadro servidor→cliente (nunca mascarado, por especificação). opcode: 0x1 texto,
// 0x8 fechar, 0x9 ping, 0xA pong.
export function montarQuadro(dados, opcode = 0x1) {
  const corpo = typeof dados === 'string' ? Buffer.from(dados, 'utf8') : dados;
  const n = corpo.length;
  let cabecalho;
  if (n < 126) { cabecalho = Buffer.alloc(2); cabecalho[1] = n; }
  else if (n < 65536) { cabecalho = Buffer.alloc(4); cabecalho[1] = 126; cabecalho.writeUInt16BE(n, 2); }
  else { cabecalho = Buffer.alloc(10); cabecalho[1] = 127; cabecalho.writeBigUInt64BE(BigInt(n), 2); }
  cabecalho[0] = 0x80 | opcode; // FIN + opcode
  return Buffer.concat([cabecalho, corpo]);
}

// Conexão já estabelecida. Acumula bytes do socket, remonta os quadros (inclusive fragmentados
// e mascarados, como o navegador envia) e entrega mensagens de texto por `aoMensagem`.
export class ConexaoWS {
  constructor(socket, { aoMensagem, aoFechar, maxBytes = 1 << 20 } = {}) {
    this.socket = socket;
    this.aoMensagem = aoMensagem;
    this.aoFechar = aoFechar;
    this.maxBytes = maxBytes;
    this.buffer = Buffer.alloc(0);
    this.fragmentos = [];
    this.fragOpcode = 0;
    this.fechado = false;
    socket.setTimeout(0);
    socket.setNoDelay(true); // movimento é latência-sensível: não acumular no algoritmo de Nagle
    socket.on('data', c => this._receber(c));
    socket.on('close', () => this._encerrar());
    socket.on('error', () => this._encerrar());
  }

  enviar(texto) {
    if (this.fechado || this.socket.destroyed) return;
    // Cliente lento: se o buffer de saída já acumulou, descarta este quadro em vez de empilhar
    // memória sem limite. O estado é completo a cada envio (não é incremental), então pular um
    // não corrompe nada — o próximo snapshot já traz tudo.
    if (this.socket.writableLength > this.maxBytes) return;
    try { this.socket.write(montarQuadro(texto, 0x1)); } catch {}
  }

  ping() {
    if (this.fechado || this.socket.destroyed) return;
    try { this.socket.write(montarQuadro(Buffer.alloc(0), 0x9)); } catch {}
  }

  fechar(codigo = 1000) {
    if (this.fechado) { try { this.socket.end(); } catch {} return; }
    this.fechado = true;
    const corpo = Buffer.alloc(2); corpo.writeUInt16BE(codigo, 0);
    try { this.socket.write(montarQuadro(corpo, 0x8)); } catch {}
    try { this.socket.end(); } catch {}
  }

  _encerrar() {
    if (this._encerrado) return;
    this._encerrado = true; this.fechado = true;
    try { this.aoFechar?.(); } catch {}
  }

  _receber(chunk) {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;
    while (!this.fechado) {
      const quadro = this._lerQuadro();
      if (!quadro) break;
      this._tratarQuadro(quadro);
    }
  }

  // Retorna o próximo quadro completo do buffer, ou null se ainda faltam bytes.
  _lerQuadro() {
    const b = this.buffer;
    if (b.length < 2) return null;
    const fin = (b[0] & 0x80) !== 0, opcode = b[0] & 0x0f;
    const mascarado = (b[1] & 0x80) !== 0;
    let len = b[1] & 0x7f, desloc = 2;
    if (len === 126) { if (b.length < 4) return null; len = b.readUInt16BE(2); desloc = 4; }
    else if (len === 127) {
      if (b.length < 10) return null;
      const grande = b.readBigUInt64BE(2);
      if (grande > BigInt(this.maxBytes)) { this.fechar(1009); return null; }
      len = Number(grande); desloc = 10;
    }
    if (len > this.maxBytes) { this.fechar(1009); return null; }
    const chaveLen = mascarado ? 4 : 0;
    if (b.length < desloc + chaveLen + len) return null; // quadro ainda incompleto
    let payload = Buffer.from(b.subarray(desloc + chaveLen, desloc + chaveLen + len));
    if (mascarado) {
      const mask = b.subarray(desloc, desloc + 4);
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
    }
    this.buffer = b.subarray(desloc + chaveLen + len);
    return { fin, opcode, payload };
  }

  _tratarQuadro({ fin, opcode, payload }) {
    if (opcode === 0x8) { this.fechar(1000); return; }           // fechar
    if (opcode === 0x9) {                                         // ping → responde pong
      if (!this.fechado && !this.socket.destroyed) { try { this.socket.write(montarQuadro(payload, 0xA)); } catch {} }
      return;
    }
    if (opcode === 0xA) return;                                   // pong: ignora
    if (opcode !== 0x0 && opcode !== 0x1 && opcode !== 0x2) { this.fechar(1002); return; }
    this.fragmentos.push(payload);
    if (opcode !== 0x0) this.fragOpcode = opcode;                 // primeiro fragmento define o tipo
    let total = 0; for (const f of this.fragmentos) total += f.length;
    if (total > this.maxBytes) { this.fechar(1009); return; }
    if (!fin) return;
    const completo = Buffer.concat(this.fragmentos);
    this.fragmentos = [];
    if (this.fragOpcode === 0x1) { try { this.aoMensagem?.(completo.toString('utf8')); } catch {} }
  }
}

// Responde o handshake de upgrade e devolve a conexão pronta.
export function aceitarUpgrade(req, socket, opcoes) {
  const chave = req.headers['sec-websocket-key'];
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + chaveDeAceitacao(chave) + '\r\n\r\n'
  );
  return new ConexaoWS(socket, opcoes);
}
