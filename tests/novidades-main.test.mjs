import test from 'node:test';import assert from 'node:assert/strict';
import {NovidadesMain,noticiaDoCommit} from '../server/novidades-main.mjs';
import {createGameServer} from '../server.mjs';
const sha=n=>n.toString(16).padStart(40,'0');
const commit=(n,pai,mensagem,autor='colaborador')=>({sha:sha(n),parents:pai?[{sha:sha(pai)}]:[],commit:{message:mensagem,committer:{date:'2026-11-08T15:00:00Z',name:autor}}});
test('mural percorre primeiro pai da main e mostra cinco publicações sem filtrar colaboradores',async()=>{
 const lista=[commit(9,7,'Merge pull request #9\n\nfeat: nova loja','Eduardo'),commit(8,6,'feat: commit interno'),commit(7,6,'fix: cura','Pedro'),commit(6,5,'feat: mapa','Outro'),commit(5,4,'style: login','Quarto'),commit(4,3,'docs: ajuda')];let chamadas=0;
 const news=new NovidadesMain({iniciais:[],buscar:async()=>{chamadas++;return{ok:true,json:async()=>lista};}});await news.atualizar();
 assert.equal(chamadas,1);assert.deepEqual(news.obter().map(n=>n.id),[9,7,6,5,4].map(sha));assert.equal(news.obter()[0].titulo,'Atualização #9');assert.equal(news.obter()[0].data,'2026-11-08T15:00:00Z');assert.equal(news.obter().some(n=>n.titulo==='commit interno'),false);
});
test('cache compartilha consulta concorrente, atualiza sem reinício e conserva notícias se GitHub falhar',async()=>{
 let agora=100,lista=[commit(1,0,'feat: primeira')],falhar=false,chamadas=0;
 const news=new NovidadesMain({agora:()=>agora,iniciais:[],buscar:async()=>{chamadas++;if(falhar)throw Error('rede');return {ok:true,json:async()=>lista};}});
 await Promise.all([news.atualizar(),news.atualizar()]);assert.equal(chamadas,1);news.obter();assert.equal(chamadas,1);
 agora+=300001;lista=[commit(2,1,'fix: segunda'),...lista];news.obter();await news.pendente;assert.equal(news.obter()[0].titulo,'segunda');falhar=true;agora+=300001;news.obter();await news.pendente;assert.equal(news.obter()[0].titulo,'segunda');const total=chamadas;news.obter();assert.equal(chamadas,total);
});
test('pai fora da página inicial é consultado e mensagens inválidas não apagam mural',async()=>{
 const a=commit(2,1,'Merge pull request #2\n\nfeat: ajustes');const urls=[];
 const news=new NovidadesMain({iniciais:[],buscar:async url=>{urls.push(url);return {ok:true,json:async()=>urls.length===1?[a]:commit(1,0,'fix: anterior')};}});await news.atualizar();assert.equal(urls.length,2);assert.equal(news.obter().length,2);
 assert.equal(noticiaDoCommit({...a,sha:'inválido'}),null);assert.equal(noticiaDoCommit({...a,commit:{message:'x',committer:{date:'inválida'}}}),null);
});
test('endpoint público entrega cinco notícias reais com data e sem exigir login',async()=>{
 const noticias=Array.from({length:5},(_,i)=>noticiaDoCommit(commit(i+1,0,'feat: atualização '+i)));
 const app=await createGameServer({port:0,dataDir:null,noticiasMain:{obter:()=>noticias}});
 try{const r=await fetch('http://127.0.0.1:'+app.port+'/api/entrada'),d=await r.json();assert.equal(r.status,200);assert.equal(d.noticias.length,5);assert.ok(d.noticias.every(n=>n.categoria==='atualizacao'&&n.descricao&&n.data));}finally{await app.close();}
});

test('cache em disco conserva últimas notícias após reiniciar sem conexão',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');const dir=await mkdtemp(join(tmpdir(),'dbi-news-')),cacheFile=join(dir,'noticias.json');
 try{const news=new NovidadesMain({cacheFile,iniciais:[],buscar:async()=>({ok:true,json:async()=>[commit(1,0,'feat: persistida')]})});await news.atualizar();const volta=new NovidadesMain({cacheFile,iniciais:[],buscar:async()=>{throw Error('offline');}});await volta.atualizar();assert.equal(volta.obter()[0].titulo,'persistida');}finally{await rm(dir,{recursive:true,force:true});}
});
