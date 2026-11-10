// Medição reproduzível: sem navegador, save ou God Mode. Semente 12345.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Game} from '../public/shared/game.mjs';
import {statsFor} from '../public/shared/characters.mjs';
import {lugar,CONFIG} from '../public/shared/config.mjs';
const sorteio=()=>{let s=12345;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
export function duelo(tipo,area,nivel) {
  const g=new Game({populate:false,now:1000,random:sorteio()}),p=g.addPlayer('p','Teste',{level:nivel});
  g.levar(p,lugar(area));p.seguroAte=0;p.x=area==='norte'?2730*1.8:850*1.8;p.y=area==='norte'?400*1.8:1500*1.8;
  p.hp=p.stats.hp;p.ki=p.stats.ki;p.autoHeal=p.autoFood=false;
  const m=g.addMob(tipo,p.x+220,p.y,area);m.attackReady=g.time+1;p.targetId=m.id;
  for(let t=0;t<180;t+=.05) {
    const d=Math.hypot(m.x-p.x,m.y-p.y),perto=d<=65+(m.corpo||0),n=d||1;
    g.setInput(p.id,{x:perto?0:(m.x-p.x)/n,y:perto?0:(m.y-p.y)/n});p.targetId=m.id;
    if(p.hp/p.stats.hp<.7)g.cast(p,'heal');
    if(d<=70+(m.corpo||0))g.cast(p,'basic');
    if(p.ki>p.stats.ki*.35&&m.hp>p.stats.attack*1.6)g.cast(p,'kame');
    else if(p.ki>p.stats.ki*.15&&d<390)g.cast(p,'ki');
    g.tick(.05);
    if(p.hp<=0||m.hp<=0)return{tipo,nivel,resultado:p.hp>0?'vence':'perde',segundos:+(g.time-1000).toFixed(2),hpJogador:+(100*p.hp/p.stats.hp).toFixed(1),hpMob:+(100*m.hp/m.maxHp).toFixed(1)};
  }
  return {tipo,nivel,resultado:'limite 180 s',hpJogador:p.hp,hpMob:m.hp};
}
export function caca(area,nivel) {
  const g=new Game({now:1000,random:sorteio()}),p=g.addPlayer('p','Teste',{level:nivel});
  for(const [id,m]of g.mobs)if(m.area!==area)g.mobs.delete(id);
  g.levar(p,lugar(area));g.action(p.id,{type:'hunt'});let mortes=0,vivo=true;
  for(let i=0;i<300/.1;i++) {
    g.tick(.1);if(vivo&&p.hp<=0)mortes++;vivo=p.hp>0;
    if(vivo&&!p.autoHunt)g.action(p.id,{type:'hunt'});
  }
  return {area,nivelInicial:nivel,nivelFinal:p.level,abates:p.kills,mortes};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const duelos=[];for(const [area,tipos]of [['norte',['nail','piccoloDaimaoh','neva']],['vegeta-planicies',['tsufuruGuerreiro','tsufuruGeneral','hatchiyack']]])for(const tipo of tipos)for(const n of [30,35,40])duelos.push(duelo(tipo,area,n));
console.log(JSON.stringify({duelos,cacas:[caca('norte',30),caca('vegeta-planicies',30)]},null,2));

}
