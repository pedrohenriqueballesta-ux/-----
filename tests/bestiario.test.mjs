import {criarSessaoTeste,reentrarSessaoTeste} from './auth-helper.mjs';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { dropsEspecificos } from '../public/shared/sistemas/catalogo-itens.mjs';
import { criarBestiario } from '../public/shared/sistemas/bestiario.mjs';
import { mobStats, janelaRenascimento } from '../public/shared/nucleo/enemies.mjs';
import { areaPorId, lugar } from '../public/shared/nucleo/config.mjs';
import { RECOMPENSAS_MOBS, faixaZeniMob, fracaoCristalAzul } from '../public/shared/sistemas/recompensas-mobs.mjs';
import { createGameServer } from '../server.mjs';

test('catálogo cobre todas as espécies/locais do mundo, inclusive chefes ainda mortos', () => {
  const g=new Game(),catalogo=criarBestiario(g.mobs.values());
  const especies=new Set([...g.mobs.values()].map(m=>m.area+':'+m.type));
  assert.deepEqual(new Set(catalogo.map(m=>m.id)),especies);
  assert.equal(catalogo.length,44); // Três fichas novas da Cratera de Nail (Pedro, 09/11); Pássaro e Inseto provisórios no Descampado da Terra (22/11).
  assert.ok(!catalogo.some(m=>m.tipo==='oozaruSuper'),'espécie reservada não aparece como encontrada no mundo');
  for(const m of catalogo){
    const stats=mobStats(m.tipo,m.area);assert.equal(m.hp,stats.hp);assert.equal(m.ataque,stats.attack);assert.equal(m.defesa,stats.defesa);assert.equal(m.xp,stats.xp);
    assert.equal(m.nivel,stats.level,'nível-base usado pela redução de XP');
    assert.deepEqual(m.recomendado,areaPorId(m.area).nivel);
    const respawn = janelaRenascimento(m.tipo, m.area);
    assert.deepEqual(m.renascimento,[respawn.minimo,respawn.maximo]);
  }
  const freeza=catalogo.find(m=>m.tipo==='freezaBoss');assert.ok(freeza.raro);assert.match(freeza.observacoes.join(' '),/40%/);
  for(const m of g.mobs.values())m.hp=1;
  assert.deepEqual(criarBestiario(g.mobs.values()),catalogo,'HP atual não contamina atributos de referência');
});

test('drops e Zeni do catálogo mostram recompensas e chances do servidor', () => {
  assert.deepEqual(RECOMPENSAS_MOBS,{zeniMinimo:5,zeniVariacao:5,fracaoCristal:.16,chanceSemente15:.008});
  assert.deepEqual(faixaZeniMob(25),[5,9]);
  assert.deepEqual(faixaZeniMob(100),[37,41]);
  assert.deepEqual(faixaZeniMob(150,true),[750,750]);
  const g=new Game(),catalogo=criarBestiario(g.mobs.values());
  for(const m of catalogo){
    assert.deepEqual(m.zeni,faixaZeniMob(m.nivel,m.raro));
    assert.deepEqual(m.drops.slice(0,3).map(d=>d.item),['scrap','cristal-azul','seed15']);
    assert.deepEqual(m.drops.slice(3),dropsEspecificos(m.tipo));
    assert.equal(m.drops[0].fracaoLoot+m.drops[1].fracaoLoot,1);
    assert.equal(m.drops[1].fracaoLoot,fracaoCristalAzul(m.tipo));
    assert.equal(m.drops.filter(d => d.item === 'cristal-azul').length,1);
    assert.equal(m.drops[2].chance,.008);
  }
});

test('Porunga BOSS e Oozaru Dourado pagam a recompensa exibida e garantem materiais mesmo com sorteio alto', () => {
  for (const [tipo, area, materiais] of [
    ['boss', 'dificil', ['cristal-esmeralda', 'garra-porunga']],
    ['oozaruDourado', 'vegeta-lava', ['cristal-vermelho', 'pele-oozaru', 'presa-oozaru']],
  ]) {
    const game = new Game({ now: 1000, populate: false, random: () => .999 });
    const p = game.addPlayer('teste', 'Teste');
    game.levar(p, lugar(area));
    p.x += 180;
    const chefe = game.addMob(tipo, p.x + 50, p.y, area);
    chefe.raro = true;
    const [ficha] = criarBestiario([chefe]);
    assert.ok(ficha.zeni[0] > faixaZeniMob(chefe.level)[1]);
    assert.ok(ficha.drops.some(d => d.chance < 1 && d.chance > .1 &&
      ['capa-piccolo','armadura-vegeta'].includes(d.item)));
    const saldo = p.zeni;
    assert.equal(game.hit(p, chefe, 1e7), true);
    assert.equal(p.zeni - saldo, ficha.zeni[0]);
    assert.ok(game.events.some(e => e.type === 'message' && e.text.includes(ficha.zeni[0].toLocaleString('pt-BR') + ' Zeni')));
    for (const item of materiais) {
      assert.equal(ficha.drops.find(d => d.item === item).chance, 1);
      assert.equal(game.loot.filter(d => d.owner === p.id && d.item === item).length, 1);
    }
  }
});

test('API de bestiário é somente leitura e não expõe posições, jogadores ou saves', async () => {
  const app=await createGameServer({port:0,dataDir:null});
  try{
    const mobs=JSON.stringify([...app.game.mobs.values()]);
    const sessao=await criarSessaoTeste('http://127.0.0.1:'+app.port,'Bestiario');const r=await fetch('http://127.0.0.1:'+app.port+'/api/bestiario',{headers:{Authorization:'Bearer '+sessao.token}});assert.equal(r.status,200);
    const {inimigos}=await r.json();assert.equal(inimigos.length,44);
    for(const m of inimigos){assert.equal(m.x,undefined);assert.equal(m.y,undefined);assert.equal(m.inventory,undefined);}
    assert.equal(JSON.stringify([...app.game.mobs.values()]),mobs);
  }finally{await app.close();}
});
