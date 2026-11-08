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
