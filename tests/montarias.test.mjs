import test from 'node:test';import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';
import {Game} from '../public/shared/game.mjs';import {createPlayer,exportPlayer} from '../public/shared/characters.mjs';
import {DIRECOES_NIMBUS,NIMBUS,APOIOS_NIMBUS,direcaoNimbus,quadroNimbus,geometriaNimbus} from '../public/shared/montarias.mjs';
test('Nimbus usa todas as oito direções específicas e cinco quadros a cada 130 ms',()=>{
 for(let i=0;i<8;i++){const a=(i-2)*Math.PI/4;assert.equal(direcaoNimbus({x:Math.cos(a),y:Math.sin(a)}),DIRECOES_NIMBUS[i]);}
 for(let i=0;i<10;i++)assert.equal(quadroNimbus(i*.13+.001),i%5);assert.equal(quadroNimbus(-1),0);assert.equal(direcaoNimbus({x:0,y:0}),'s');
});
test('flutuação e offsets alteram apenas coordenadas de desenho e preservam apoio da nuvem',()=>{
 const p={vocacao:'goku',facing:{x:0,y:1},moving:true},pos={x:500,y:600,travelled:40},antes=JSON.stringify({p,pos});
 const a=geometriaNimbus(p,pos,0),b=geometriaNimbus(p,pos,1),c=geometriaNimbus(p,pos,1,{x:8,y:-12});
 assert.equal(JSON.stringify({p,pos}),antes);assert.equal(c.apoio.x,b.apoio.x);assert.equal(c.apoio.y,b.apoio.y);assert.equal(c.personagem.x,b.personagem.x+8);assert.equal(c.personagem.y,b.personagem.y-6);assert.ok(Math.abs(b.apoio.y-a.apoio.y)<=NIMBUS.amplitude);
 assert.equal(a.nuvem.y+a.ancora[1]*a.escala,a.apoio.y);assert.equal(geometriaNimbus(p,pos,100,{flutuar:false}).apoio.y,pos.y-NIMBUS.altura);
});
test('montaria gratuita persiste, propaga aos jogadores e rejeita montaria inválida ou personagem morto',()=>{
 const g=new Game({populate:false}),p=g.addPlayer('p','QA'),q=g.addPlayer('q','Outro');const stats=structuredClone(p.stats),itens=structuredClone(p.inventory),saldo=p.zeni;
 assert.equal(g.action(p.id,{type:'montaria',valor:'nimbus'}).ok,true);assert.equal(g.snapshot(q.id).players.find(v=>v.id===p.id).montaria,'nimbus');assert.equal(g.snapshot(p.id).self.montaria,'nimbus');
 assert.deepEqual(p.stats,stats);assert.deepEqual(p.inventory,itens);assert.equal(p.zeni,saldo);assert.equal(createPlayer('novo','QA',exportPlayer(p)).montaria,'nimbus');assert.equal(createPlayer('novo','QA',{montaria:'invalida'}).montaria,null);
 assert.equal(g.action(p.id,{type:'montaria',valor:'voo-ilegal',velocidade:9999}).ok,false);assert.equal(g.action(p.id,{type:'montaria',valor:null}).ok,true);p.hp=0;assert.equal(g.action(p.id,{type:'montaria',valor:'nimbus'}).ok,false);
});
test('montar não altera deslocamento, navegação nem dados de colisão',()=>{
 const a=new Game({populate:false,now:1000}),b=new Game({populate:false,now:1000}),p=a.addPlayer('p','A'),q=b.addPlayer('q','B');b.action(q.id,{type:'montaria',valor:'nimbus'});
 for(const dir of [{x:1,y:0},{x:1,y:1},{x:0,y:-1},{x:-1,y:0}])for(let i=0;i<10;i++){a.setInput(p.id,dir);b.setInput(q.id,dir);a.tick(.05);b.tick(.05);assert.equal(p.x,q.x);assert.equal(p.y,q.y);}assert.deepEqual(p.facing,q.facing);assert.equal(p.stats.mobility,q.stats.mobility);
});
test('pacote contém exatamente 40 PNGs de 256×256, sem espelhamento ou sprites faltantes',async()=>{
 const base=new URL('../public/assets/montarias/nimbus/sprites/',import.meta.url),lista=await readdir(base);assert.equal(lista.length,40);
 for(const d of DIRECOES_NIMBUS)for(let i=1;i<=5;i++){const png=await readFile(new URL('nimbus_'+d+'_0'+i+'.png',base));assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);}
});

test('API persiste montar/desmontar após reiniciar e mantém isolamento de contas',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{createGameServer}=await import('../server.mjs'),{criarSessaoTeste,reentrarSessaoTeste,postTeste}=await import('./auth-helper.mjs');const dir=await mkdtemp(join(tmpdir(),'dbi-montaria-'));let app;
 try{app=await createGameServer({port:0,dataDir:dir});let base='http://127.0.0.1:'+app.port;const a=await criarSessaoTeste(base,'Nimbus QA'),b=await criarSessaoTeste(base,'Nimbus Outra');assert.equal((await postTeste(base,'action',{type:'montaria',valor:'nimbus'},a.token)).dados.ok,true);assert.equal(app.game.players.get(a.playerId).montaria,'nimbus');assert.equal(app.game.players.get(b.playerId).montaria,null);
 await app.close();app=await createGameServer({port:0,dataDir:dir});base='http://127.0.0.1:'+app.port;const volta=await reentrarSessaoTeste(base,a.token);assert.equal(app.game.players.get(volta.playerId).montaria,'nimbus');assert.equal((await postTeste(base,'action',{type:'montaria',valor:null},a.token)).dados.ok,true);
 await app.close();app=await createGameServer({port:0,dataDir:dir});base='http://127.0.0.1:'+app.port;const sem=await reentrarSessaoTeste(base,a.token);assert.equal(app.game.players.get(sem.playerId).montaria,null);
 }finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
});

test('todos os frames apoiam a massa da nuvem no mesmo ponto sem deslocar o personagem',()=>{
 const pos={x:400,y:500};let anterior=null;
 for(let i=0;i<8;i++)for(let f=0;f<5;f++){
  const a=(i-2)*Math.PI/4,p={vocacao:'goku',facing:{x:Math.cos(a),y:Math.sin(a)}};
  const g=geometriaNimbus(p,pos,f*.13+.001,{flutuar:false});
  assert.deepEqual(g.ancora,APOIOS_NIMBUS[DIRECOES_NIMBUS[i]][f]);
  assert.ok(Math.abs(g.nuvem.x+g.ancora[0]*g.escala-g.apoio.x)<1e-8);
  assert.ok(Math.abs(g.nuvem.y+g.ancora[1]*g.escala-g.apoio.y)<1e-8);
  if(anterior)assert.deepEqual(g.personagem,anterior);anterior=g.personagem;
 }
});
