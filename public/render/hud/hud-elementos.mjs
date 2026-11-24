import { ITENS_NEGOCIAVEIS } from '../../shared/sistemas/itens-negociaveis.mjs';
import { COLECIONAVEIS } from '../../shared/sistemas/premium-config.mjs';

export const el=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
export const numero=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
export function botao(texto,acao){const b=el('button',texto);b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await acao();}finally{if(b.isConnected)b.disabled=false;}};return b;}
export function selecionar(opcoes,nome){const s=el('select');s.setAttribute('aria-label',nome);for(const[v,t]of opcoes){const o=el('option',t);o.value=v;s.append(o);}return s;}
export function campo(nome,tipo='text',valor='',min,max){const l=el('label',nome),i=el('input');i.type=tipo;i.value=valor;i.setAttribute('aria-label',nome);if(min!=null)i.min=min;if(max!=null)i.max=max;l.append(i);return{l,i};}
export function barra(valor,max){const p=el('progress');p.max=max||1;p.value=valor||0;return p;}
export function aplicarRaridadeItem(elemento, id) {
  const raridade = ITENS_NEGOCIAVEIS[id]?.raridade;
  if (raridade) elemento.dataset.raridadeItem = raridade;
  else delete elemento.dataset.raridadeItem;
  return elemento;
}
export function nomeComRaridade(elemento, id) {
  elemento.classList.add('nome-item');
  return aplicarRaridadeItem(elemento, id);
}
export function marcarItemInspecionavel(elemento, id) {
  if (Object.hasOwn(ITENS_NEGOCIAVEIS, id)) elemento.dataset.inspecionarItem = id;
  else if (Object.hasOwn(COLECIONAVEIS, id)) elemento.dataset.inspecionarColecionavel = id;
  else return elemento;
  if (elemento.tagName !== 'BUTTON') elemento.tabIndex = 0;
  return elemento;
}
export function recompensa(r = {}) {
  const partes = [
    ...(r.zeni ? [el('span', numero(r.zeni) + ' Z')] : []),
    ...(r.xp ? [el('span', numero(r.xp) + ' XP')] : []),
    ...(r.moedas ? [el('span', numero(r.moedas) + ' moedas premium')] : []),
    ...Object.entries(r.itens ?? {}).map(([id, qtd]) => marcarItemInspecionavel(
      nomeComRaridade(el('span', numero(qtd) + ' × ' + (ITENS_NEGOCIAVEIS[id]?.nome ?? id), 'recompensa-item'), id), id)),
    ...(r.colecao ?? []).map(id => marcarItemInspecionavel(
      el('span', COLECIONAVEIS[id]?.nome ?? id, 'recompensa-item'), id))
  ];
  const lista = el('p', null, 'hud-recompensa-itens');
  for (const parte of partes) {
    if (lista.childNodes.length) lista.append(' · ');
    lista.append(parte);
  }
  return lista;
}
export function artigo(titulo,texto){const a=el('article',null,'hud-card');a.append(el('h3',titulo));if(texto)a.append(el('p',texto));return a;}