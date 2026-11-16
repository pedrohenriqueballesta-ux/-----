import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {existsSync} from 'node:fs';
import {barraValida,acaoDaTecnica,TECNICAS,MAGIAS_PERSONAGEM} from '../public/shared/barra-tecnicas.mjs';

test('barra antiga migra para oito teclas e preserva consumíveis configurados',()=>{
 const b=barraValida(null,{7:'seed30',8:'food'},15);
 assert.equal(b.length,8);assert.deepEqual(b.slice(0,3),['skill:heal','skill:kame','form:auto']);
 assert.deepEqual(b.slice(5),['item:seed30','item:food',null]);
 assert.equal(acaoDaTecnica('form:kaioken').forma,'kaioken');
 assert.deepEqual(acaoDaTecnica('item:seed30'),{type:'seed',potency:30});
});

test('catálogo lista habilidades e todas as formas com desbloqueios corretos',()=>{
 for(const id of ['skill:heal','skill:ki','skill:dash','skill:kame','skill:barrier','skill:genki','form:kaioken','form:ssj','form:ssj2','form:ssj3','form:ssj4','form:gogeta','form:vegito'])assert.ok(TECNICAS.some(t=>t.id===id));
 assert.equal(TECNICAS.find(t=>t.id==='form:ssj').nivel,100);
 assert.equal(TECNICAS.find(t=>t.id==='form:kaioken').nivel,50);
});

test('aba Técnicas contém só magias e formas, cada uma com seu ícone disponível',()=>{
 assert.deepEqual(MAGIAS_PERSONAGEM.filter(t=>t.id.startsWith('skill:')).map(t=>t.id),['skill:heal','skill:kame','skill:barrier','skill:genki']);
 assert.deepEqual(MAGIAS_PERSONAGEM.filter(t=>t.id.startsWith('form:')).map(t=>t.id),['form:kaioken','form:ssj','form:ssj2','form:ssj3','form:ssj4','form:gogeta','form:vegito']);
 assert.ok(MAGIAS_PERSONAGEM.every(t=>Boolean(t.imagem||t.icone)));
 for(const t of MAGIAS_PERSONAGEM)if(t.imagem)assert.ok(existsSync(new URL('../public'+t.imagem,import.meta.url)),t.imagem);
});

test('servidor salva slots válidos e rejeita IDs desconhecidos ou repetidos',()=>{
 const g=new Game(),p=g.addPlayer('barra','Goku');
 const slots=['skill:kame','skill:heal','form:kaioken','item:ki','skill:barrier','skill:genki',null,null];
 assert.equal(g.action(p.id,{type:'configurarBarra',slots}).ok,true);
 assert.deepEqual(g.exportPlayer(p).barraTecnicas,slots);
 assert.deepEqual(g.addPlayer('copia','Goku',g.exportPlayer(p)).barraTecnicas,slots);
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:[...slots.slice(0,7),'skill:kame']}).ok,false);
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:[...slots.slice(0,7),'skill:inexistente']}).ok,false);
 assert.deepEqual(p.barraTecnicas,slots);
});

test('nível 100 pode selecionar Kaioken; nível baixo não pode ativar Super Saiyajin',()=>{
 const g=new Game(),p=g.addPlayer('formas-barra','Goku');p.level=100;
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'kaioken');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj'}).ok,true);assert.equal(p.forma,'ssj');
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'kaioken');
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'base');
 p.level=50;assert.equal(g.action(p.id,{type:'transform',forma:'ssj'}).ok,false);assert.equal(p.forma,'base');
});
