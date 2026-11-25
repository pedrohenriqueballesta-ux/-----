import {mercadorPerto} from '../nucleo/config.mjs';
import {bagWeight,mochilaComporta} from '../nucleo/characters.mjs';
import {ITENS_NEGOCIAVEIS,MAX_ZENI_NORMAL,saldoReal,creditarZeni} from './itens-negociaveis.mjs';
import {MAX_PREMIUM} from './premium-config.mjs';
import {LIMITE_ESTOQUE_LOJA} from './loja.mjs';
export const ZENI_DOURADO_MARKET = 'zeni-dourado';
export const MOEDA_MARKET = Object.freeze({
 id: ZENI_DOURADO_MARKET, nome: 'Zeni Dourado', icone: '/assets/premium/catalogo/moedas_50_limpo.png'
});
export const produtoMarket = id => id === ZENI_DOURADO_MARKET ? MOEDA_MARKET
 : Object.hasOwn(ITENS_NEGOCIAVEIS, id) ? ITENS_NEGOCIAVEIS[id] : null;
export function quantidadeAnunciavel(p, item, origem) {
 if (origem === 'entrega') return p.entregasPremium?.[item] || 0;
 const parcialmenteUsado = p.bonusPremium?.extensores?.[item] && p.equipamentos?.mochila !== item ? 1 : 0;
 return Math.max(0, (p.inventory[item] || 0) - parcialmenteUsado);
}
const falha=reason=>({ok:false,reason});
const inteiro=(n,max)=>Number.isSafeInteger(n)&&n>=1&&n<=max;
export function limiteOferta(estado,oferta){
 if (!estado || !oferta || !produtoMarket(oferta.item)) return 0;
 const dinheiro = Math.floor((estado.mercado?.carteiraReal ?? saldoReal(estado)) / oferta.preco);
 if (oferta.item === ZENI_DOURADO_MARKET)
  return Math.max(0, Math.min(oferta.quantidade, dinheiro, MAX_PREMIUM - (estado.mercado?.saldoPremium ?? 0)));
 if (!mochilaComporta(estado, { [oferta.item]: 1 })) return 0;
 const peso=Number.isFinite(estado.weight)?estado.weight:bagWeight(estado.inventory||{});
 return Math.max(0,Math.min(oferta.quantidade,dinheiro,Math.floor((estado.stats.capacity-peso+.0001)/ITENS_NEGOCIAVEIS[oferta.item].peso),LIMITE_ESTOQUE_LOJA-(estado.inventory[oferta.item]||0)));
}
const conta=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
const perto=p=>p?.connected&&p.hp>0&&mercadorPerto(p);
export class Mercado {
 constructor(){this.ofertas=new Map();this.creditos=new Map();this.revisao=0;this.serial=0;}
 resumo(p){return{revisao:this.revisao,conta:p.mercadoId,saldo:this.creditos.get(p.mercadoId)||0,carteiraReal:saldoReal(p),limiteCarteira:MAX_ZENI_NORMAL};}
 publico(){return{revisao:this.revisao,ofertas:[...this.ofertas.values()].map(({contaVendedora, ...o})=>o).sort((a,b)=>b.criadoEm-a.criadoEm)};}
 anunciar(p, {item, quantidade, preco, origem = 'mochila'}, tempo, carteira) {
  if (!p?.connected || p.hp <= 0) return falha('Personagem indisponível.');
  const moeda = item === ZENI_DOURADO_MARKET;
  if (!produtoMarket(item) || !inteiro(quantidade, moeda ? MAX_PREMIUM : LIMITE_ESTOQUE_LOJA) ||
      !inteiro(preco, MAX_ZENI_NORMAL) || (!moeda && !['mochila', 'entrega'].includes(origem)))
   return falha('Item, quantidade ou preço inválidos.');
  if (moeda ? !carteira || carteira.saldo < quantidade : quantidadeAnunciavel(p, item, origem) < quantidade)
   return falha('Quantidade indisponível para anunciar.');
  if (this.ofertas.size >= 1000 || [...this.ofertas.values()].filter(o => o.vendedorId === p.mercadoId).length >= 20)
   return falha('Limite de anúncios ativos atingido.');
  const id = 'oferta-' + (++this.serial);
  const oferta = {id, vendedorId: p.mercadoId, vendedor: p.name, item, quantidade, preco, criadoEm: tempo};
  if (moeda) {
   oferta.contaVendedora = p.contaId ?? p.mercadoId;
   carteira.saldo -= quantidade;
  } else if (origem === 'entrega') {
   oferta.origem = origem;
   p.entregasPremium[item] -= quantidade;
   if (!p.entregasPremium[item]) delete p.entregasPremium[item];
  } else p.inventory[item] -= quantidade;
  this.ofertas.set(id, oferta);
  this.revisao++;
  return {ok:true, id};
 }
 comprar(p,{id,quantidade},carteira){
  if(!perto(p))return falha('Aproxime-se do mercador para comprar no mercado.');
  const o=this.ofertas.get(id);if(!o)return falha('Esse anúncio não está mais disponível.');
  const moeda = o.item === ZENI_DOURADO_MARKET;
  if(o.vendedorId===p.mercadoId || (moeda && o.contaVendedora === (p.contaId ?? p.mercadoId)))return falha('Você não pode comprar seu próprio anúncio.');
  if(!inteiro(quantidade,moeda ? MAX_PREMIUM : LIMITE_ESTOQUE_LOJA)||quantidade>o.quantidade)return falha('A quantidade disponível mudou.');
  const total=o.preco*quantidade,credito=this.creditos.get(o.vendedorId)||0;
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(credito+total))return falha('Valor da negociação inválido.');
  if(saldoReal(p)<total)return falha('Zeni insuficiente.');
  if (moeda) {
   if (!carteira || carteira.saldo + quantidade > MAX_PREMIUM) return falha('Sua carteira de Zeni Dourado não comporta essa quantidade.');
  } else if ((p.inventory[o.item] || 0) + quantidade > LIMITE_ESTOQUE_LOJA || !mochilaComporta(p, {[o.item]:quantidade}))
   return falha('A mochila não comporta essa quantidade.');
  // Todas as verificações precedem as mudanças. O loop do servidor serializa as operações.
  if (p.godmode && p.zeniReal != null) {
   p.zeniReal -= total;
   if (!p.godmodeOptions?.zeniInfinite) p.zeni = p.zeniReal;
  } else p.zeni -= total;
  if (moeda) carteira.saldo += quantidade;
  else p.inventory[o.item]=(p.inventory[o.item]||0)+quantidade;
  o.quantidade-=quantidade;if(!o.quantidade)this.ofertas.delete(id);
  this.creditos.set(o.vendedorId,credito+total);this.revisao++;
  return{ok:true,item:o.item,quantidade,total};
 }
 cancelar(p,{id},carteira){
  if(!perto(p))return falha('Aproxime-se do mercador para cancelar.');
  const o=this.ofertas.get(id);if(!o||o.vendedorId!==p.mercadoId)return falha('Anúncio não encontrado ou pertence a outro jogador.');
  if (o.item === ZENI_DOURADO_MARKET) {
   if (!carteira || carteira.saldo + o.quantidade > MAX_PREMIUM) return falha('Libere espaço na carteira de Zeni Dourado.');
   carteira.saldo += o.quantidade;
  } else if (o.origem === 'entrega') {
   const qtd = (p.entregasPremium[o.item] || 0) + o.quantidade;
   if (qtd > LIMITE_ESTOQUE_LOJA) return falha('Recolha entregas pendentes antes de cancelar o anúncio.');
   p.entregasPremium[o.item] = qtd;
  } else {
   if((p.inventory[o.item]||0)+o.quantidade>LIMITE_ESTOQUE_LOJA||!mochilaComporta(p,{[o.item]:o.quantidade}))return falha('Libere espaço na mochila para recuperar os itens do anúncio.');
   p.inventory[o.item]=(p.inventory[o.item]||0)+o.quantidade;
  }
  this.ofertas.delete(id);this.revisao++;
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
   const item = o?.item === 'crystal' ? 'cristal-azul' : o?.item;
   if(!o||typeof o.id!=='string'||!/^oferta-\d+$/.test(o.id)||!Number.isSafeInteger(Number(o.id.slice(7)))||!conta(o.vendedorId)||!produtoMarket(item)||!inteiro(o.quantidade,item === ZENI_DOURADO_MARKET ? MAX_PREMIUM : LIMITE_ESTOQUE_LOJA)||!inteiro(o.preco,MAX_ZENI_NORMAL)||!Number.isFinite(o.criadoEm)||this.ofertas.has(o.id))continue;
   this.ofertas.set(o.id,{id:o.id,vendedorId:o.vendedorId,vendedor:String(o.vendedor||'Guerreiro').slice(0,18),item,quantidade:o.quantidade,preco:o.preco,criadoEm:o.criadoEm,
    ...(item === ZENI_DOURADO_MARKET && conta(o.contaVendedora) ? {contaVendedora:o.contaVendedora} : {}),
    ...(o.origem === 'entrega' ? {origem:o.origem} : {})});
   this.serial=Math.max(this.serial,Number(o.id.slice(7))||0);
  }
  if(Number.isSafeInteger(estado?.serial))this.serial=Math.max(this.serial,estado.serial);
  for(const par of Array.isArray(estado?.creditos)?estado.creditos:[])if(Array.isArray(par)&&conta(par[0])&&Number.isSafeInteger(par[1])&&par[1]>=0)this.creditos.set(par[0],par[1]);
 }
}
