import {mercadorPerto} from './config.mjs';
import {bagWeight} from './characters.mjs';
import {ITENS_NEGOCIAVEIS,MAX_ZENI_NORMAL,saldoReal,creditarZeni} from './itens-negociaveis.mjs';
import {LIMITE_ESTOQUE_LOJA} from './loja.mjs';
const falha=reason=>({ok:false,reason});
const inteiro=(n,max)=>Number.isSafeInteger(n)&&n>=1&&n<=max;
export function limiteOferta(estado,oferta){
 if(!estado||!oferta||!Object.hasOwn(ITENS_NEGOCIAVEIS,oferta.item))return 0;
 const peso=Number.isFinite(estado.weight)?estado.weight:bagWeight(estado.inventory||{});
 return Math.max(0,Math.min(oferta.quantidade,Math.floor((estado.mercado?.carteiraReal??saldoReal(estado))/oferta.preco),Math.floor((estado.stats.capacity-peso+.0001)/ITENS_NEGOCIAVEIS[oferta.item].peso),LIMITE_ESTOQUE_LOJA-(estado.inventory[oferta.item]||0)));
}
const conta=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
const perto=p=>p?.connected&&p.hp>0&&mercadorPerto(p);
export class Mercado {
 constructor(){this.ofertas=new Map();this.creditos=new Map();this.revisao=0;this.serial=0;}
 resumo(p){return{revisao:this.revisao,conta:p.mercadoId,saldo:this.creditos.get(p.mercadoId)||0,carteiraReal:saldoReal(p),limiteCarteira:MAX_ZENI_NORMAL};}
 publico(){return{revisao:this.revisao,ofertas:[...this.ofertas.values()].map(o=>({...o})).sort((a,b)=>b.criadoEm-a.criadoEm)};}
 anunciar(p,{item,quantidade,preco},tempo){
  if(!perto(p))return falha('Aproxime-se do mercador para anunciar.');
  if(!Object.hasOwn(ITENS_NEGOCIAVEIS,item)||!inteiro(quantidade,LIMITE_ESTOQUE_LOJA)||!inteiro(preco,MAX_ZENI_NORMAL))return falha('Item, quantidade ou preço inválidos.');
  if((p.inventory[item]||0)<quantidade)return falha('Você não possui essa quantidade.');
  if(this.ofertas.size>=1000||[...this.ofertas.values()].filter(o=>o.vendedorId===p.mercadoId).length>=20)return falha('Limite de anúncios ativos atingido.');
  const id='oferta-'+(++this.serial);
  const oferta={id,vendedorId:p.mercadoId,vendedor:p.name,item,quantidade,preco,criadoEm:tempo};
  p.inventory[item]-=quantidade;this.ofertas.set(id,oferta);this.revisao++;
  return{ok:true,id};
 }
 comprar(p,{id,quantidade}){
  if(!perto(p))return falha('Aproxime-se do mercador para comprar no mercado.');
  const o=this.ofertas.get(id);if(!o)return falha('Esse anúncio não está mais disponível.');
  if(o.vendedorId===p.mercadoId)return falha('Você não pode comprar seu próprio anúncio.');
  if(!inteiro(quantidade,LIMITE_ESTOQUE_LOJA)||quantidade>o.quantidade)return falha('A quantidade disponível mudou.');
  const total=o.preco*quantidade,credito=this.creditos.get(o.vendedorId)||0;
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(credito+total))return falha('Valor da negociação inválido.');
  if(saldoReal(p)<total)return falha('Zeni insuficiente.');
  if((p.inventory[o.item]||0)+quantidade>LIMITE_ESTOQUE_LOJA||bagWeight(p.inventory)+ITENS_NEGOCIAVEIS[o.item].peso*quantidade>p.stats.capacity+.0001)return falha('A mochila não comporta essa quantidade.');
  // Todas as verificações precedem as mudanças. O loop do servidor serializa as operações.
  if(p.godmode&&p.zeniReal!=null)p.zeniReal-=total;else p.zeni-=total;p.inventory[o.item]=(p.inventory[o.item]||0)+quantidade;
  o.quantidade-=quantidade;if(!o.quantidade)this.ofertas.delete(id);
  this.creditos.set(o.vendedorId,credito+total);this.revisao++;
  return{ok:true,item:o.item,quantidade,total};
 }
 cancelar(p,{id}){
  if(!perto(p))return falha('Aproxime-se do mercador para cancelar.');
  const o=this.ofertas.get(id);if(!o||o.vendedorId!==p.mercadoId)return falha('Anúncio não encontrado ou pertence a outro jogador.');
  if((p.inventory[o.item]||0)+o.quantidade>LIMITE_ESTOQUE_LOJA||bagWeight(p.inventory)+ITENS_NEGOCIAVEIS[o.item].peso*o.quantidade>p.stats.capacity+.0001)return falha('Libere espaço na mochila para recuperar os itens do anúncio.');
  p.inventory[o.item]=(p.inventory[o.item]||0)+o.quantidade;this.ofertas.delete(id);this.revisao++;
  return{ok:true,quantidade:o.quantidade};
 }
 receber(p){
  if(!perto(p))return falha('Aproxime-se do mercador para receber suas vendas.');
  const saldo=this.creditos.get(p.mercadoId)||0,valor=Math.min(saldo,MAX_ZENI_NORMAL-saldoReal(p));
  if(valor<=0)return falha(saldo?'Seu saldo de Zeni está no limite.':'Não há saldo de vendas a receber.');
  if(!creditarZeni(p,valor))return falha('Não foi possível receber o saldo.');
  this.creditos.set(p.mercadoId,saldo-valor);this.revisao++;return{ok:true,total:valor};
 }
 exportar(){return{revisao:this.revisao,serial:this.serial,ofertas:[...this.ofertas.values()].map(o=>({...o})),creditos:[...this.creditos]};}
 restaurar(estado){
  this.ofertas.clear();this.creditos.clear();this.revisao=Number.isSafeInteger(estado?.revisao)?Math.max(0,estado.revisao):0;this.serial=0;
  for(const o of (Array.isArray(estado?.ofertas)?estado.ofertas:[]).slice(0,1000)){
   if(!o||typeof o.id!=='string'||!/^oferta-\d+$/.test(o.id)||!Number.isSafeInteger(Number(o.id.slice(7)))||!conta(o.vendedorId)||!Object.hasOwn(ITENS_NEGOCIAVEIS,o.item)||!inteiro(o.quantidade,LIMITE_ESTOQUE_LOJA)||!inteiro(o.preco,MAX_ZENI_NORMAL)||!Number.isFinite(o.criadoEm)||this.ofertas.has(o.id))continue;
   this.ofertas.set(o.id,{id:o.id,vendedorId:o.vendedorId,vendedor:String(o.vendedor||'Guerreiro').slice(0,18),item:o.item,quantidade:o.quantidade,preco:o.preco,criadoEm:o.criadoEm});
   this.serial=Math.max(this.serial,Number(o.id.slice(7))||0);
  }
  if(Number.isSafeInteger(estado?.serial))this.serial=Math.max(this.serial,estado.serial);
  for(const par of Array.isArray(estado?.creditos)?estado.creditos:[])if(Array.isArray(par)&&conta(par[0])&&Number.isSafeInteger(par[1])&&par[1]>=0)this.creditos.set(par[0],par[1]);
 }
}
