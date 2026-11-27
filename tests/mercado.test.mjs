import {criarSessaoTeste,reentrarSessaoTeste,postTeste} from './auth-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Armazenamento} from '../server/armazenamento.mjs';
// Persistência agora é SQLite (jogo.db), não mais save.json. Lê o estado salvo direto do banco.
const estadoSalvo=dir=>{const a=new Armazenamento(dir);const s=a.carregar();a.fechar();return s;};
import {Game} from '../public/shared/nucleo/game.mjs';
import {MERCHANT,CONFIG} from '../public/shared/nucleo/config.mjs';
import {Mercado,ZENI_DOURADO_MARKET} from '../public/shared/sistemas/mercado.mjs';
import {MAX_ZENI_NORMAL} from '../public/shared/sistemas/itens-negociaveis.mjs';
import {createGameServer} from '../server.mjs';
function cena(){const g=new Game({populate:false});const a=g.addPlayer('a','Vendedor'),b=g.addPlayer('b','Comprador');for(const p of[a,b]){Object.assign(p,MERCHANT);p.stats.capacity=10000;p.zeni=1000;p.inventory.food=10;}return{g,a,b,m:g.mercado};}
test('NPC paga metade dos consumíveis e mantém preços dos materiais',()=>{const{g,a}=cena();for(const item of Object.keys(CONFIG.prices)){a.inventory[item]=3;const saldo=a.zeni;assert.ok(g.action(a.id,{type:'venderItem',item,quantidade:2}).ok);assert.equal(a.zeni-saldo,CONFIG.prices[item]);assert.equal(a.inventory[item],1);}a.inventory.scrap=2;const saldo=a.zeni;assert.ok(g.venderItem(a,'scrap',2).ok);assert.equal(a.zeni-saldo,16);});
test('anúncio reserva itens; compra parcial transfere sem taxa e recebe saldo uma vez',()=>{const{a,b,m}=cena();const{id}=m.anunciar(a,{item:'food',quantidade:5,preco:30},1);assert.equal(a.inventory.food,5);assert.ok(m.comprar(b,{id,quantidade:2}).ok);assert.equal(b.inventory.food,12);assert.equal(b.zeni,940);assert.equal(m.ofertas.get(id).quantidade,3);assert.equal(m.resumo(a).saldo,60);assert.ok(m.receber(a).ok);assert.equal(a.zeni,1060);assert.equal(m.receber(a).ok,false);assert.ok(m.cancelar(a,{id}).ok);assert.equal(a.inventory.food,8);});
test('validação rejeita dados inválidos, compras próprias e cancelamento de terceiro',()=>{const{a,b,m}=cena();for(const dados of[{item:'constructor',quantidade:1,preco:1},{item:'food',quantidade:11,preco:1},{item:'food',quantidade:1,preco:0},{item:'food',quantidade:1.5,preco:1}])assert.equal(m.anunciar(a,dados,0).ok,false);const{id}=m.anunciar(a,{item:'food',quantidade:2,preco:10},0);assert.equal(m.comprar(a,{id,quantidade:1}).ok,false);assert.equal(m.cancelar(b,{id}).ok,false);for(const q of[0,-1,'1',3])assert.equal(m.comprar(b,{id,quantidade:q}).ok,false);assert.equal(a.inventory.food,8);assert.equal(b.zeni,1000);});
test('saldo, mochila e distância não causam perdas parciais',()=>{const{a,b,m}=cena();const{id}=m.anunciar(a,{item:'food',quantidade:2,preco:1000},0);assert.equal(m.comprar(b,{id,quantidade:2}).ok,false);b.stats.capacity=0;assert.equal(m.comprar(b,{id,quantidade:1}).ok,false);a.stats.capacity=0;assert.equal(m.cancelar(a,{id}).ok,false);assert.equal(m.ofertas.get(id).quantidade,2);assert.equal(a.inventory.food,8);a.stats.capacity=10000;a.x+=1000;assert.equal(m.cancelar(a,{id}).ok,false);Object.assign(a,MERCHANT);assert.ok(m.cancelar(a,{id}).ok);assert.equal(a.inventory.food,10);});
test('vendedor offline recebe depois, saldo excedente permanece reservado e god mode usa carteira real',()=>{const{a,b,m}=cena();const{id}=m.anunciar(a,{item:'food',quantidade:2,preco:50},0);a.connected=false;assert.ok(m.comprar(b,{id,quantidade:2}).ok);a.connected=true;a.zeni=MAX_ZENI_NORMAL-20;assert.equal(m.receber(a).total,20);assert.equal(m.resumo(a).saldo,80);a.zeni-=80;assert.equal(m.receber(a).total,80);b.godmode=true;b.zeni=999999999;b.zeniReal=0;const oferta=m.anunciar(a,{item:'food',quantidade:1,preco:10},0);assert.equal(m.comprar(b,{id:oferta.id,quantidade:1}).ok,false);});
test('restauração preserva ofertas e saldo e ignora registros inválidos',()=>{const{a,b,m}=cena();const{id}=m.anunciar(a,{item:'ki',quantidade:1,preco:5},0);assert.ok(id);assert.ok(m.comprar(b,{id,quantidade:1}).ok);m.anunciar(a,{item:'food',quantidade:1,preco:5},1);const novo=new Mercado();novo.restaurar(m.exportar());assert.deepEqual(novo.exportar(),m.exportar());novo.restaurar({ofertas:[{id:'oferta-'+ '9'.repeat(400)}]});assert.equal(novo.ofertas.size,0);});
test('HTTP concorrente vende última unidade uma vez e persiste ofertas, contas e créditos no mesmo arquivo',async()=>{const dir=await mkdtemp(join(tmpdir(),'dbi-mercado-'));let app=await createGameServer({port:0,dataDir:dir});let vendedor,comprador;try{const base='http://127.0.0.1:'+app.port;const post=(path,data,token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)}).then(r=>r.json());vendedor=await criarSessaoTeste(base,'Venda');comprador=await criarSessaoTeste(base,'Compra');for(const s of[vendedor,comprador]){const p=app.game.players.get(s.playerId);Object.assign(p,MERCHANT);p.stats.capacity=1000;p.zeni=1000;p.inventory.food=5;}const oferta=await post('/api/action',{type:'mercadoAnunciar',item:'food',quantidade:1,preco:50},vendedor.token);const resultados=await Promise.all([1,2].map(()=>post('/api/action',{type:'mercadoComprar',id:oferta.id,quantidade:1},comprador.token)));assert.equal(resultados.filter(r=>r.ok).length,1);await post('/api/action',{type:'mercadoAnunciar',item:'food',quantidade:2,preco:20},vendedor.token);const salvo=estadoSalvo(dir);assert.equal(salvo.__mercado.ofertas.length,1);assert.equal(salvo.__mercado.creditos[0][1],50);const conta=app.game.players.get(vendedor.playerId).mercadoId;await app.close();app=await createGameServer({port:0,dataDir:dir});const r=await reentrarSessaoTeste('http://127.0.0.1:'+app.port,vendedor.token);const p=app.game.players.get(r.playerId);assert.equal(p.mercadoId,conta);assert.equal(p.inventory.food,2);assert.equal(app.game.mercado.resumo(p).saldo,50);assert.equal(app.game.mercado.publico().ofertas[0].quantidade,2);}finally{await app.close();}});
test('Market reserva Zeni Dourado da conta e entrega compras parciais direto na carteira', () => {
 const {a,b,m}=cena();
 a.contaId='conta-vendedora';
 b.contaId='conta-compradora';
 const vendedor={saldo:100},comprador={saldo:5};
 a.x+=2000;
 const {id}=m.anunciar(a,{item:ZENI_DOURADO_MARKET,quantidade:30,preco:10},0,vendedor);
 assert.ok(id);
 assert.equal(vendedor.saldo,70);
 assert.equal(m.anunciar(a,{item:ZENI_DOURADO_MARKET,quantidade:71,preco:1},0,vendedor).ok,false);
 const restaurado=new Mercado();restaurado.restaurar(m.exportar());
 b.stats.capacity=0;
 b.contaId=a.contaId;
 assert.equal(restaurado.comprar(b,{id,quantidade:10},comprador).ok,false);
 b.contaId='conta-compradora';
 b.godmode=true;b.zeniReal=1000;b.zeni=999999999;b.godmodeOptions.zeniInfinite=true;
 assert.ok(restaurado.comprar(b,{id,quantidade:10},comprador).ok);
 assert.equal(b.zeniReal,900);
 assert.equal(b.zeni,999999999);
 assert.equal(comprador.saldo,15);
 assert.equal(b.inventory[ZENI_DOURADO_MARKET],undefined);
 assert.equal(restaurado.resumo(a).saldo,100);
 Object.assign(a,MERCHANT);
 assert.ok(restaurado.cancelar(a,{id},vendedor).ok);
 assert.equal(vendedor.saldo,90);
 assert.equal(restaurado.cancelar(a,{id},vendedor).ok,false);
});
test('Market anuncia e devolve itens da entrega pendente sem depender da mochila',()=>{
 const {a,m}=cena();
 const item='pocao-xp-15';
 a.x+=2000;a.stats.capacity=0;a.entregasPremium[item]=3;
 const {id}=m.anunciar(a,{item,quantidade:2,preco:100,origem:'entrega'},0);
 assert.ok(id);
 assert.equal(a.entregasPremium[item],1);
 assert.equal(a.inventory[item],undefined);
 Object.assign(a,MERCHANT);
 const restaurado=new Mercado();restaurado.restaurar(m.exportar());
 assert.ok(restaurado.cancelar(a,{id}).ok);
 assert.equal(a.entregasPremium[item],3);
});

