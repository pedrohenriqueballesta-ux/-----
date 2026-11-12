import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {fatorCombateAleatorio,variarExperiencia,VARIACAO_COMBATE} from '../public/shared/variacao-combate.mjs';

test('fator variável fica limitado a ±10% e mantém o valor-base no centro',()=>{
 assert.equal(fatorCombateAleatorio(()=>0),.9);
 assert.equal(fatorCombateAleatorio(()=>.5),1);
 assert.equal(fatorCombateAleatorio(()=>1),1.1);
 assert.equal(VARIACAO_COMBATE.min,.9);assert.equal(VARIACAO_COMBATE.max,1.1);
 assert.equal(variarExperiencia(100,()=>0),90);
 assert.equal(variarExperiencia(100,()=>.5),100);
 assert.equal(variarExperiencia(100,()=>1),110);
 assert.equal(variarExperiencia(1,()=>0),1);
});

test('cura, dano causado, dano recebido e XP do mob usam sorteios independentes do mundo',()=>{
 const cena=sorteio=>{
  const g=new Game({now:1000,populate:false,random:()=>.5,randomCombat:()=>sorteio}),p=g.addPlayer('p');
  Object.assign(p,{planet:'namek',area:'inicial',x:1500,y:1500,seguroAte:0,autoFood:false,autoHeal:false});
  return {g,p};
 };
 const baixo=cena(0),alto=cena(1);
 for(const {g,p} of [baixo,alto]){p.hp=p.stats.hp/2;p.ki=p.stats.ki;g.cast(p,'heal');}
 assert.ok(alto.p.hp>baixo.p.hp);
 const dano=[];
 for(const {g,p} of [baixo,alto]){const m=g.addMob('saibaman',p.x+60,p.y,'inicial');m.defesa=0;g.hit(p,m,40);dano.push(g.events.findLast(e=>e.type==='damage'&&e.targetId===m.id).amount);}
 assert.ok(dano[1]>dano[0]);
 const recebido=[];
 for(const {g,p} of [baixo,alto]){const m=g.addMob('melee',p.x+60,p.y,'inicial');m.attack=40;g.hit(m,p,40);recebido.push(g.events.findLast(e=>e.type==='damage'&&e.targetId===p.id).amount);}
 assert.ok(recebido[1]>recebido[0]);
 const xp=[];
 for(const {g,p} of [baixo,alto]){const m=g.addMob('saibaman',p.x+60,p.y,'inicial');m.hp=1;g.hit(p,m,1e6);xp.push(p.xp);}
 assert.ok(xp[1]>xp[0]);
});
