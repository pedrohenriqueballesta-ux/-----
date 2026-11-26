import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { PORTAIS, lugar } from '../public/shared/nucleo/config.mjs';
import { tasksHunt } from '../public/shared/sistemas/tasks-hunt.mjs';
import { caminhoPorTerra, pesLivres } from '../public/shared/mundo/passagem.mjs';

test('portais da Clareira ficam em círculo, separados e acessíveis a partir da chegada', () => {
 const z=lugar('terra-hub'), entradas=PORTAIS.filter(p=>p.area===z.area);
 assert.equal(entradas.length,7);
 for(const p of entradas) {
  assert.ok(pesLivres(p.planet,p.x,p.y,20,p.area));
  assert.ok(caminhoPorTerra(p.planet,z.chegada,p,p.area));
  assert.ok(Math.abs(Math.hypot(p.x-z.chegada.x,p.y-z.chegada.y)-150)>15);
  for(const outro of entradas)if(p!==outro)assert.ok(Math.hypot(p.x-outro.x,p.y-outro.y)>140);
 }
});

test('task conta espécie e área no servidor, persiste e resgata apenas uma vez', () => {
 const g=new Game({populate:false,random:()=>.5});
 const task=tasksHunt()[0], bloqueada=tasksHunt().at(-1);
 const p=g.addPlayer('p','Teste',{level:8,missoes:{tasks:{[task.id]:task.meta}}});
 const aceitar=id=>g.action(p.id,{type:'aceitarTask',id});
 assert.equal(aceitar(bloqueada.id).ok,false);
 assert.equal(g.action(p.id,{type:'acompanharMissao',id:task.id}).ok,false);
 const abater=(tipo,area)=>{
  g.levar(p,lugar(area));p.x+=170;
  return g.hit(p,g.addMob(tipo,p.x+55,p.y,area),1e6);
 };
 assert.equal(abater(task.tipo,task.area),true);
 assert.equal(p.missoes.tasksAtivas[task.id],undefined);
 assert.equal(aceitar(task.id).ok,true);
 assert.equal(aceitar(task.id).ok,false);
 assert.equal(abater('triceratops',task.area),true);
 assert.equal(abater(task.tipo,'inicial'),true);
 p.godmode=true;assert.equal(abater(task.tipo,task.area),true);p.godmode=false;
 assert.equal(p.missoes.tasksAtivas[task.id],0);
 for(let i=0;i<task.meta;i++)assert.equal(abater(task.tipo,task.area),true);
 const voltou=g.addPlayer('q','Teste',g.exportPlayer(p));
 assert.equal(voltou.missoes.tasksAtivas[task.id],task.meta);
 assert.equal(g.action(voltou.id,{type:'acompanharMissao',id:task.id}).ok,true);
 const zeni=voltou.zeni, [item]=Object.keys(task.recompensa.itens);
 const estoque=voltou.inventory[item]||0;
 assert.equal(g.action(voltou.id,{type:'resgatarMissao',id:task.id}).ok,true);
 assert.equal(voltou.zeni-zeni,task.recompensa.zeni);
 assert.equal(voltou.inventory[item],estoque+1);
 assert.equal(voltou.missoes.acompanhada,null);
 assert.equal(g.action(voltou.id,{type:'resgatarMissao',id:task.id}).ok,false);
 const novamente=g.addPlayer('r','Teste',g.exportPlayer(voltou));
 assert.equal(g.action(novamente.id,{type:'resgatarMissao',id:task.id}).ok,false);
 assert.equal(g.action(novamente.id,{type:'aceitarTask',id:task.id}).ok,false);
});

test('grito aparece só com técnica aceita e preferências persistem', () => {
 const g=new Game({populate:false}), p=g.addPlayer('p','Teste',{level:30});
 assert.equal(g.cast(p,'heal').ok,false);
 p.hp=1;
 assert.equal(g.cast(p,'heal').ok,true);
 assert.equal(g.cast(p,'heal').ok,false);
 assert.deepEqual(g.events.filter(e=>e.type==='skillShout').map(e=>e.text),['Cura de Vida!']);
 assert.equal(g.action(p.id,{type:'preferencias',valor:{gritosTecnicas:false}}).ok,true);
 assert.equal(g.addPlayer('volta','Teste',g.exportPlayer(p)).preferencias.gritosTecnicas,false);
});
