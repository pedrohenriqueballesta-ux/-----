import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { criarBestiario } from '../public/shared/bestiario.mjs';
import { mobStats, TEMPO_CHEFE_RARO } from '../public/shared/enemies.mjs';
import { areaPorId } from '../public/shared/config.mjs';
import { RECOMPENSAS_MOBS } from '../public/shared/recompensas-mobs.mjs';
import { createGameServer } from '../server.mjs';

test('catálogo cobre todas as espécies/locais do mundo, inclusive chefes ainda mortos', () => {
  const g=new Game(),catalogo=criarBestiario(g.mobs.values());
  const especies=new Set([...g.mobs.values()].map(m=>m.area+':'+m.type));
  assert.deepEqual(new Set(catalogo.map(m=>m.id)),especies);
  assert.equal(catalogo.length,21);
  assert.ok(!catalogo.some(m=>m.tipo==='oozaruSuper'),'espécie reservada não aparece como encontrada no mundo');
  for(const m of catalogo){
    const stats=mobStats(m.tipo,m.area);assert.equal(m.hp,stats.hp);assert.equal(m.ataque,stats.attack);assert.equal(m.defesa,stats.defesa);assert.equal(m.xp,stats.xp);
    assert.deepEqual(m.recomendado,areaPorId(m.area).nivel);
    if(m.raro)assert.deepEqual(m.renascimento,[TEMPO_CHEFE_RARO[m.tipo].minimo,TEMPO_CHEFE_RARO[m.tipo].maximo]);
  }
  const freeza=catalogo.find(m=>m.tipo==='freezaBoss');assert.ok(freeza.raro);assert.match(freeza.observacoes.join(' '),/40%/);
  for(const m of g.mobs.values())m.hp=1;
  assert.deepEqual(criarBestiario(g.mobs.values()),catalogo,'HP atual não contamina atributos de referência');
});

test('drops e Zeni do catálogo preservam probabilidades e recompensas existentes', () => {
  assert.deepEqual(RECOMPENSAS_MOBS,{zeniMinimo:5,zeniVariacao:5,zeniChefe:100,fracaoCristal:.3,chanceSemente15:.008});
  const g=new Game(),catalogo=criarBestiario(g.mobs.values());
  for(const m of catalogo){
    assert.deepEqual(m.zeni,m.raro?[100,100]:[5,9]);
    assert.deepEqual(m.drops.map(d=>d.item),['scrap','crystal','seed15']);
    assert.equal(m.drops[0].fracaoLoot+m.drops[1].fracaoLoot,1);
    assert.equal(m.drops[2].chance,.008);
  }
});

test('API de bestiário é somente leitura e não expõe posições, jogadores ou saves', async () => {
  const app=await createGameServer({port:0,dataDir:null});
  try{
    const mobs=JSON.stringify([...app.game.mobs.values()]);
    const r=await fetch('http://127.0.0.1:'+app.port+'/api/bestiario');assert.equal(r.status,200);
    const {inimigos}=await r.json();assert.equal(inimigos.length,21);
    for(const m of inimigos){assert.equal(m.x,undefined);assert.equal(m.y,undefined);assert.equal(m.inventory,undefined);}
    assert.equal(JSON.stringify([...app.game.mobs.values()]),mobs);
  }finally{await app.close();}
});
