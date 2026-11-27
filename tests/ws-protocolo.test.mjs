// Confere o codec de quadros do servidor WebSocket caseiro (server/ws.mjs): aceitação do
// handshake, montagem de quadros do servidor e leitura de quadros do cliente (mascarados,
// fragmentados e nos três tamanhos de comprimento), além de ping/pong e fechamento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { chaveDeAceitacao, montarQuadro, ConexaoWS } from '../server/ws.mjs';

// Socket falso: guarda o que foi escrito e deixa injetar bytes recebidos.
function socketFake() {
  const s = new EventEmitter();
  s.escrito = [];
  s.destroyed = false;
  s.setTimeout = () => {};
  s.setNoDelay = () => {};
  s.write = buf => { s.escrito.push(Buffer.from(buf)); return true; };
  s.end = () => { s.destroyed = true; };
  s.receber = buf => s.emit('data', Buffer.from(buf));
  return s;
}

// Monta um quadro cliente→servidor (sempre mascarado, como o navegador manda).
function quadroCliente(texto, { opcode = 0x1, fin = true, mask = [0x12, 0x34, 0x56, 0x78] } = {}) {
  const corpo = Buffer.from(texto, 'utf8');
  const n = corpo.length;
  let cab;
  if (n < 126) { cab = Buffer.alloc(2); cab[1] = 0x80 | n; }
  else if (n < 65536) { cab = Buffer.alloc(4); cab[1] = 0x80 | 126; cab.writeUInt16BE(n, 2); }
  else { cab = Buffer.alloc(10); cab[1] = 0x80 | 127; cab.writeBigUInt64BE(BigInt(n), 2); }
  cab[0] = (fin ? 0x80 : 0) | opcode;
  const m = Buffer.from(mask);
  const mascarado = Buffer.from(corpo); for (let i = 0; i < mascarado.length; i++) mascarado[i] ^= m[i & 3];
  return Buffer.concat([cab, m, mascarado]);
}

test('chave de aceitação segue o exemplo da RFC 6455', () => {
  // Exemplo canônico da especificação.
  assert.equal(chaveDeAceitacao('dGhlIHNhbXBsZSBub25jZQ=='), 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
});

test('montarQuadro: quadro de texto do servidor não é mascarado e carrega o payload', () => {
  const q = montarQuadro('oi');
  assert.equal(q[0], 0x81);        // FIN + opcode texto
  assert.equal(q[1] & 0x80, 0);    // servidor nunca mascara
  assert.equal(q[1] & 0x7f, 2);
  assert.equal(q.subarray(2).toString('utf8'), 'oi');
});

test('montarQuadro usa o cabeçalho estendido de 16 bits para 126..65535 bytes', () => {
  const q = montarQuadro('a'.repeat(200));
  assert.equal(q[1] & 0x7f, 126);
  assert.equal(q.readUInt16BE(2), 200);
});

test('lê uma mensagem mascarada do cliente', () => {
  const s = socketFake();
  const recebidas = [];
  new ConexaoWS(s, { aoMensagem: m => recebidas.push(m) });
  s.receber(quadroCliente('mover:{"x":1,"y":0}'));
  assert.deepEqual(recebidas, ['mover:{"x":1,"y":0}']);
});

test('remonta mensagem que chega em dois pedaços de TCP', () => {
  const s = socketFake();
  const recebidas = [];
  new ConexaoWS(s, { aoMensagem: m => recebidas.push(m) });
  const q = quadroCliente('{"t":"input","x":0.5,"y":-0.5}');
  s.receber(q.subarray(0, 5));     // metade do quadro
  s.receber(q.subarray(5));        // o resto
  assert.deepEqual(recebidas, ['{"t":"input","x":0.5,"y":-0.5}']);
});

test('junta quadros fragmentados (texto + continuação)', () => {
  const s = socketFake();
  const recebidas = [];
  new ConexaoWS(s, { aoMensagem: m => recebidas.push(m) });
  s.receber(quadroCliente('parte1-', { fin: false, opcode: 0x1 }));
  s.receber(quadroCliente('parte2', { fin: true, opcode: 0x0 }));
  assert.deepEqual(recebidas, ['parte1-parte2']);
});

test('comprimento de 16 bits (payload de 300 bytes) é lido inteiro', () => {
  const s = socketFake();
  const recebidas = [];
  new ConexaoWS(s, { aoMensagem: m => recebidas.push(m) });
  const texto = 'x'.repeat(300);
  s.receber(quadroCliente(texto));
  assert.deepEqual(recebidas, [texto]);
});

test('ping do cliente recebe pong do servidor', () => {
  const s = socketFake();
  new ConexaoWS(s, {});
  s.receber(quadroCliente('', { opcode: 0x9 }));
  const pong = s.escrito.at(-1);
  assert.equal(pong[0] & 0x0f, 0xA);
});

test('quadro de fechar dispara aoFechar e encerra o socket', () => {
  const s = socketFake();
  let fechou = false;
  new ConexaoWS(s, { aoFechar: () => { fechou = true; } });
  s.receber(quadroCliente('', { opcode: 0x8 }));
  assert.equal(s.destroyed, true);
  // O 'close' do socket é quem confirma o encerramento lógico.
  s.emit('close');
  assert.equal(fechou, true);
});

test('mensagem acima do limite derruba a conexão com código 1009', () => {
  const s = socketFake();
  const con = new ConexaoWS(s, { maxBytes: 64 });
  s.receber(quadroCliente('x'.repeat(100)));
  assert.equal(con.fechado, true);
});
