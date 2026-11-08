import {randomBytes} from 'node:crypto';
import {PRODUTOS_STORE,TEMPORADA,COLECIONAVEIS,MAX_PREMIUM,recompensaPasse} from '../public/shared/premium-config.mjs';
import {passeDoPersonagem,resumoBattlePass,temporadaAtiva,resgatarMissaoPasse} from '../public/shared/battle-pass.mjs';
import {CONFIG} from '../public/shared/config.mjs';
import {bagWeight} from '../public/shared/characters.mjs';
import {creditarZeni,saldoReal,MAX_ZENI_NORMAL} from '../public/shared/itens-negociaveis.mjs';
import {PagamentoSimulado} from './pagamentos.mjs';
const falha=reason=>({ok:false,reason});
export class EconomiaPremium{
 constructor({ambiente='production',agora=()=>Date.now()}={}){this.agora=agora;this.pagamentos=new PagamentoSimulado(ambiente);this.cotacoes=new Map();this.inicializadas=new WeakSet();}
 carteira(a){
  if(!this.inicializadas.has(a)){
   const v=a.premium;a.premium={saldo:Number.isSafeInteger(v?.saldo)&&v.saldo>=0?Math.min(MAX_PREMIUM,v.saldo):0,vipAte:Number.isSafeInteger(v?.vipAte)&&v.vipAte>0?v.vipAte:0,
    colecao:[...new Set((Array.isArray(v?.colecao)?v.colecao:[]).filter(id=>Object.hasOwn(COLECIONAVEIS,id)))],transacoes:(Array.isArray(v?.transacoes)?v.transacoes:[]).filter(t=>t&&typeof t.id==='string'&&Number.isSafeInteger(t.quando))};this.inicializadas.add(a);
  }return a.premium;
 }
 impedimento(a,p,produto){
  const w=this.carteira(a);if(!p.connected||p.hp<=0)return 'Personagem indisponível.';
  if(produto.moedas&&!this.pagamentos.habilitado)return 'Recargas simuladas disponíveis somente em desenvolvimento.';
  if(produto.requerVip&&w.vipAte<=this.agora())return 'Este item é exclusivo para contas com VIP ativo.';
  if(produto.colecao&&w.colecao.includes(produto.colecao))return 'A conta já possui este colecionável.';
  if(produto.temporada&&(!temporadaAtiva(this.agora())||produto.temporada!==TEMPORADA.id))return 'O passe não está disponível nesta temporada.';
  if(produto.temporada&&passeDoPersonagem(p,this.agora()).premium)return 'Este personagem já possui o passe premium.';
  if(produto.preco>w.saldo)return 'Saldo premium insuficiente.';
  if(produto.moedas&&w.saldo+produto.moedas>MAX_PREMIUM)return 'Limite do saldo premium atingido.';
  return null;
 }
 estado(a,p){
  const w=this.carteira(a);return {ok:true,simulacao:this.pagamentos.habilitado,saldo:w.saldo,vipAte:w.vipAte,vipAtivo:w.vipAte>this.agora(),
   colecao:w.colecao.map(id=>({id,...COLECIONAVEIS[id]})),historico:w.transacoes.slice(-100).reverse(),totalTransacoes:w.transacoes.length,
   produtos:PRODUTOS_STORE.map(produto=>({...produto,impedimento:this.impedimento(a,p,produto)})),battlePass:resumoBattlePass(p,this.agora())};
 }
 preparar(a,p,id){
  const produto=PRODUTOS_STORE.find(x=>x.id===id);if(!produto)return falha('Produto inválido.');const motivo=this.impedimento(a,p,produto);if(motivo)return falha(motivo);
  const agora=this.agora();for(const [id,c]of this.cotacoes)if(c.expira<=agora)this.cotacoes.delete(id);
  if([...this.cotacoes.values()].filter(c=>c.conta===a.id).length>=8)return falha('Confirme ou aguarde expirar as compras pendentes.');
  const c={id:randomBytes(18).toString('hex'),produto:produto.id,conta:a.id,personagem:p.personagemId||p.id,expira:agora+120000};this.cotacoes.set(c.id,c);
  return {ok:true,cotacao:{id:c.id,nome:produto.nome,expira:c.expira,preco:produto.preco||0,precoCentavos:produto.precoCentavos||0,simulada:Boolean(produto.moedas)}};
 }
 confirmar(a,p,id){
  const w=this.carteira(a),anterior=w.transacoes.find(t=>t.id===id);if(anterior)return {ok:true,transacao:anterior,repetida:true};
  const c=this.cotacoes.get(id);if(!c||c.conta!==a.id||c.personagem!==(p.personagemId||p.id)||c.expira<=this.agora())return falha('Confirmação inválida ou expirada.');
  const produto=PRODUTOS_STORE.find(x=>x.id===c.produto),motivo=this.impedimento(a,p,produto);if(motivo)return falha(motivo);
  let referencia=null;if(produto.moedas){const r=this.pagamentos.confirmar(c);if(!r.ok)return r;referencia=r.referencia;}
  // Valida tudo antes de mutar. Não há await entre débito e entrega.
  w.saldo-=produto.preco||0;if(produto.moedas)w.saldo+=produto.moedas;
  if(produto.dias)w.vipAte=Math.max(this.agora(),w.vipAte)+produto.dias*86400000;
  if(produto.colecao)w.colecao.push(produto.colecao);
  if(produto.temporada)passeDoPersonagem(p,this.agora()).premium=true;
  const t={id:c.id,produto:produto.id,nome:produto.nome,quando:this.agora(),personagem:p.name,personagemId:p.personagemId||p.id,moedasDelta:(produto.moedas||0)-(produto.preco||0),simulada:Boolean(produto.moedas),precoCentavos:produto.precoCentavos||0,referencia};
  w.transacoes.push(t);this.cotacoes.delete(id);return {ok:true,transacao:t};
 }
 resgatar(a,p,nivel,trilha){
  if(!p.connected||p.hp<=0||p.godmode||!temporadaAtiva(this.agora()))return falha('Resgate indisponível fora da temporada, desconectado ou em God Mode.');
  if(!Number.isInteger(nivel)||nivel<1||nivel>TEMPORADA.niveis||!['gratis','premium'].includes(trilha))return falha('Recompensa inválida.');
  const s=passeDoPersonagem(p,this.agora()),chave=trilha+':'+nivel;
  if(s.resgatadas.includes(chave))return falha('Recompensa já recebida.');
  if(s.xp<nivel*TEMPORADA.xpPorNivel||trilha==='premium'&&!s.premium)return falha('Nível ou trilha ainda bloqueado.');
  const r=recompensaPasse(nivel,trilha),w=this.carteira(a),itens=r.itens||{},peso=Object.entries(itens).reduce((n,[id,q])=>n+CONFIG.itemWeights[id]*q,0);
  if(w.saldo+(r.moedas||0)>MAX_PREMIUM||saldoReal(p)+(r.zeni||0)>MAX_ZENI_NORMAL||bagWeight(p.inventory)+peso>p.stats.capacity+.0001||Object.entries(itens).some(([id,q])=>(p.inventory[id]||0)+q>99999))return falha('Libere espaço na mochila ou na carteira antes do resgate.');
  s.resgatadas.push(chave);if(r.zeni)creditarZeni(p,r.zeni);for(const [id,q]of Object.entries(itens))p.inventory[id]=(p.inventory[id]||0)+q;
  w.saldo+=r.moedas||0;for(const id of r.colecao||[])if(!w.colecao.includes(id))w.colecao.push(id);
  w.transacoes.push({id:'bp-'+(p.personagemId||p.id)+'-'+TEMPORADA.id+'-'+chave,produto:'recompensa-bp',nome:'Battle Pass · '+trilha+' · nível '+nivel,quando:this.agora(),personagem:p.name,personagemId:p.personagemId||p.id,moedasDelta:r.moedas||0,simulada:false});
  return {ok:true,recompensa:r};
 }
 processar(a,p,d){
  if(d.operacao==='cancelarCompra'){const c=this.cotacoes.get(d.cotacao);if(c?.conta===a.id)this.cotacoes.delete(d.cotacao);return {ok:true};}
  if(d.operacao==='prepararCompra')return this.preparar(a,p,d.produto);
  if(d.operacao==='confirmarCompra')return this.confirmar(a,p,d.cotacao);
  if(d.operacao==='resgatarRecompensa')return this.resgatar(a,p,d.nivel,d.trilha);
  if(d.operacao==='resgatarMissao')return resgatarMissaoPasse(p,d.id,this.agora());
  return falha('Operação inválida.');
 }
}
