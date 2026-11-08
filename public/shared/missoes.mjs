import {bagWeight} from './characters.mjs';
import {CONFIG} from './config.mjs';
import {creditarZeni,saldoReal,MAX_ZENI_NORMAL} from './itens-negociaveis.mjs';
export const MISSOES=Object.freeze([
 {id:'primeiros-passos',nome:'Primeiros passos',categoria:'principal',descricao:'Alcance o nível 3 para dominar o Kamehameha.',evento:'nivel',meta:3,recompensa:{zeni:30,xp:10}},
 {id:'dominio-ki',nome:'Domínio do Ki',categoria:'principal',descricao:'Alcance o nível 5, marco da transformação Super Saiyajin.',evento:'nivel',meta:5,requer:'primeiros-passos',recompensa:{zeni:60,xp:20}},
 {id:'defensor',nome:'Defensor dos campos',categoria:'secundaria',descricao:'Derrote 20 inimigos.',evento:'kills',meta:20,recompensa:{zeni:50}},
 {id:'coletor',nome:'Recursos da expedição',categoria:'secundaria',descricao:'Recolha 10 drops deixados pelos inimigos.',evento:'coleta',meta:10,recompensa:{zeni:25,itens:{ki:1}}},
 {id:'caca-diaria',nome:'Caçada diária',categoria:'diaria',descricao:'Derrote 15 inimigos hoje (UTC).',evento:'kills',meta:15,recompensa:{zeni:40,xp:15}},
 {id:'tecnicas-diarias',nome:'Treino de técnicas',categoria:'diaria',descricao:'Ative 20 técnicas com sucesso hoje (UTC).',evento:'skills',meta:20,recompensa:{zeni:25}},
 {id:'coleta-diaria',nome:'Suprimentos do dia',categoria:'diaria',descricao:'Recolha 5 drops hoje (UTC).',evento:'coleta',meta:5,recompensa:{itens:{food:2}}},
 {id:'caca-semanal',nome:'Expedição semanal',categoria:'semanal',descricao:'Derrote 200 inimigos nesta semana (segunda-feira, UTC).',evento:'kills',meta:200,recompensa:{zeni:300,xp:100}},
 {id:'chefe-semanal',nome:'Desafio dos chefes',categoria:'semanal',descricao:'Derrote um chefe raro nesta semana.',evento:'bosses',meta:1,recompensa:{zeni:200,itens:{seed15:1}}}
]);
const numero=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e9):0;
const contagens=v=>Object.fromEntries(['coleta','skills','kills','bosses'].map(k=>[k,numero(v?.[k])]));
const ids=v=>(Array.isArray(v)?v:[]).filter(id=>MISSOES.some(m=>m.id===id));
export function periodos(agora=Date.now()){const dia=Math.floor(agora/86400000);return{diaria:dia,semanal:Math.floor((dia+3)/7)};}
export function restaurarMissoes(v,agora=Date.now()){
 const chaves=periodos(agora),s={total:contagens(v?.total),resgatadas:ids(v?.resgatadas),acompanhada:MISSOES.some(m=>m.id===v?.acompanhada)?v.acompanhada:null};
 for(const c of ['diaria','semanal'])s[c]=v?.[c]?.chave===chaves[c]?{chave:chaves[c],contagens:contagens(v[c].contagens),resgatadas:ids(v[c].resgatadas)}:{chave:chaves[c],contagens:contagens(),resgatadas:[]};
 return s;
}
export function renovarMissoes(p,agora=Date.now()){
 const chaves=periodos(agora);for(const c of ['diaria','semanal'])if(p.missoes[c].chave!==chaves[c])p.missoes[c]={chave:chaves[c],contagens:contagens(),resgatadas:[]};
}
export function registrarMissao(p,evento,valor=1,agora=Date.now()){
 renovarMissoes(p,agora);if(p.godmode||!Object.hasOwn(p.missoes.total,evento)||!Number.isSafeInteger(valor)||valor<1)return;
 for(const c of [p.missoes.total,p.missoes.diaria.contagens,p.missoes.semanal.contagens])c[evento]=Math.min(1e9,c[evento]+valor);
}
export function listarMissoes(p,agora=Date.now()){
 renovarMissoes(p,agora);
 return MISSOES.map(m=>{const periodo=p.missoes[m.categoria],resgatadas=periodo?.resgatadas||p.missoes.resgatadas;
 const progresso=Math.min(m.meta,m.evento==='nivel'?(p.levelReal??p.level):periodo?periodo.contagens[m.evento]:m.evento==='kills'?p.kills:p.missoes.total[m.evento]);
 const bloqueada=m.requer&&!p.missoes.resgatadas.includes(m.requer),resgatada=resgatadas.includes(m.id);
 return{...m,progresso,estado:resgatada?'resgatada':bloqueada?'bloqueada':progresso>=m.meta?'concluida':progresso?'andamento':'disponivel',acompanhada:p.missoes.acompanhada===m.id};});
}
export function resgatarMissao(g,p,id){
 const m=listarMissoes(p,g.agora()).find(m=>m.id===id);if(!m||m.estado!=='concluida')return{ok:false,reason:'Missão indisponível para resgate.'};
 if(p.godmode)return{ok:false,reason:'Desative o God Mode para resgatar recompensas.'};
 const r=m.recompensa,itens=r.itens||{},peso=Object.entries(itens).reduce((n,[k,q])=>n+CONFIG.itemWeights[k]*q,0);
 if(saldoReal(p)+(r.zeni||0)>MAX_ZENI_NORMAL||bagWeight(p.inventory)+peso>p.stats.capacity+.0001||Object.entries(itens).some(([k,q])=>(p.inventory[k]||0)+q>99999))return{ok:false,reason:'Libere espaço na mochila ou na carteira para receber a recompensa.'};
 (p.missoes[m.categoria]?.resgatadas||p.missoes.resgatadas).push(id);
 if(r.zeni)creditarZeni(p,r.zeni);for(const[k,q]of Object.entries(itens))p.inventory[k]=(p.inventory[k]||0)+q;
 if(r.xp)g.awardXp(p,r.xp);g.notify(p,'Recompensa recebida: '+m.nome+'.');return{ok:true};
}