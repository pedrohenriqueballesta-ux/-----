import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {createPlayer} from '../public/shared/characters.mjs';
import {vincularPasseConta,passeDoPersonagem,registrarAtividadePasse,resumoBattlePass,resgatarMissaoPasse} from '../public/shared/battle-pass.mjs';
import {TEMPORADA,TEMPORADAS,recompensaPasse} from '../public/shared/premium-config.mjs';
import {resgatarMissao,registrarMissao} from '../public/shared/missoes.mjs';
import {EconomiaPremium} from '../server/premium.mjs';
const now=Date.parse('2026-11-08T12:00:00Z');
test('migração une direitos e resgates antigos sem somar XP duplicado, e não reimporta saves antigos',()=>{
 const p=createPlayer('p','QA'),q=createPlayer('q','QA2');const a={personagens:[]};
 const v=passeDoPersonagem(p,now);v.xp=1200;v.resgatadas=['gratis:1'];registrarAtividadePasse(q,'kills',2000,now);const u=passeDoPersonagem(q,now);u.premium=true;u.resgatadas=['premium:1'];
 a.personagens=[{save:{battlePass:structuredClone(p.battlePass)}},{save:{battlePass:structuredClone(q.battlePass)}}];
 vincularPasseConta(a,p,now);vincularPasseConta(a,q,now);assert.equal(p.battlePass,q.battlePass);assert.equal(passeDoPersonagem(p,now).xp,2000);assert.equal(passeDoPersonagem(p,now).premium,true);assert.deepEqual(passeDoPersonagem(p,now).resgatadas.sort(),['gratis:1','premium:1']);
 registrarAtividadePasse(q,'skills',20,now);assert.equal(resgatarMissaoPasse(p,'dia-treino',now).ok,true);assert.equal(resgatarMissaoPasse(q,'dia-treino',now).ok,false);assert.equal(passeDoPersonagem(q,now).xp,2100);
 const salvo=JSON.parse(JSON.stringify(a)),outro=createPlayer('r','QA3');vincularPasseConta(salvo,outro,now);assert.equal(passeDoPersonagem(outro,now).xp,2100);
});
test('missões do jogo contam só após resgate válido, sem contar missões do próprio passe',()=>{
 const g=new Game({populate:false,now:now/1000}),p=g.addPlayer('p','QA');g.agora=()=>now;
 registrarMissao(p,'skills',20,now);assert.equal(resgatarMissao(g,p,'tecnicas-diarias').ok,true);assert.equal(resgatarMissao(g,p,'tecnicas-diarias').ok,false);
 assert.equal(resumoBattlePass(p,now).missoes.find(m=>m.id==='semana-missoes').progresso,1);
 resgatarMissaoPasse(p,'dia-treino',now);assert.equal(resumoBattlePass(p,now).missoes.find(m=>m.id==='semana-missoes').progresso,1);
});
test('XP de atividades é independente, rejeita valores inválidos e respeita teto de 50.000',()=>{
 const p=createPlayer('p','QA');registrarAtividadePasse(p,'kills',-1,now);registrarAtividadePasse(p,'kills',1.5,now);registrarAtividadePasse(p,'inventado',100,now);assert.equal(resumoBattlePass(p,now).xp,0);
 registrarAtividadePasse(p,'kills',100000,now);assert.equal(resumoBattlePass(p,now).xp,50000);assert.equal(resumoBattlePass(p,now).nivel,50);assert.equal(p.xp,0);registrarAtividadePasse(p,'bosses',1,now);assert.equal(passeDoPersonagem(p,now).xp,50000);
 for(let n=1;n<=50;n++)for(const t of ['gratis','premium'])assert.ok(recompensaPasse(n,t));
});
test('temporada seguinte configurada começa zerada e exige nova compra, preservando histórico',()=>{
 const p=createPlayer('p','QA'),a={id:'conta'},e=new EconomiaPremium({agora:()=>agora});let agora=now;
 vincularPasseConta(a,p,now);Object.assign(passeDoPersonagem(p,now),{xp:50000,premium:true,resgatadas:['gratis:1']});
 const prox={...TEMPORADA,id:'s2',inicio:TEMPORADA.fim,fim:'2026-12-31T00:00:00Z'};TEMPORADAS.push(prox);
 try{agora=Date.parse(TEMPORADA.fim);const s=e.estado(a,p);assert.equal(s.battlePass.temporada.id,'s2');assert.equal(s.battlePass.xp,0);assert.equal(s.battlePass.premium,false);assert.equal(e.resgatar(a,p,1,'gratis').ok,false);assert.equal(s.produtos.find(x=>x.temporada).id,'passe-s2');assert.equal(a.battlePass.temporadas.s1.premium,true);}finally{TEMPORADAS.pop();}
 agora=Date.parse(TEMPORADA.fim);assert.equal(e.estado(a,p).battlePass.ativa,false);assert.equal(e.resgatar(a,p,1,'gratis').ok,false);
});
test('troca de personagem e reenvio de resgate não duplicam recursos nem ignoram capacidade',()=>{
 const p=createPlayer('p','QA'),q=createPlayer('q','QA2'),a={id:'conta'},e=new EconomiaPremium({agora:()=>now});vincularPasseConta(a,p,now);vincularPasseConta(a,q,now);passeDoPersonagem(p,now).xp=10000;
 const antes=q.inventory.crystal;q.stats.capacity=0;assert.equal(e.resgatar(a,q,3,'gratis').ok,false);q.stats.capacity=9999;
 assert.equal(e.resgatar(a,q,3,'gratis').ok,true);assert.equal(q.inventory.crystal,antes+1);assert.equal(e.resgatar(a,p,3,'gratis').ok,false);assert.equal(q.inventory.crystal,antes+1);
});

test('cotação de Premium anterior não pode ser confirmada após virar a temporada',()=>{
 const p=createPlayer('p','QA'),a={id:'conta',premium:{saldo:500}},e=new EconomiaPremium({agora:()=>agora});let agora=Date.parse(TEMPORADA.fim)-1000;
 const q=e.preparar(a,p,'passe-s1');assert.equal(q.ok,true);TEMPORADAS.push({...TEMPORADA,id:'s2',inicio:TEMPORADA.fim,fim:'2026-12-31T00:00:00Z'});
 try{agora+=1001;assert.equal(e.confirmar(a,p,q.cotacao.id).ok,false);assert.equal(e.carteira(a).saldo,500);}finally{TEMPORADAS.pop();}
});
