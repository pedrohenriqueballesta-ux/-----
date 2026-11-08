import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGameServer} from '../server.mjs';
import {criarSessaoTeste,reentrarSessaoTeste,postTeste} from './auth-helper.mjs';
import {registrarMissao} from '../public/shared/missoes.mjs';
const get=(base,token)=>fetch(base+'/api/premium',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
test('API premium exige autenticação, isola contas, é idempotente e persiste conta/passe após reiniciar',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dbi-premium-'));let app;
 try{
  app=await createGameServer({port:0,dataDir:dir,ambiente:'development'});let base='http://127.0.0.1:'+app.port;
  assert.equal((await fetch(base+'/api/premium')).status,401);
  for(const nome of ['store','battle-pass']){const r=await fetch(base+'/assets/premium/'+nome+'.gif');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/gif');assert.ok((await r.arrayBuffer()).byteLength>100000);}
  const a=await criarSessaoTeste(base,'Premium QA'),b=await criarSessaoTeste(base,'Outra conta QA');
  const q=await postTeste(base,'premium',{operacao:'prepararCompra',produto:'moedas-500'},a.token);assert.equal(q.dados.ok,true);
  assert.equal((await postTeste(base,'premium',{operacao:'confirmarCompra',cotacao:q.dados.cotacao.id},b.token)).dados.ok,false);
  const respostas=await Promise.all([1,2].map(()=>postTeste(base,'premium',{operacao:'confirmarCompra',cotacao:q.dados.cotacao.id,saldo:99999999,preco:0},a.token)));
  assert.ok(respostas.every(r=>r.dados.ok));assert.equal((await get(base,a.token)).saldo,500);assert.equal((await get(base,b.token)).saldo,0);
  const p=[...app.game.players.values()].find(p=>p.id===a.playerId);const agora=Date.parse('2026-11-08T12:00:00Z');app.economiaPremium.agora=()=>agora;registrarMissao(p,'kills',1000,agora);
  assert.equal((await postTeste(base,'premium',{operacao:'resgatarMissao',id:'dia-caca'},a.token)).dados.ok,true);
  const passe=await postTeste(base,'premium',{operacao:'prepararCompra',produto:'passe-s1'},a.token);assert.equal(passe.dados.ok,true);
  assert.equal((await postTeste(base,'premium',{operacao:'confirmarCompra',cotacao:passe.dados.cotacao.id},a.token)).dados.ok,true);
  assert.equal((await postTeste(base,'premium',{operacao:'resgatarRecompensa',nivel:1,trilha:'premium'},a.token)).dados.ok,true);
  assert.equal((await postTeste(base,'premium',{operacao:'resgatarRecompensa',nivel:1,trilha:'premium'},a.token)).dados.ok,false);
  const novo=await postTeste(base,'auth/criar-personagem',{nome:'Outro guerreiro QA',vocacao:'goku'},a.token);assert.equal(novo.dados.ok,true);
  await postTeste(base,'auth/selecionar',{id:novo.dados.id},a.token);await postTeste(base,'auth/entrar',{},a.token);
  let estado=await get(base,a.token);assert.equal(estado.saldo,0);assert.equal(estado.battlePass.premium,true);assert.equal(estado.battlePass.xp,1100);assert.equal(estado.colecao[0].id,'traje-escarlate');
  await app.close();app=await createGameServer({port:0,dataDir:dir,ambiente:'development'});app.economiaPremium.agora=()=>agora;base='http://127.0.0.1:'+app.port;
  await reentrarSessaoTeste(base,a.token);estado=await get(base,a.token);assert.equal(estado.saldo,0);assert.equal(estado.battlePass.premium,true);assert.equal(estado.battlePass.xp,1100);assert.equal(estado.colecao[0].id,'traje-escarlate');assert.equal(estado.historico.length,3);
 }finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
});
test('API de produção mantém recargas simuladas bloqueadas mesmo com parâmetros forjados',async()=>{
 const app=await createGameServer({port:0,dataDir:null,ambiente:'production'});
 try{const base='http://127.0.0.1:'+app.port,a=await criarSessaoTeste(base,'QA Producao');const r=await postTeste(base,'premium',{operacao:'prepararCompra',produto:'moedas-2500',ambiente:'development',simulacao:true,moedas:10000000},a.token);assert.equal(r.dados.ok,false);assert.equal((await get(base,a.token)).saldo,0);}finally{await app.close();}
});