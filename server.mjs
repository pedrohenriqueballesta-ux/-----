import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Game } from './public/shared/index.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(root, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png', '.webp': 'image/webp' };

export async function createGameServer({ port = 3000, host = '127.0.0.1', dataDir = resolve(root, 'data') } = {}) {
  // Só para teste: DBI_CHEFE_JA=1 faz o chefe raro nascer 10 s depois de o servidor ligar (e a cada 60 s).
  const game = new Game({ chefeJa: process.env.DBI_CHEFE_JA === '1' });
  const sessions = new Map(), streams = new Map(), rates = new Map();
  let stored = {}, closing = false, pendingSave = false;
  if (dataDir) {
    await mkdir(dataDir, { recursive: true });
    try { stored = JSON.parse(await readFile(resolve(dataDir, 'save.json'), 'utf8')); } catch {}
  }
  const json = (res, code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const body = req => new Promise((resolveBody, reject) => {
    let text = '';
    req.on('data', chunk => { text += chunk; if (text.length > 8192) { reject(new Error('Requisição grande demais.')); req.destroy(); } });
    req.on('end', () => { try { resolveBody(text ? JSON.parse(text) : {}); } catch { reject(new Error('JSON inválido.')); } });
    req.on('error', reject);
  });
  const auth = req => String(req.headers.authorization || '').replace(/^Bearer /, '');
  const save = async () => {
    if (!dataDir || pendingSave) return;
    pendingSave = true;
    try {
      for (const [token, p] of sessions) stored[token] = game.exportPlayer(p);
      await writeFile(resolve(dataDir, 'save.tmp'), JSON.stringify(stored), 'utf8');
      await rename(resolve(dataDir, 'save.tmp'), resolve(dataDir, 'save.json'));
    } catch (e) { console.error('Não foi possível salvar o progresso:', e.message); }
    finally { pendingSave = false; }
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, version: '0.6.0', players: [...game.players.values()].filter(p => p.connected).length });
      if (req.method === 'POST' && url.pathname === '/api/join') {
        const input = await body(req);
        let token = typeof input.token === 'string' && /^[a-f0-9]{40}$/.test(input.token) ? input.token : null;
        // Uma aba extra ganha sua própria sessão, sem tomar o personagem da primeira aba.
        if (token && streams.get(token)?.size) token = null;
        if (token && sessions.has(token)) {
          const p = sessions.get(token); p.connected = true;
          return json(res, 200, { token, playerId: p.id, resumed: true });
        }
        const saved = token ? stored[token] : null;
        if (!saved) token = randomBytes(20).toString('hex');
        const p = game.addPlayer('p' + randomBytes(7).toString('hex'), saved?.name || input.name || 'Guerreiro', saved);
        sessions.set(token, p);
        return json(res, 200, { token, playerId: p.id, resumed: Boolean(saved) });
      }
      if (req.method === 'GET' && url.pathname === '/api/events') {
        const token = url.searchParams.get('session'), p = sessions.get(token);
        if (!p) return json(res, 401, { error: 'Sessão inválida.' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write('retry: 1500\n\n');
        if (!streams.has(token)) streams.set(token, new Set());
        streams.get(token).add(res); p.connected = true;
        res.write('data: ' + JSON.stringify(game.snapshot(p.id)) + '\n\n');
        req.on('close', () => {
          streams.get(token)?.delete(res);
          if (!streams.get(token)?.size) { p.connected = false; p.autoHunt = false; p.input = { x: 0, y: 0 }; stored[token] = game.exportPlayer(p); }
        });
        return;
      }
      if (req.method === 'POST' && ['/api/input', '/api/action', '/api/save'].includes(url.pathname)) {
        const token = auth(req), p = sessions.get(token);
        if (!p) return json(res, 401, { error: 'Sessão inválida.' });
        const now = Date.now(), last = rates.get(token) || { since: now, count: 0 };
        if (now - last.since > 1000) { last.since = now; last.count = 0; }
        last.count++; rates.set(token, last);
        if (last.count > 65) return json(res, 429, { error: 'Aguarde um instante.' });
        if (url.pathname === '/api/save') { await save(); return json(res, 200, { ok: true }); }
        const data = await body(req);
        if (url.pathname === '/api/input') { game.setInput(p.id, data); return json(res, 200, { ok: true }); }
        return json(res, 200, game.action(p.id, data));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Método não permitido.' });
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const path = resolve(publicRoot, '.' + pathname);
      if (!path.startsWith(publicRoot + sep) || !existsSync(path)) return json(res, 404, { error: 'Arquivo não encontrado.' });
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (e) { if (!res.headersSent) json(res, 400, { error: e.message || 'Requisição inválida.' }); else res.end(); }
  });
  server.requestTimeout = 15000;
  // Loop auto-corrigido: avança o jogo com o tempo real decorrido (evita a câmera lenta
  // causada pela granularidade do timer do Windows) e transmite o estado a ~20 Hz.
  let lastTick = Date.now(), lastBroadcast = 0;
  const tickLoop = () => {
    if (closing) return;
    const now = Date.now();
    game.tick((now - lastTick) / 1000); lastTick = now;
    if (now - lastBroadcast >= 50) {
      lastBroadcast = now;
      for (const [token, connections] of streams) {
        if (!connections.size) continue;
        const p = sessions.get(token), payload = 'data: ' + JSON.stringify(game.snapshot(p.id)) + '\n\n';
        for (const response of connections) if (!response.destroyed) response.write(payload);
      }
    }
    timer = setTimeout(tickLoop, 16);
  };
  let timer = setTimeout(tickLoop, 16);
  const saveTimer = setInterval(save, 5000);
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, host, ok); });
  const close = async () => {
    closing = true; clearInterval(timer); clearInterval(saveTimer); await save();
    for (const connections of streams.values()) for (const response of connections) response.end();
    await new Promise(ok => server.close(ok));
  };
  return { server, game, sessions, close, port: server.address().port };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
  const port = Number(option('--port', process.env.PORT || 3000));
  const host = option('--host', '127.0.0.1');
  createGameServer({ port, host }).then(app => {
    console.log('\nDragon Ball Idle — protótipo 0.6');
    console.log('Abra no navegador: http://localhost:' + app.port);
    console.log('Uma segunda aba cria outro jogador real no mesmo mapa.');
    console.log('Para encerrar: Ctrl+C. Progresso salvo em data/save.json.\n');
    const stop = async () => { await app.close(); process.exit(0); };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  }).catch(e => { console.error('Não foi possível iniciar:', e.message); process.exit(1); });
}
