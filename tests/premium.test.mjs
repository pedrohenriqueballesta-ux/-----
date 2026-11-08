import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {createPlayer,exportPlayer} from '../public/shared/characters.mjs';
import {EconomiaPremium} from '../server/premium.mjs';
import {registrarMissao} from '../public/shared/missoes.mjs';
import {registrarAtividadePasse,passeDoPersonagem,resumoBattlePass,resgatarMissaoPasse,vincularPasseConta} from '../public/shared/battle-pass.mjs';
import {TEMPORADA,MAX_PREMIUM} from '../public/shared/premium-config.mjs';
const inicio=Date.parse('2026-11-08T12:00:00Z');
function cena(ambiente='development'){
 let agora=inicio;const economia=new EconomiaPremium({ambiente,agora:()=>agora}),g=new Game({populate:false,now:inicio/1000}),p=g.addPlayer('p','Teste');p.personagemId='c1';g.agora=()=>agora;
 const a={id:'a1'};vincularPasseConta(a,p,agora);return {economia,g,p,a,avancar:ms=>{agora+=ms;},agora:()=>agora};
}
function comprar(c,id){const q=c.economia.preparar(c.a,c.p,id);assert.equal(q.ok,true,q.reason);const r=c.economia.confirmar(c.a,c.p,q.cotacao.id);assert.equal(r.ok,true,r.reason);return {q:q.cotacao,r};}
test('produção bloqueia recargas simuladas inclusive confirmação de cotação obtida em desenvolvimento',()=>{
 const c=cena('production');assert.equal(c.economia.estado(c.a,c.p).simulacao,false);assert.equal(c.economia.preparar(c.a,c.p,'moedas-500').ok,false);
 assert.equal(new EconomiaPremium().pagamentos.habilitado,false);
 const d=cena();const q=d.economia.preparar(d.a,d.p,'moedas-500');d.economia.pagamentos.habilitado=false;assert.equal(d.economia.confirmar(d.a,d.p,q.cotacao.id).ok,false);assert.equal(d.economia.carteira(d.a).saldo,0);
});
test('compra exige confirmação, usa preços do servidor e não credita duas vezes',()=>{
 const c=cena(),q=c.economia.preparar(c.a,c.p,'moedas-500');assert.equal(c.economia.carteira(c.a).saldo,0);
 const r=c.economia.processar(c.a,c.p,{operacao:'confirmarCompra',cotacao:q.cotacao.id,moedas:999999999,preco:0});assert.equal(r.ok,true);assert.equal(c.economia.carteira(c.a).saldo,500);
 assert.equal(c.economia.confirmar(c.a,c.p,q.cotacao.id).repetida,true);assert.equal(c.economia.carteira(c.a).saldo,500);assert.equal(c.economia.carteira(c.a).transacoes.length,1);
 assert.equal(c.economia.preparar(c.a,c.p,'inventado').ok,false);assert.equal(c.economia.confirmar(c.a,c.p,'inventada').ok,false);
});
test('cotações pertencem à conta e personagem, expiram e podem ser canceladas sem débito',()=>{
 const c=cena(),q=c.economia.preparar(c.a,c.p,'moedas-500').cotacao;
 assert.equal(c.economia.confirmar({id:'outra'},c.p,q.id).ok,false);
 c.p.personagemId='c2';assert.equal(c.economia.confirmar(c.a,c.p,q.id).ok,false);c.p.personagemId='c1';
 c.avancar(120001);assert.equal(c.economia.confirmar(c.a,c.p,q.id).ok,false);
 const nova=c.economia.preparar(c.a,c.p,'moedas-100').cotacao;c.economia.processar(c.a,c.p,{operacao:'cancelarCompra',cotacao:nova.id});assert.equal(c.economia.confirmar(c.a,c.p,nova.id).ok,false);assert.equal(c.economia.carteira(c.a).saldo,0);
});
test('saldo compartilhado, VIP acumulável e coleção são da conta, sem compras duplicadas de itens',()=>{
 const c=cena();comprar(c,'moedas-2500');assert.equal(c.economia.preparar(c.a,c.p,'aura-vip').ok,false);
 comprar(c,'vip-30');const expira=c.economia.carteira(c.a).vipAte;comprar(c,'vip-30');assert.equal(c.economia.carteira(c.a).vipAte,expira+30*86400000);
 comprar(c,'aura-vip');assert.equal(c.economia.preparar(c.a,c.p,'aura-vip').ok,false);
 const outro=createPlayer('p2','Outro',null,inicio/1000);assert.equal(c.economia.estado(c.a,outro).saldo,1880);assert.equal(c.economia.estado(c.a,outro).vipAtivo,true);assert.equal(c.economia.estado(c.a,outro).colecao.length,1);
});
test('dois produtos preparados concorrentemente revalidam saldo ao confirmar',()=>{
 const c=cena();comprar(c,'moedas-100');const q1=c.economia.preparar(c.a,c.p,'aura-azul').cotacao,q2=c.economia.preparar(c.a,c.p,'aura-azul').cotacao;
 assert.equal(c.economia.confirmar(c.a,c.p,q1.id).ok,true);assert.equal(c.economia.confirmar(c.a,c.p,q2.id).ok,false);assert.equal(c.economia.carteira(c.a).saldo,0);
});
test('missões do BP reutilizam eventos de combate, rejeitam God Mode e não ganham progresso no God Mode',()=>{
 const c=cena();registrarMissao(c.p,'kills',100,c.agora());assert.equal(resumoBattlePass(c.p,c.agora()).missoes.find(m=>m.id==='dia-caca').progresso,100);
 assert.equal(resgatarMissaoPasse(c.p,'dia-caca',c.agora()).ok,true);assert.equal(resgatarMissaoPasse(c.p,'dia-caca',c.agora()).ok,false);assert.equal(resumoBattlePass(c.p,c.agora()).nivel,0);assert.equal(c.p.xp,0);
 const outro=createPlayer('p2','Outro');assert.equal(resumoBattlePass(outro,c.agora()).xp,0);c.p.godmode=true;registrarAtividadePasse(c.p,'skills',100,c.agora());assert.equal(resumoBattlePass(c.p,c.agora()).missoes.find(m=>m.id==='dia-treino').progresso,0);
});
test('virada diária e semanal renova missões sem apagar BP XP ou resgates de níveis',()=>{
 const c=cena();registrarAtividadePasse(c.p,'kills',250,c.agora());resgatarMissaoPasse(c.p,'dia-caca',c.agora());resgatarMissaoPasse(c.p,'semana-caca',c.agora());const xp=passeDoPersonagem(c.p,c.agora()).xp;
 c.avancar(86400000);const s=resumoBattlePass(c.p,c.agora());assert.equal(s.xp,xp);assert.equal(s.missoes.find(m=>m.id==='dia-caca').progresso,0);assert.equal(s.missoes.find(m=>m.id==='semana-caca').progresso,0);
});
test('passe premium libera níveis anteriores em toda a conta e não muda XP',()=>{
 const c=cena();passeDoPersonagem(c.p,c.agora()).xp=1000;assert.equal(c.economia.resgatar(c.a,c.p,1,'premium').ok,false);comprar(c,'moedas-500');comprar(c,'passe-s1');assert.equal(passeDoPersonagem(c.p,c.agora()).xp,1000);
 assert.equal(c.economia.resgatar(c.a,c.p,1,'premium').ok,true);assert.equal(c.economia.resgatar(c.a,c.p,1,'premium').ok,false);assert.ok(c.economia.carteira(c.a).colecao.includes('traje-escarlate'));
 const outro=createPlayer('p2','Outro');assert.equal(c.economia.estado(c.a,outro).battlePass.premium,true);assert.equal(resumoBattlePass(outro,c.agora()).xp,1000);assert.equal(c.economia.estado(c.a,outro).saldo,0);
});
test('recompensas gratuitas, premium e limite de mochila são validados atomicamente',()=>{
 const c=cena();passeDoPersonagem(c.p,c.agora()).xp=5000;const z=c.p.zeni;
 assert.equal(c.economia.resgatar(c.a,c.p,1,'gratis').ok,true);assert.equal(c.p.zeni,z+50);assert.equal(c.economia.resgatar(c.a,c.p,1,'gratis').ok,false);assert.equal(c.economia.resgatar(c.a,c.p,6,'gratis').ok,false);
 c.p.stats.capacity=0;const estoque=c.p.inventory.ki;assert.equal(c.economia.resgatar(c.a,c.p,2,'gratis').ok,false);assert.equal(c.p.inventory.ki,estoque);assert.equal(passeDoPersonagem(c.p,c.agora()).resgatadas.includes('gratis:2'),false);
 c.p.stats.capacity=9999;assert.equal(c.economia.resgatar(c.a,c.p,2,'gratis').ok,true);assert.equal(c.p.inventory.ki,estoque+2);assert.equal(c.economia.resgatar(c.a,c.p,5,'gratis').ok,true);assert.equal(c.economia.carteira(c.a).saldo,10);
});
test('datas de temporada, 50 níveis, limites e persistência do passe',()=>{
 const c=cena();const s=passeDoPersonagem(c.p,c.agora());s.xp=50000;s.premium=true;s.resgatadas.push('gratis:1');assert.equal(resumoBattlePass(c.p,c.agora()).niveis.length,50);assert.equal(resumoBattlePass(c.p,c.agora()).nivel,50);
 const volta=createPlayer('p',c.p.name,exportPlayer(c.p));assert.equal(resumoBattlePass(volta,c.agora()).premium,true);assert.equal(passeDoPersonagem(volta,c.agora()).resgatadas.includes('gratis:1'),true);
 c.economia.carteira(c.a).saldo=MAX_PREMIUM;assert.equal(c.economia.resgatar(c.a,c.p,5,'gratis').ok,false);assert.equal(s.resgatadas.includes('gratis:5'),false);
 c.avancar(Date.parse(TEMPORADA.fim)-c.agora());assert.equal(resumoBattlePass(c.p,c.agora()).ativa,false);assert.equal(c.economia.resgatar(c.a,c.p,2,'gratis').ok,false);assert.equal(resgatarMissaoPasse(c.p,'dia-caca',c.agora()).ok,false);
});

test('pacote de 50 moedas e VIP de 15 dias respeitam saldo e vencimento',()=>{
 const c=cena();comprar(c,'moedas-50');assert.equal(c.economia.carteira(c.a).saldo,50);assert.equal(c.economia.preparar(c.a,c.p,'vip-15').ok,false);
 comprar(c,'moedas-250');comprar(c,'vip-15');assert.equal(c.economia.carteira(c.a).saldo,150);assert.equal(c.economia.carteira(c.a).vipAte,inicio+15*86400000);
 assert.equal(c.economia.estado(c.a,c.p).vipAtivo,true);c.avancar(15*86400000);assert.equal(c.economia.estado(c.a,c.p).vipAtivo,false);
});