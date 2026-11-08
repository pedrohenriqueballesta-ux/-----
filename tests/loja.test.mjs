import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {MERCHANT,CONFIG} from '../public/shared/config.mjs';
import {bagWeight} from '../public/shared/characters.mjs';
import {limiteCompra,LIMITE_ESTOQUE_LOJA} from '../public/shared/loja.mjs';
import {createGameServer} from '../server.mjs';
function cena(){const g=new Game({populate:false}),p=g.addPlayer('p');Object.assign(p,MERCHANT);return{g,p};}

test('compra quantidade inteira em lote com custo/peso corretos e mantém compra antiga de uma unidade',()=>{
 const {g,p}=cena(),antes={zeni:p.zeni,food:p.inventory.food,peso:bagWeight(p.inventory)};
 assert.deepEqual(g.action(p.id,{type:'buy',item:'food',quantidade:5}),{ok:true,item:'food',quantidade:5,total:60});
 assert.equal(p.inventory.food,antes.food+5);assert.equal(p.zeni,antes.zeni-60);assert.ok(Math.abs(bagWeight(p.inventory)-antes.peso-1.75)<1e-9);
 assert.ok(g.action(p.id,{type:'buy',item:'ki'}).ok);assert.equal(p.zeni,antes.zeni-60-18);
});

test('quantidades inválidas e itens desconhecidos não alteram dinheiro nem estoque',()=>{
 for(const qtd of [0,-1,1.5,'2',null,NaN,Infinity,LIMITE_ESTOQUE_LOJA+1]){
  const {g,p}=cena(),antes=structuredClone([p.zeni,p.inventory]);
  assert.equal(g.action(p.id,{type:'buy',item:'food',quantidade:qtd}).ok,false,String(qtd));assert.deepEqual([p.zeni,p.inventory],antes);
 }
 for(const item of ['desconhecido','__proto__','constructor',null]){const {g,p}=cena(),antes=structuredClone([p.zeni,p.inventory]);assert.equal(g.buy(p,item,2).ok,false);assert.deepEqual([p.zeni,p.inventory],antes);}
});

test('saldo e peso são validados para o lote inteiro, inclusive limite exato sem arredondamento indevido',()=>{
 const {g,p}=cena();p.zeni=23;const n=p.inventory.food;
 assert.equal(g.buy(p,'food',2).ok,false);assert.equal(p.inventory.food,n);assert.equal(p.zeni,23);
 p.zeni=24;p.stats.capacity=bagWeight(p.inventory)+.6;
 assert.equal(g.buy(p,'food',2).ok,false);assert.equal(p.inventory.food,n);assert.equal(p.zeni,24);
 p.stats.capacity=bagWeight(p.inventory)+.7;
 assert.equal(g.buy(p,'food',2).ok,true);assert.equal(p.inventory.food,n+2);assert.equal(p.zeni,0);
});

test('respeita proximidade do mercador e limite de estoque que pode ser salvo',()=>{
 const {g,p}=cena();p.x+=1000;const saldo=p.zeni;assert.equal(g.buy(p,'food',2).ok,false);assert.equal(p.zeni,saldo);
 Object.assign(p,MERCHANT);p.zeni=1000000;p.stats.capacity=1000000;p.inventory.food=99998;
 assert.equal(g.buy(p,'food',2).ok,false);assert.equal(p.inventory.food,99998);
 assert.ok(g.buy(p,'food',1).ok);assert.equal(p.inventory.food,99999);
 const q=g.addPlayer('q','Teste',g.exportPlayer(p));assert.equal(q.inventory.food,99999);
});

test('máximo de seleção acompanha saldo, peso e estoque, sem confiar em preço enviado pelo cliente',()=>{
 const {g,p}=cena();assert.equal(limiteCompra(p,'food'),16);assert.equal(limiteCompra(p,'ki'),11);
 p.zeni=1000000;p.stats.capacity=bagWeight(p.inventory)+.7;assert.equal(limiteCompra(p,'food'),2);
 p.stats.capacity=1000000;p.inventory.food=99998;assert.equal(limiteCompra(p,'food'),1);
 assert.equal(limiteCompra(p,'constructor'),0);assert.equal(limiteCompra(null,'food'),0);
 const saldo=p.zeni;assert.ok(g.action(p.id,{type:'buy',item:'ki',quantidade:3,price:0,total:0}).ok);assert.equal(saldo-p.zeni,3*CONFIG.prices.ki);
});

test('pedidos concorrentes não gastam saldo inexistente nem entregam lote parcial',async()=>{
 const app=await createGameServer({port:0,dataDir:null});
 try{
  const url='http://127.0.0.1:'+app.port;
  const sessao=await(await fetch(url+'/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Compra concorrente'})})).json();
  const p=app.game.players.get(sessao.playerId);Object.assign(p,MERCHANT);p.zeni=24;const n=p.inventory.food;
  const comprar=()=>fetch(url+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessao.token},body:JSON.stringify({type:'buy',item:'food',quantidade:2})}).then(r=>r.json());
  const resultados=await Promise.all([comprar(),comprar()]);assert.equal(resultados.filter(r=>r.ok).length,1);assert.equal(p.zeni,0);assert.equal(p.inventory.food,n+2);
 }finally{await app.close();}
});
