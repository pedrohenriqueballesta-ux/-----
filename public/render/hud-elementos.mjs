export const el=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
export const numero=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
export function botao(texto,acao){const b=el('button',texto);b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await acao();}finally{if(b.isConnected)b.disabled=false;}};return b;}
export function selecionar(opcoes,nome){const s=el('select');s.setAttribute('aria-label',nome);for(const[v,t]of opcoes){const o=el('option',t);o.value=v;s.append(o);}return s;}
export function campo(nome,tipo='text',valor='',min,max){const l=el('label',nome),i=el('input');i.type=tipo;i.value=valor;i.setAttribute('aria-label',nome);if(min!=null)i.min=min;if(max!=null)i.max=max;l.append(i);return{l,i};}
export function barra(valor,max){const p=el('progress');p.max=max||1;p.value=valor||0;return p;}
export function recompensa(r={}){return [...(r.zeni?[numero(r.zeni)+' Z']:[]),...(r.xp?[numero(r.xp)+' XP']:[]),...Object.entries(r.itens||{}).map(([k,q])=>numero(q)+' × '+({food:'Presunto',ki:'Poção de Ki',seed15:'Semente 15%'}[k]||k))].join(' · ');}
export function artigo(titulo,texto){const a=el('article',null,'hud-card');a.append(el('h3',titulo));if(texto)a.append(el('p',texto));return a;}