import {criarSessaoTeste} from './auth-helper.mjs';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { dropsEspecificos } from '../public/shared/sistemas/catalogo-itens.mjs';
import { CHEFES_PESSOAIS_BESTIARIO } from '../public/shared/sistemas/progresso-bestiario.mjs';
import { bestiarioDoPersonagem, criarBestiario } from '../public/shared/sistemas/bestiario.mjs';
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
    assert.equal(ficha.abatesParaDrops, 1);
    const saldo = p.zeni;
    assert.equal(game.hit(p, chefe, 1e7), true);
    assert.deepEqual(bestiarioDoPersonagem([ficha], p)[0].drops, ficha.drops);
    assert.equal(p.zeni - saldo, ficha.zeni[0]);
    assert.ok(game.events.some(e => e.type === 'message' && e.text.includes(ficha.zeni[0].toLocaleString('pt-BR') + ' Zeni')));
    for (const item of materiais) {
      assert.equal(ficha.drops.find(d => d.item === item).chance, 1);
      assert.equal(game.loot.filter(d => d.owner === p.id && d.item === item).length, 1);
    }
  }
});

test('API oculta atributos e chances até os abates exigidos e separa personagens e hunts', async () => {
  const app = await createGameServer({ port: 0, dataDir: null });
  try {
    const base = 'http://127.0.0.1:' + app.port;
    const catalogo = criarBestiario([...app.game.mobs.values(), ...CHEFES_PESSOAIS_BESTIARIO]);
    const r = await fetch(base + '/api/bestiario');
    assert.equal(r.status, 401);
    const sessao = await criarSessaoTeste(base, 'Bestiario');
    const outraSessao = await criarSessaoTeste(base, 'Outra Ficha');
    const p = app.game.players.get(sessao.playerId);
    const chave = 'inicial:inseto';
    const headers = token => ({ Authorization: 'Bearer ' + token });
    async function carregar(token = sessao.token) {
      const resposta = await fetch(base + '/api/bestiario', { headers: headers(token) });
      assert.equal(resposta.status, 200);
      assert.equal(resposta.headers.get('cache-control'), 'no-store');
      const { inimigos, revisao } = await resposta.json();
      assert.equal(inimigos.length, catalogo.length);
      for (const m of inimigos) {
        assert.ok(!('x' in m) && !('y' in m) && !('inventory' in m));
      }
      return { inimigos, ficha: inimigos.find(m => m.id === chave), revisao };
    }
    const { ficha: bloqueada } = await carregar();
    assert.deepEqual(Object.keys(bloqueada).sort(), [
      'abates', 'abatesParaDrops', 'id', 'local', 'nome', 'nomePlaneta', 'planeta', 'recomendado', 'tipo'
    ]);
    assert.equal(bloqueada.abates, 0);
    assert.equal(bloqueada.abatesParaDrops, 50);

    app.game.levar(p, lugar('inicial'));
    p.x += 180;
    const mob = app.game.addMob('inseto', p.x + 50, p.y, p.area);
    function abater(atacante = p) {
      mob.hp = mob.maxHp;
      assert.equal(app.game.hit(atacante, mob, 1e7, { credito: p }), true);
      assert.equal(mob.hp, 0);
    }
    p.godmode = true;
    abater();
    p.godmode = false;
    mob.teste = true;
    abater();
    mob.teste = false;
    assert.equal((await carregar()).ficha.abates, 0);

    abater({ ...p, id: 'clone-de-teste' });
    const { ficha: revelada, revisao } = await carregar();
    assert.equal(revelada.abates, 1);
    assert.equal(revisao, 1);
    assert.equal(revelada.hp, mob.maxHp);
    assert.equal(revelada.ataque, mob.attack);
    assert.ok(!('drops' in revelada));
    assert.equal((await carregar(outraSessao.token)).ficha.abates, 0);
    assert.ok((await carregar()).inimigos.filter(m => m.tipo === mob.type && m.id !== chave).every(m => !m.abates));

    for (let i = 1; i < 49; i++) abater();
    const { ficha: quase } = await carregar();
    assert.equal(quase.abates, 49);
    assert.ok(!('drops' in quase));

    abater();
    const { ficha: completa } = await carregar();
    assert.equal(completa.abates, 50);
    assert.deepEqual(completa.drops, catalogo.find(m => m.id === chave).drops);

    const salvo = JSON.parse(JSON.stringify(app.game.exportPlayer(p)));
    const restaurado = new Game({ populate: false }).addPlayer('restaurado', p.name, salvo);
    assert.deepEqual(bestiarioDoPersonagem(catalogo, restaurado).find(m => m.id === chave), completa);
  } finally {
    await app.close();
  }
});

test('chefes de saga com vitória antiga ficam completos mesmo em saves sem contagem', () => {
  const g = new Game({ populate: false });
  const p = g.addPlayer('antigo', 'Antigo', { sagaCell: { etapa: 4 }, sagaAndroides: { venceuInfernal: true } });
  const catalogo = criarBestiario(CHEFES_PESSOAIS_BESTIARIO);
  const fichas = bestiarioDoPersonagem(catalogo, p);
  assert.equal(fichas.filter(m => m.tipo === 'cellSemiperfeito' && m.drops).length, 2);
  assert.ok(fichas.find(m => m.tipo === 'c17Infernal').drops);
  assert.equal(fichas.find(m => m.tipo === 'cellPerfeito').abates, 0);
  assert.equal(fichas.find(m => m.tipo === 'superC17').abatesParaDrops, 1);
});

test('subchefes revelam a ficha completa no primeiro abate', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('teste', 'Teste');
  game.levar(p, lugar('media'));
  p.x += 180;
  const mob = game.addMob('subboss', p.x + 50, p.y, p.area);
  const catalogo = criarBestiario([mob]);
  const [bloqueada] = bestiarioDoPersonagem(catalogo, p);
  assert.ok(!('hp' in bloqueada) && !('drops' in bloqueada));
  assert.equal(game.hit(p, mob, 1e7), true);
  const [revelada] = bestiarioDoPersonagem(catalogo, p);
  assert.equal(revelada.abates, 1);
  assert.equal(revelada.hp, mob.maxHp);
  assert.deepEqual(revelada.drops, catalogo[0].drops);
});
