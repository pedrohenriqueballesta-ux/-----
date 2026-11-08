import {TEMPORADA,MISSOES_PASSE,recompensaPasse} from './premium-config.mjs';
const numero=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1000000000):0;
const periodo=(categoria,agora)=>{const dia=Math.floor(agora/86400000);return categoria==='diaria'?dia:Math.floor((dia+3)/7);};
const contagens=v=>Object.fromEntries(['kills','coleta','skills','bosses'].map(k=>[k,numero(v?.[k])]));
export function restaurarBattlePass(v){
 const temporadas={};for(const [id,s]of Object.entries(v?.temporadas||{}).slice(-24)){
  if(!/^[a-z0-9_-]{1,40}$/.test(id)||!s||typeof s!=='object')continue;
  temporadas[id]={xp:numero(s.xp),premium:s.premium===true,resgatadas:[...new Set((Array.isArray(s.resgatadas)?s.resgatadas:[]).filter(k=>/^(gratis|premium):[1-9][0-9]{0,3}$/.test(k)))],
   ...Object.fromEntries(['diaria','semanal'].map(c=>[c,{chave:Number.isSafeInteger(s[c]?.chave)?s[c].chave:-1,contagens:contagens(s[c]?.contagens),resgatadas:(Array.isArray(s[c]?.resgatadas)?s[c].resgatadas:[]).filter(id=>MISSOES_PASSE.some(m=>m.id===id))}]))};
 }return {temporadas};
}
export const temporadaAtiva=(agora=Date.now())=>agora>=Date.parse(TEMPORADA.inicio)&&agora<Date.parse(TEMPORADA.fim);
export function passeDoPersonagem(p,agora=Date.now()){
 p.battlePass ||= {temporadas:{}};let s=p.battlePass.temporadas[TEMPORADA.id];
 if(!s){s=restaurarBattlePass({temporadas:{[TEMPORADA.id]:{}}}).temporadas[TEMPORADA.id];p.battlePass.temporadas[TEMPORADA.id]=s;}
 for(const c of ['diaria','semanal'])if(s[c].chave!==periodo(c,agora))s[c]={chave:periodo(c,agora),contagens:contagens(),resgatadas:[]};return s;
}
export function registrarAtividadePasse(p,evento,valor=1,agora=Date.now()){
 if(p.godmode||!temporadaAtiva(agora)||!['kills','coleta','skills','bosses'].includes(evento)||!Number.isSafeInteger(valor)||valor<1)return;
 const s=passeDoPersonagem(p,agora);for(const c of ['diaria','semanal'])s[c].contagens[evento]=Math.min(1000000000,s[c].contagens[evento]+valor);
}
export function resumoBattlePass(p,agora=Date.now()){
 const s=passeDoPersonagem(p,agora),xp=Math.min(s.xp,TEMPORADA.niveis*TEMPORADA.xpPorNivel),nivel=Math.min(TEMPORADA.niveis,Math.floor(xp/TEMPORADA.xpPorNivel)),ativa=temporadaAtiva(agora);
 return {temporada:TEMPORADA,ativa,xp,nivel,premium:s.premium,xpNoNivel:nivel===TEMPORADA.niveis?TEMPORADA.xpPorNivel:xp%TEMPORADA.xpPorNivel,
 missoes:MISSOES_PASSE.map(m=>({...m,progresso:Math.min(m.meta,s[m.categoria].contagens[m.evento]),resgatada:s[m.categoria].resgatadas.includes(m.id),renovaEm:new Date((m.categoria==='diaria'?s.diaria.chave+1:(s.semanal.chave+1)*7-3)*86400000).toISOString()})),
 niveis:Array.from({length:TEMPORADA.niveis},(_,i)=>({nivel:i+1,...Object.fromEntries(['gratis','premium'].map(trilha=>[trilha,{recompensa:recompensaPasse(i+1,trilha),resgatada:s.resgatadas.includes(trilha+':'+(i+1)),desbloqueada:ativa&&i+1<=nivel&&(trilha==='gratis'||s.premium)}]))}))};
}
export function resgatarMissaoPasse(p,id,agora=Date.now()){
 if(p.godmode||!temporadaAtiva(agora))return {ok:false,reason:'Missões indisponíveis fora da temporada ou em God Mode.'};
 const m=MISSOES_PASSE.find(m=>m.id===id),s=passeDoPersonagem(p,agora);
 if(!m||s[m.categoria].resgatadas.includes(id)||s[m.categoria].contagens[m.evento]<m.meta)return {ok:false,reason:'Missão ainda não concluída ou já resgatada.'};
 s[m.categoria].resgatadas.push(id);s.xp=Math.min(TEMPORADA.niveis*TEMPORADA.xpPorNivel,s.xp+m.xp);return {ok:true};
}