test('HTTP reserva e transfere Zeni Dourado entre duas contas autenticadas', async () => {
 const app = await createGameServer({port:0,dataDir:null});
 try {
  const base='http://127.0.0.1:'+app.port;
  const vendedor=await criarSessaoTeste(base,'Venda Dourada');
  const comprador=await criarSessaoTeste(base,'Compra Dourada');
  const jogadores=[vendedor,comprador].map(s=>app.game.players.get(s.playerId));
  const carteiras=jogadores.map(p=>app.economiaPremium.carteira(app.autenticacao.contas.get(p.contaId)));
  carteiras[0].saldo=100;
  Object.assign(jogadores[1],MERCHANT);
  const {dados:anuncio}=await postTeste(base,'action',{
   type:'mercadoAnunciar',item:ZENI_DOURADO_MARKET,quantidade:10,preco:5
  },vendedor.token);
  assert.ok(anuncio.ok,anuncio.reason);
  assert.equal(carteiras[0].saldo,90);
  const {dados:compra}=await postTeste(base,'action',{
   type:'mercadoComprar',id:anuncio.id,quantidade:10,saldoPremium:1000
  },comprador.token);
  assert.ok(compra.ok,compra.reason);
  assert.equal(carteiras[1].saldo,10);
  assert.equal(jogadores[1].zeni,150);
  assert.equal(app.game.mercado.resumo(jogadores[0]).saldo,50);
 } finally {
  await app.close();
 }
});
