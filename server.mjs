import {vincularPasseConta} from './public/shared/battle-pass.mjs';
import {EconomiaPremium} from './server/premium.mjs';
import {Autenticacao,FalhaAuth,AUTH_CONFIG,digest} from './server/auth.mjs';
import {conteudoEntrada} from './server/entrada-conteudo.mjs';
import {preferenciasValidas} from './public/shared/preferencias.mjs';
import {contasDoServidor,rankingServidor} from './public/shared/hud-servidor.mjs';
import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { criarBestiario } from './public/shared/bestiario.mjs';
import { Game } from './public/shared/index.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(root, 'public');
const types = { '.gif':'image/gif', '.mp3':'audio/mpeg', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png', '.webp': 'image/webp' };

export async function createGameServer({ port = 3000, host = '127.0.0.1', dataDir = resolve(root, 'data'), ambiente=process.env.NODE_ENV||'production' } = {}) {
  // Só para teste: DBI_CHEFE_JA=1 faz o chefe raro nascer 10 s depois de o servidor ligar (e a cada 60 s).
  const economiaPremium=new EconomiaPremium({ambiente});
  const game = new Game({ chefeJa: process.env.DBI_CHEFE_JA === '1' });
  const sessions = new Map(), streams = new Map(), rates = new Map();
  let stored = {}, closing = false, filaSave = Promise.resolve();
  if (dataDir) {
    await mkdir(dataDir, { recursive: true });
    try { stored = JSON.parse(await readFile(resolve(dataDir, 'save.json'), 'utf8')); } catch {}
  }
  const autenticacao=new Autenticacao();autenticacao.restaurar(stored.__auth);
  if(dataDir&&!stored.__auth&&Object.keys(stored).some(k=>!k.startsWith('__')))await writeFile(resolve(dataDir,'save-antes-auth-'+Date.now()+'.json'),JSON.stringify(stored),'utf8');
  game.mercado.restaurar(stored.__mercado);game.guildas.restaurar(stored.__guildas);
  const json = (res, code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const body = req => new Promise((resolveBody, reject) => {
    let text = '';
    req.on('data', chunk => { text += chunk; if (text.length > 8192) { reject(new Error('Requisição grande demais.')); req.destroy(); } });
    req.on('end', () => { try { resolveBody(text ? JSON.parse(text) : {}); } catch { reject(new Error('JSON inválido.')); } });
    req.on('error', reject);
  });
  const auth = req => {
    const cookie=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('dbi_session='));
    return cookie?cookie.slice('dbi_session='.length):String(req.headers.authorization||'').replace(/^Bearer /,'');
  };
  const cookie=(req,token,limpar=false)=>'dbi_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+(limpar?0:Math.floor(AUTH_CONFIG.sessaoMs/1000))+((req.socket.encrypted||req.headers['x-forwarded-proto']==='https'||process.env.COOKIE_SECURE==='true')?'; Secure':'');
  const guardar=p=>{const a=autenticacao.contas.get(p.contaId),c=a?.personagens.find(c=>c.id===p.personagemId);if(c)c.save=game.exportPlayer(p);};
  const congelar=id=>{const p=sessions.get(id);if(p){guardar(p);p.connected=false;p.autoHunt=false;p.input={x:0,y:0};p.moveTo=null;p.targetId=null;sessions.delete(id);}const respostas=streams.get(id);streams.delete(id);for(const r of respostas||[])r.end();const sessao=autenticacao.sessoes.get(id);if(sessao){sessao.ativo=null;sessao.selecionado=null;}};
  const congelarConta=id=>{for(const[h,p]of sessions)if(p.contaId===id)congelar(h);};
  const exigir=req=>{const a=autenticacao.sessao(auth(req));if(!a)throw new FalhaAuth('sessaoExpirada',401);return a;};
  const mundo=req=>{const a=exigir(req),p=sessions.get(a.id);if(!p||!a.ativo||a.ativo!==a.selecionado||p.personagemId!==a.ativo||p.contaId!==a.conta.id)throw new FalhaAuth('selecionePersonagem',403);return{...a,p};};
  const online=()=>new Set([...streams].filter(([id,r])=>r.size&&sessions.get(id)?.connected).map(([id])=>sessions.get(id).id)).size;
  const contasPublicas=()=>{const personagens={};for(const a of autenticacao.contas.values())for(const c of a.personagens)personagens[c.id]=c.save;return contasDoServidor({...stored,...personagens},sessions);};
  const importarLegado=(a,token)=>{if(typeof token!=='string'||!/^[a-f0-9]{40}$/.test(token)||!stored[token]?.name||a.personagens.length>=autenticacao.maxPersonagens)return false;const salvo=stored[token];if(salvo.mercadoId&&[...autenticacao.contas.values()].some(a=>a.personagens.some(c=>c.save.mercadoId===salvo.mercadoId)))return false;a.personagens.push({id:randomBytes(16).toString('hex'),criadoEm:Date.now(),save:{...structuredClone(salvo),mercadoId:salvo.mercadoId||'c'+randomBytes(12).toString('hex')}});delete stored[token];return true;};
  // Um único arquivo guarda contas, itens reservados e créditos: não há meia negociação salva.
  const save = () => {
    if(!dataDir)return Promise.resolve();
    const tarefa=filaSave.catch(()=>{}).then(async()=>{
      for(const p of sessions.values())guardar(p);stored.__auth=autenticacao.exportar();
      stored.__mercado=game.mercado.exportar();stored.__guildas=game.guildas.exportar();
      await writeFile(resolve(dataDir,'save.tmp'),JSON.stringify(stored),'utf8');
      await rename(resolve(dataDir,'save.tmp'),resolve(dataDir,'save.json'));
    });
    filaSave=tarefa;return tarefa;
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if(req.method==='POST'){
        const origin=req.headers.origin,protocolo=req.socket.encrypted||req.headers['x-forwarded-proto']==='https'?'https:':'http:';
        if(origin&&origin!==protocolo+'//'+req.headers.host)throw new FalhaAuth('origemInvalida',403);
        if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')&&url.pathname!=='/api/save')throw new FalhaAuth('requisicaoInvalida',415);
      }
      if(req.method==='GET'&&url.pathname==='/api/entrada'){
        let config={};if(dataDir)try{config=JSON.parse(await readFile(resolve(dataDir,'entrada-conteudo.json'),'utf8'));}catch{}
        return json(res,200,{...conteudoEntrada(config),online:online()});
      }
      if(url.pathname.startsWith('/api/auth/')){
        const rota=url.pathname.slice('/api/auth/'.length),ip=req.socket.remoteAddress||'local';
        if(req.method==='GET'&&rota==='sessao'){const a=exigir(req);congelar(a.id);await save();return json(res,200,{ok:true,conta:autenticacao.publico(a.conta)});}
        if(req.method!=='POST')return json(res,405,{error:'metodoInvalido'});
        const d=await body(req);
        if(rota==='cadastro'||rota==='login'){
          const r=await autenticacao[rota==='cadastro'?'registrar':'login'](d,ip);congelarConta(r.conta.id);const importado=importarLegado(r.conta,d.legacyToken);await save();res.setHeader('Set-Cookie',cookie(req,r.token));return json(res,200,{ok:true,conta:autenticacao.publico(r.conta),legacyImportado:importado,...(r.chaveRecuperacao?{chaveRecuperacao:r.chaveRecuperacao}:{})});
        }
        if(rota==='recuperar'){const r=await autenticacao.recuperar(d,ip);congelarConta(r.conta.id);await save();res.setHeader('Set-Cookie',cookie(req,'',true));return json(res,200,{ok:true,chaveRecuperacao:r.chaveRecuperacao});}
        const a=exigir(req);
        if(rota==='sair'){congelar(a.id);autenticacao.sessoes.delete(a.id);await save();res.setHeader('Set-Cookie',cookie(req,'',true));return json(res,200,{ok:true});}
        if(rota==='voltar'){congelar(a.id);await save();return json(res,200,{ok:true,conta:autenticacao.publico(a.conta)});}
        if(rota==='criar-personagem'){const c=autenticacao.criarPersonagem(a.conta,d,Object.entries(stored).filter(([k])=>!k.startsWith('__')).map(([,p])=>p?.name));await save();return json(res,200,{ok:true,id:c.id,conta:autenticacao.publico(a.conta)});}
        if(rota==='selecionar'){autenticacao.dono(a.conta,d.id);congelar(a.id);a.registro.selecionado=d.id;return json(res,200,{ok:true});}
        if(rota==='entrar'){
          const c=autenticacao.dono(a.conta,a.registro.selecionado);congelarConta(a.conta.id);a.registro.selecionado=c.id;a.registro.ativo=c.id;
          const p=game.addPlayer('p'+c.id,c.save.name,c.save);p.contaId=a.conta.id;p.personagemId=c.id;vincularPasseConta(a.conta,p);if(a.conta.audio)p.preferencias=preferenciasValidas({...p.preferencias,...a.conta.audio});sessions.set(a.id,p);await save();return json(res,200,{ok:true,playerId:p.id,conta:autenticacao.publico(a.conta)});
        }
        if(rota==='preferencias'){
          if(d.idioma!==undefined){if(!['pt-BR','en','es'].includes(d.idioma))throw new FalhaAuth('idiomaInvalido');a.conta.idioma=d.idioma;}
          if(d.audio!==undefined){const p=preferenciasValidas(d.audio);a.conta.audio={musicaAtiva:p.musicaAtiva,volumeMusica:p.volumeMusica};const player=sessions.get(a.id);if(player)player.preferencias=preferenciasValidas({...player.preferencias,...a.conta.audio});}
          await save();return json(res,200,{ok:true,conta:autenticacao.publico(a.conta)});
        }
        if(rota==='tutorial'){const r=autenticacao.tutorial(a.conta,d);await save();return json(res,200,{...r,conta:autenticacao.publico(a.conta)});}
        return json(res,404,{error:'rotaInvalida'});
      }
      if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, version: '0.6.0', players: online() });
      if (req.method === 'GET' && url.pathname === '/api/bestiario') {mundo(req);return json(res, 200, { inimigos:criarBestiario(game.mobs.values()) });}
      if (req.method === 'GET' && url.pathname === '/api/mercado') {mundo(req);return json(res,200,game.mercado.publico());}
      if(url.pathname==='/api/join')return json(res,401,{error:'autenticacaoObrigatoria'});
      if (req.method === 'GET' && url.pathname === '/api/events') {
        const acesso=mundo(req),token=acesso.id,p=acesso.p;
        if (!p) return json(res, 401, { error: 'Sessão inválida.' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write('retry: 1500\n\n');
        if (!streams.has(token)) streams.set(token, new Set());
        streams.get(token).add(res); p.connected = true;
        res.write('data: ' + JSON.stringify(game.snapshot(p.id)) + '\n\n');
        req.on('close', () => {
          streams.get(token)?.delete(res);
          if(!streams.get(token)?.size&&sessions.get(token)===p)congelar(token);
        });
        return;
      }
      if(req.method==='GET'&&url.pathname==='/api/premium'){const a=mundo(req);return json(res,200,economiaPremium.estado(a.conta,a.p));}
      if (req.method === 'POST' && ['/api/premium','/api/input', '/api/action', '/api/save','/api/hud'].includes(url.pathname)) {
        const acesso=mundo(req),token=acesso.id,p=acesso.p;
        if (!p) return json(res, 401, { error: 'Sessão inválida.' });
        const now = Date.now(), last = rates.get(token) || { since: now, count: 0 };
        if (now - last.since > 1000) { last.since = now; last.count = 0; }
        last.count++; rates.set(token, last);
        if (last.count > 65) return json(res, 429, { error: 'Aguarde um instante.' });
        if (url.pathname === '/api/save') { await save(); return json(res, 200, { ok: true }); }
        const data = await body(req);
        if(url.pathname==='/api/premium'){const r=economiaPremium.processar(acesso.conta,p,data);if(r.ok)await save();return json(res,200,r);}
        if(url.pathname==='/api/hud'){
          const contas=contasPublicas();
          if(data.aba==='ranking')return json(res,200,rankingServidor(contas,p.mercadoId,data,game.guildas));
          if(data.aba==='guilda'){
            if(data.operacao){if(!p.connected)return json(res,400,{ok:false,reason:'Personagem desconectado.'});const r=game.guildas.processar(p,data,contas);if(r.ok)await save();return json(res,200,r);}
            return json(res,200,game.guildas.resumo(p,contas));
          }
          return json(res,400,{ok:false,reason:'Aba inválida.'});
        }
        if (url.pathname === '/api/input') { game.setInput(p.id, data); return json(res, 200, { ok: true }); }
        const resultado=game.action(p.id,data);
        if(resultado.ok&&data.type==='preferencias')acesso.conta.audio={musicaAtiva:p.preferencias.musicaAtiva,volumeMusica:p.preferencias.volumeMusica};
        if(resultado.ok && ['buy','buyAll','sell','venderItem','mercadoAnunciar','mercadoComprar','mercadoCancelar','mercadoReceber','preferencias','resgatarMissao','acompanharMissao','correio','lerNovidades'].includes(data.type))await save();
        return json(res,200,resultado);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Método não permitido.' });
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const path = resolve(publicRoot, '.' + pathname);
      if (!path.startsWith(publicRoot + sep) || !existsSync(path)) return json(res, 404, { error: 'Arquivo não encontrado.' });
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff','Content-Length':data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (e) { if (!res.headersSent) json(res,e instanceof FalhaAuth?e.status:400,{error:e instanceof FalhaAuth?e.code:'requisicaoInvalida'}); else res.end(); }
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
        const p = sessions.get(token);if(!p||!autenticacao.sessoes.has(token)||autenticacao.sessoes.get(token).expira<=Date.now()){congelar(token);continue;}const payload = 'data: ' + JSON.stringify(game.snapshot(p.id)) + '\n\n';
        for (const response of connections) if (!response.destroyed) response.write(payload);
      }
    }
    timer = setTimeout(tickLoop, 16);
  };
  let timer = setTimeout(tickLoop, 16);
  const saveTimer = setInterval(()=>save().catch(e=>console.error('Não foi possível salvar o progresso:',e.message)),5000);
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, host, ok); });
  const close = async () => {
    closing = true; clearInterval(timer); clearInterval(saveTimer); await save();
    for (const connections of streams.values()) for (const response of connections) response.end();
    await new Promise(ok => server.close(ok));
  };
  return { server, game, sessions, autenticacao, economiaPremium, close, port: server.address().port };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
  const port = Number(option('--port', process.env.PORT || 3000));
  // Em hospedagem (Render/Railway/etc.) a plataforma define PORT e espera o servico ouvindo em 0.0.0.0.
  // Local sem PORT continua em 127.0.0.1 (privado). --host ou HOST sobrescrevem.
  const host = option('--host', process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1'));
  createGameServer({ port, host }).then(app => {
    console.log('\nDragon Ball Idle — protótipo 0.6');
    console.log('Abra no navegador: http://localhost:' + app.port);
    console.log('Entre com sua conta e selecione um personagem para jogar.');
    console.log('Para encerrar: Ctrl+C. Progresso salvo em data/save.json.\n');
    const stop = async () => { await app.close(); process.exit(0); };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  }).catch(e => { console.error('Não foi possível iniciar:', e.message); process.exit(1); });
}
