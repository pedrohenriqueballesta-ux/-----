import {bagWeight} from './characters.mjs';
import {CONFIG} from './config.mjs';
import {saldoReal,creditarZeni,MAX_ZENI_NORMAL} from './itens-negociaveis.mjs';
export function recompensaValida(r){return !!r&&Number.isSafeInteger(r.zeni??0)&&(r.zeni??0)>=0&&(r.zeni??0)<=MAX_ZENI_NORMAL&&r.itens!==null&&(r.itens===undefined||typeof r.itens==='object'&&!Array.isArray(r.itens)&&Object.entries(r.itens).every(([k,q])=>Object.hasOwn(CONFIG.itemWeights,k)&&Number.isSafeInteger(q)&&q>0&&q<=99999));}
export function acaoCorreio(p,d){
 const n=p.novidades.find(n=>n.id===d.id&&!n.arquivada);
 if(d.operacao==='lerTodas'){for(const n of p.novidades)n.lida=true;return{ok:true};}
 if(!n)return{ok:false,reason:'Mensagem não encontrada.'};
 if(d.operacao==='ler'){n.lida=true;return{ok:true};}
 if(d.operacao==='arquivar'){
  if(n.recompensa&&!n.resgatada)return{ok:false,reason:'Resgate a recompensa antes de arquivar.'};n.arquivada=true;n.lida=true;return{ok:true};
 }
 if(d.operacao!=='resgatar'||(n.resgatada||p.correioResgatadas.includes(n.id))||!recompensaValida(n.recompensa))return{ok:false,reason:'Recompensa indisponível.'};
 if(p.godmode)return{ok:false,reason:'Desative o God Mode para resgatar.'};
 const r=n.recompensa,itens=r.itens||{},peso=Object.entries(itens).reduce((a,[k,q])=>a+CONFIG.itemWeights[k]*q,0);
 if(saldoReal(p)+(r.zeni||0)>MAX_ZENI_NORMAL||bagWeight(p.inventory)+peso>p.stats.capacity+.0001||Object.entries(itens).some(([k,q])=>(p.inventory[k]||0)+q>99999))return{ok:false,reason:'Libere espaço na mochila ou na carteira.'};
 p.correioResgatadas.push(n.id);n.resgatada=true;n.lida=true;if(r.zeni)creditarZeni(p,r.zeni);for(const[k,q]of Object.entries(itens))p.inventory[k]=(p.inventory[k]||0)+q;return{ok:true};
}