import { ITENS_NEGOCIAVEIS } from './itens-negociaveis.mjs';
import { LIMITE_ESTOQUE_LOJA } from './loja.mjs';
import { consumivelValido } from '../tecnicas/consumiveis-hotkeys.mjs';

export function itemElegivelVendaNpc(id) {
  if (!Object.hasOwn(ITENS_NEGOCIAVEIS, id) || !Number.isFinite(ITENS_NEGOCIAVEIS[id].precoNpc) || consumivelValido(id)) return false;
  const { raridade } = ITENS_NEGOCIAVEIS[id];
  return ['comum','incomum','raro'].includes(raridade);
}

export function itensVendaNpc(inventario) {
  return Object.fromEntries(Object.entries(inventario).filter(([id, qtd]) => qtd > 0 && itemElegivelVendaNpc(id)));
}

export function avaliarVendaNpc(inventario, selecao, somenteElegiveis = true) {
  if (!selecao || typeof selecao !== 'object' || Array.isArray(selecao))
    return { ok:false, reason:'Seleção inválida.' };
  const itens = Object.entries(selecao);
  if (!itens.length) return { ok:false, reason:'Nenhum item para vender.' };
  let total = 0, quantidade = 0;
  for (const [id, qtd] of itens) {
    if (!Object.hasOwn(ITENS_NEGOCIAVEIS, id) || !Number.isFinite(ITENS_NEGOCIAVEIS[id].precoNpc) || (somenteElegiveis && !itemElegivelVendaNpc(id)) ||
        !Number.isSafeInteger(qtd) || qtd < 1 || qtd > LIMITE_ESTOQUE_LOJA)
      return { ok:false, reason:'O lote contém um item ou quantidade inválida.' };
    if ((inventario[id] || 0) < qtd)
      return { ok:false, reason:'A quantidade de ' + ITENS_NEGOCIAVEIS[id].nome + ' na mochila mudou.' };
    total += ITENS_NEGOCIAVEIS[id].precoNpc * qtd;
    quantidade += qtd;
  }
  return { ok:true, total, quantidade };
}
