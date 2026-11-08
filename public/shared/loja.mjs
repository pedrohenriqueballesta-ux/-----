import { CONFIG } from './config.mjs';
import { bagWeight } from './characters.mjs';
export const LIMITE_ESTOQUE_LOJA = 99999;
export function limiteCompra(estado,item) {
  if(!estado || !Object.hasOwn(CONFIG.prices,item))return 0;
  const peso=Number.isFinite(estado.weight)?estado.weight:bagWeight(estado.inventory||{});
  const dinheiro=Math.floor(estado.zeni/CONFIG.prices[item]);
  const capacidade=Math.floor((estado.stats.capacity-peso+.0001)/CONFIG.itemWeights[item]);
  const estoque=LIMITE_ESTOQUE_LOJA-(estado.inventory?.[item]||0);
  return Math.max(0,Math.min(dinheiro,capacidade,estoque,LIMITE_ESTOQUE_LOJA));
}

export function avaliarCarrinho(estado,itens){
 const falha=reason=>({ok:false,reason});
 if(!estado||!itens||typeof itens!=='object'||Array.isArray(itens))return falha('Seleção inválida.');
 let total=0,peso=0,quantidade=0;
 for(const[item,q]of Object.entries(itens)){
  if(!Object.hasOwn(CONFIG.prices,item)||!Number.isSafeInteger(q)||q<0||q>LIMITE_ESTOQUE_LOJA)return falha('Item ou quantidade inválidos.');
  if((estado.inventory?.[item]||0)+q>LIMITE_ESTOQUE_LOJA)return falha('Limite de estoque atingido.');
  total+=CONFIG.prices[item]*q;peso+=CONFIG.itemWeights[item]*q;quantidade+=q;
 }
 if(!quantidade)return falha('Selecione pelo menos uma unidade.');
 if(total>estado.zeni)return falha('Zeni insuficiente para todos os itens selecionados.');
 const atual=Number.isFinite(estado.weight)?estado.weight:bagWeight(estado.inventory||{});
 if(atual+peso>estado.stats.capacity+.0001)return falha('A mochila não comporta todos os itens selecionados.');
 return{ok:true,total,peso,quantidade};
}
