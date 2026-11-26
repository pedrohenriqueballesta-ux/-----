import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarItensCatalogo } from '../public/render/hud/catalogo-itens-hud.mjs';
import { existsSync } from 'node:fs';
import { NOVOS_ITENS, SET_INICIAL, RECOMPENSA_PATRULHA, dropsEspecificos, descricaoItem } from '../public/shared/sistemas/catalogo-itens.mjs';
import { ITENS_NEGOCIAVEIS } from '../public/shared/sistemas/itens-negociaveis.mjs';
import { criarBestiario } from '../public/shared/sistemas/bestiario.mjs';
import { CONFIG, MERCHANT, lugar } from '../public/shared/nucleo/config.mjs';
import { bagWeight, statsFor } from '../public/shared/nucleo/characters.mjs';
import { Game } from '../public/shared/nucleo/game.mjs';

test('catálogo integra os 99 ícones, pesos, descrições e preços sem mudar os consumíveis antigos', () => {
  const itens = Object.values(NOVOS_ITENS);
  assert.equal(itens.length, 99);   // + Carne de Dinossauro e Bilhete do Laboratório (Terra Selvagem, 25/11/2026)
  assert.equal(itens.filter(i => i.tipo === 'material').length, 16);
  assert.equal(itens.filter(i => i.tipo === 'consumivel').length, 4);
  assert.equal(itens.filter(i => i.tipo === 'equipamento').length, 79);
  for (const item of itens) {
    assert.ok(existsSync(new URL('../public' + item.icone, import.meta.url)), item.id);
    assert.equal(item, ITENS_NEGOCIAVEIS[item.id]);
    assert.ok(item.precoReferencia > item.precoNpc && item.precoNpc > 0);
    assert.equal(CONFIG.itemWeights[item.id], item.peso);
    assert.match(descricaoItem(item), / kg/);
    if (item.slot) {
      assert.ok(item.kiPorSegundo > 0);
      assert.match(descricaoItem(item), /Defesa.*Ki\/s/);
    }
  }
  assert.ok(NOVOS_ITENS['botas-vegeta'].peso < NOVOS_ITENS['armadura-vegeta'].peso);
  assert.ok(NOVOS_ITENS['botas-vegeta'].kiPorSegundo > NOVOS_ITENS['armadura-vegeta'].kiPorSegundo);
  assert.ok(NOVOS_ITENS['calca-goku'].defesa > NOVOS_ITENS['calca-shin-elite'].defesa);
  assert.equal(CONFIG.itemWeights.ki, .2);
});

test('criação entrega o conjunto inicial uma vez e reconexão preserva peças e materiais', () => {
  const game = new Game({ populate: false });
  const novo = game.addPlayer('novo', 'Vegeta', { level: 1, vocacao: 'vegeta' });
  assert.deepEqual(novo.equipamentos, SET_INICIAL);
  assert.ok(game.addItem(novo, 'fruta-namek', 2));
  assert.ok(game.action(novo.id, { type: 'desequiparItem', slot: 'botas', item: SET_INICIAL.botas }).ok);
  const salvo = game.addPlayer('salvo', novo.name, JSON.parse(JSON.stringify(game.exportPlayer(novo))));
  assert.equal(salvo.equipamentos.botas, undefined);
  assert.equal(salvo.inventory[SET_INICIAL.botas], 1);
  assert.equal(salvo.inventory['fruta-namek'], 2);
  const legado = game.addPlayer('legado', 'Goku', { level: 5, inventory: { food: 11 } });
  assert.deepEqual(legado.equipamentos, {});
  assert.equal(legado.inventory.food, 11);
  const legadoSemInventario = game.addPlayer('antigo', 'Goku', { level: 40 });
  assert.deepEqual(legadoSemInventario.equipamentos, {});
});

test('personagem existente recebe o conjunto uma vez mesmo com a mochila acima do limite', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('existente', 'Vegeta', {
    level: 77, vocacao: 'vegeta', mercadoId: 'conta77', zeni: 14567,
    inventory: { food: 500, ki: 141 }, equipamentos: {}
  });
  assert.deepEqual(p.equipamentos, SET_INICIAL);
  assert.equal(p.level, 77);
  assert.equal(p.zeni, 14567);
  assert.equal(p.inventory.food, 500);
  assert.ok(bagWeight(p.inventory) > p.stats.capacity);
  const salvo = game.exportPlayer(p);
  assert.equal(salvo.setInicialProcessado, true);
  salvo.equipamentos = {};
  assert.deepEqual(game.addPlayer('retorno', 'Vegeta', salvo).equipamentos, {});

  const ocupado = game.addPlayer('ocupado', 'Goku', {
    level: 150, mercadoId: 'conta150', inventory: {}, equipamentos: { peito: 'armadura-vegeta' }
  });
  assert.deepEqual(ocupado.equipamentos, { ...SET_INICIAL, peito: 'armadura-vegeta' });
  const anterior = game.addPlayer('anterior', 'Goku', {
    level: 100, mercadoId: 'conta100', inventory: { 'camisa-inicial': 1 }, equipamentos: {}
  });
  assert.deepEqual(anterior.equipamentos, {});
  assert.equal(anterior.inventory['camisa-inicial'], 1);
});

test('equipar valida nível, combina sets, aplica atributos e restaura Ki durante a transformação', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('goku', 'Goku', { level: 248, inventory: {
    'armadura-shin-elite': 1, 'calca-goku': 1, 'botas-vegeta': 1, 'espada-z': 1, 'bastao-magico': 1
  } });
  const equipar = item => game.action(p.id, { type: 'equiparItem', item });
  assert.equal(equipar('espada-z').ok, false);
  assert.equal(p.inventory['espada-z'], 1);
  for (const id of ['armadura-shin-elite', 'calca-goku', 'botas-vegeta', 'bastao-magico']) assert.ok(equipar(id).ok);
  assert.equal(p.stats.defense, statsFor(p.level).defense + 35 + 23 + 17 + 1);
  assert.equal(p.stats.attack, statsFor(p.level).attack + 7);
  assert.equal(p.inventory['calca-goku'], 0);
  assert.ok(game.action(p.id, { type: 'transform', forma: 'ssj' }).ok);
  p.ki = 20;
  game.updatePlayer(p, 1);
  assert.ok(Math.abs(p.ki - (20 + p.stats.kiEquipamento - CONFIG.transformacao.drenoKi)) < 1e-9);
  p.ki = p.stats.ki - 1;
  game.updatePlayer(p, 1);
  assert.equal(p.ki, p.stats.ki);
  const salvo = game.addPlayer('salvo', 'Goku', game.exportPlayer(p));
  assert.deepEqual(salvo.equipamentos, p.equipamentos);
  assert.deepEqual(salvo.stats, p.stats);
});

test('God Mode permite equipar no nível ativo e suspende o bônus ao restaurar o nível real', () => {
  const g = new Game({ populate: false });
  const item = NOVOS_ITENS['armadura-vegeta'];
  const p = g.addPlayer('teste', 'Vegeta', { vocacao: 'vegeta', level: 60,
    inventory: { [item.id]: 1 }, equipamentos: {} });
  const equipar = () => g.action(p.id, { type: 'equiparItem', item: item.id, slot: item.slot });
  const configurarNivel = level => g.action(p.id, {
    type: 'godmodeConfig', options: { ...p.godmodeOptions, level }
  });

  assert.equal(equipar().ok, false);
  assert.ok(configurarNivel(item.nivel - 1).ok);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  assert.equal(equipar().ok, false);
  assert.ok(configurarNivel(item.nivel).ok);
  assert.ok(equipar().ok);
  assert.equal(p.stats.defense, statsFor(item.nivel, p.vocacao).defense + item.defesa);
  assert.equal(p.stats.kiEquipamento, item.kiPorSegundo);

  const volta = g.addPlayer('volta', 'Vegeta', JSON.parse(JSON.stringify(g.exportPlayer(p))));
  assert.equal(volta.levelReal, 60);
  assert.equal(volta.stats.kiEquipamento, item.kiPorSegundo);
  assert.ok(configurarNivel(item.nivel - 1).ok);
  assert.equal(p.stats.defense, statsFor(p.level, p.vocacao).defense);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  assert.equal(p.level, 60);
  assert.equal(p.equipamentos[item.slot], item.id);
  assert.equal(p.stats.defense, statsFor(60, p.vocacao).defense);
  assert.equal(p.stats.kiEquipamento ?? 0, 0);
  assert.ok(g.action(p.id, { type: 'desequiparItem', item: item.id, slot: item.slot }).ok);
  assert.equal(p.inventory[item.id], 1);
});

test('arrasto usa o encaixe correto, consome a pilha escolhida e respeita o destino da mochila', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('arrasto', 'Vegeta', { level: 150, inventory: { 'armadura-vegeta': 2, food: 1 },
    equipamentos: { peito: 'camisa-inicial' }, slots: [null, { item: 'armadura-vegeta', qty: 1 },
      { item: 'armadura-vegeta', qty: 1 }, { item: 'food', qty: 1 }] });
  const equipar = slot => game.action(p.id, { type: 'equiparItem', slot, item: 'armadura-vegeta', de: 1 });
  assert.equal(equipar('botas').ok, false);
  assert.equal(equipar('peito').ok, true);
  assert.deepEqual(p.slots[1], { item: 'camisa-inicial', qty: 1 });
  assert.deepEqual(p.slots[2], { item: 'armadura-vegeta', qty: 1 });
  const retirar = para => game.action(p.id, { type: 'desequiparItem', slot: 'peito', item: 'armadura-vegeta', para });
  assert.equal(retirar(3).ok, false);
  assert.equal(retirar(9).ok, true);
  assert.deepEqual(p.slots[9], { item: 'armadura-vegeta', qty: 1 });
  assert.equal(p.equipamentos.peito, undefined);
});

test('venda e market tratam somente as cópias na mochila e usam pesos e preços do catálogo', () => {
  const game = new Game({ populate: false });
  const a = game.addPlayer('a', 'Goku', { level: 150, inventory: { 'armadura-vegeta': 2, 'fruta-namek': 2 } });
  const b = game.addPlayer('b', 'Vegeta', { level: 150, zeni: 5000, inventory: {} });
  Object.assign(a, MERCHANT); Object.assign(b, MERCHANT);
  assert.ok(game.action(a.id, { type: 'equiparItem', item: 'armadura-vegeta' }).ok);
  assert.equal(game.venderItem(a, 'armadura-vegeta', 2).ok, false);
  assert.equal(game.venderItem(a, 'fruta-namek', 2).total, 2 * NOVOS_ITENS['fruta-namek'].precoNpc);
  const anuncio = game.mercado.anunciar(a, { item: 'armadura-vegeta', quantidade: 1, preco: 999 }, 1);
  assert.ok(anuncio.ok);
  b.stats.capacity = 6;
  assert.equal(game.mercado.comprar(b, { id: anuncio.id, quantidade: 1 }).ok, false);
  b.stats.capacity = 20;
  assert.ok(game.mercado.comprar(b, { id: anuncio.id, quantidade: 1 }).ok);
  assert.equal(bagWeight(b.inventory), NOVOS_ITENS['armadura-vegeta'].peso);
  assert.equal(a.equipamentos.peito, 'armadura-vegeta');
});

test('mochila cheia recusa novos tipos e troca reaproveitando a vaga da peça retirada', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('a', 'Goku', { level: 240, inventory: { 'armadura-vegeta': 1 }, equipamentos: { peito: 'camisa-inicial' } });
  for (const item of Object.values(NOVOS_ITENS).filter(i => !['armadura-vegeta', 'camisa-inicial'].includes(i.id)).slice(0, 29)) {
    assert.ok(game.addItem(p, item.id));
  }
  assert.equal(game.addItem(p, 'camisa-inicial'), false);
  assert.equal(game.action(p.id, { type: 'desequiparItem', slot: 'peito', item: 'camisa-inicial' }).ok, false);
  assert.ok(game.action(p.id, { type: 'equiparItem', item: 'armadura-vegeta' }).ok);
  assert.equal(p.equipamentos.peito, 'armadura-vegeta');
  assert.equal(p.inventory['camisa-inicial'], 1);
  assert.equal(p.slots.filter(Boolean).length, CONFIG.mochilaSlots);
});

test('drop é sorteado no abate e chances por espécie coincidem com o Bestiário', () => {
  const game = new Game({ populate: false, random: () => 0 });
  const p = game.addPlayer('a');
  game.levar(p, lugar('inicial'));
  p.x = 3300; p.y = 2150;
  const mob = game.addMob('inseto', p.x + 40, p.y, p.area);
  assert.ok(game.hit(p, mob, 1e6));
  assert.ok(game.loot.some(l => l.item === 'asas-namek' && l.owner === p.id));
  assert.ok(game.loot.some(l => l.item === 'ferrao-namek'));
  assert.equal(game.loot.some(l => l.item === 'armadura-cell'), false);
  assert.equal(criarBestiario([mob])[0].drops.find(i => i.item === 'asas-namek').chance, .36);
  const chance = mob => dropsEspecificos(mob).find(i => i.item === 'armadura-saiyajin').chance;
  assert.notEqual(chance('nappa'), chance('raditz'));
  assert.notEqual(chance('raditz'), chance('bardock'));
});

test('missão Primeira patrulha concede as duas peças juntas e uma vez', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('a', 'Goku', { level: 5 });
  const resgatar = () => game.action(p.id, { type: 'resgatarMissao', id: 'patrulha-inicial' });
  p.kills = 11;
  assert.equal(resgatar().ok, false);
  p.kills = 12;
  assert.ok(resgatar().ok);
  assert.equal(resgatar().ok, false);
  for (const [id, quantidade] of Object.entries(RECOMPENSA_PATRULHA)) assert.equal(p.inventory[id], quantidade);
});

test('materiais sustentam o loot das espécies ativas e as peças fortes de Freeza são exclusivas do chefe', () => {
  const g = new Game();
  for (const tipo of new Set([...g.mobs.values()].map(mob => mob.type))) {
    assert.ok(dropsEspecificos(tipo).some(({ item }) => !NOVOS_ITENS[item].slot), tipo);
  }
  for (const id of ['armadura-freeza', 'botas-freeza', 'capacete-freeza']) {
    assert.deepEqual(Object.keys(NOVOS_ITENS[id].origem.drops), ['freezaBoss']);
    assert.ok(dropsEspecificos('freezaBoss').some(drop => drop.item === id));
  }
  for (const tipo of ['dodoria', 'zarbon']) {
    assert.ok(dropsEspecificos(tipo).some(drop => drop.item === 'saia-freeza'));
  }
  assert.deepEqual(NOVOS_ITENS['manto-rasgado'].origem.drops, { piccoloDaimaoh: .07, nail: .03 });
});

test('comida automática só consome com HP abaixo do limite e cobra um único uso', () => {
  const g = new Game({ populate: false, now: 1000 });
  const p = g.addPlayer('caca', 'Goku', { level: 15, autoFood: true, autoHeal: false });
  g.levar(p, lugar('inicial'));
  Object.assign(p, { x: 3300, y: 2150, autoHunt: true });
  const estoque = p.inventory.food;
  p.hp = p.stats.hp * .91;
  g.updatePlayer(p, 0);
  assert.equal(p.inventory.food, estoque);
  p.hp = p.stats.hp * CONFIG.autoFoodLimiteHp;
  g.updatePlayer(p, 0);
  g.updatePlayer(p, 0);
  assert.equal(p.inventory.food, estoque - 1);
  assert.equal(g.snapshot(p.id).self.huntAnalyzer.gastos, CONFIG.prices.food);
});

test('lucro da caça considera custo dos consumíveis e mostra equipamentos à parte', () => {
  const g = new Game({ populate: false, now: 1000 });
  const p = g.addPlayer('caca', 'Goku', { level: 35 });
  p.huntAnalyzer = {
    segundos: 60, xp: 0, zeni: 60, loot: { 'manto-rasgado': 2, 'capa-piccolo': 1 }, supplies: { food: 1, ki: 2 }
  };
  const r = g.snapshot(p.id).self.huntAnalyzer;
  assert.equal(r.valorMateriais, 84);
  assert.equal(r.valorEquipamentos, ITENS_NEGOCIAVEIS['capa-piccolo'].precoNpc);
  assert.equal(r.saldoSemEquipamentos, 60 + 84 - CONFIG.prices.food - CONFIG.prices.ki * 2);
  assert.equal(r.saldo, r.saldoSemEquipamentos + r.valorEquipamentos);
});


test('Vender Tudo liquida só itens comuns, incomuns e raros da mochila pelo preço do NPC', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('vendas', 'Goku', { level: 160, zeni: 200, equipamentos: { peito:'armadura-bardock' },
    inventory:{ scrap:2, crystal:1, 'asas-namek':3, 'cristal-azul':2, 'manto-rasgado':4,
      'armadura-bardock':1, 'bastao-magico':1, 'armadura-freeza':1, 'brincos-potara':1, food:2, 'fruta-namek':5 } });
  Object.assign(p, MERCHANT);
  const selecionados = { scrap:2, 'asas-namek':3, 'cristal-azul':3, 'manto-rasgado':4,
    'armadura-bardock':1, 'bastao-magico':1 };
  const total = Object.entries(selecionados).reduce((s,[id,qtd]) => s + ITENS_NEGOCIAVEIS[id].precoNpc * qtd, 0);
  assert.equal(game.action(p.id,{ type:'sell' }).total, total);
  assert.equal(p.zeni, 200+total);
  for (const id of Object.keys(selecionados)) assert.equal(p.inventory[id],0);
  assert.equal(p.equipamentos.peito,'armadura-bardock');
  for (const id of ['armadura-freeza','brincos-potara']) assert.equal(p.inventory[id],1);
  assert.equal(p.inventory.food,2);
  assert.equal(p.inventory['fruta-namek'],5);
  assert.equal(game.action(p.id,{ type:'sell' }).ok,false);
  assert.ok(p.slots.every(slot => !slot || p.inventory[slot.item] > 0));
});

test('a seleção recusa lotes inválidos inteiros e vende exatamente a quantidade selecionada', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('selecao','Goku',{ zeni: 9999990, inventory:{ crystal:4,scrap:5,'fruta-namek':3,'armadura-freeza':1 } });
  const vender = itens => game.action(p.id,{ type:'venderSelecionados',itens });
  assert.equal(vender({scrap:1}).ok,false);
  Object.assign(p, MERCHANT);
  for (const itens of [{'cristal-azul':1},{scrap:1,'fruta-namek':1},{scrap:1,'armadura-freeza':1},{scrap:6},{scrap:-2},{'cristal-azul':1.5},['cristal-azul'],null]) {
    assert.equal(vender(itens).ok,false);
    assert.equal(p.zeni,9999990);
    assert.equal(p.inventory.scrap,5);
    assert.equal(p.inventory['cristal-azul'],4);
  }
  p.zeni=100;
  const r=vender({'cristal-azul':2,scrap:1});
  assert.deepEqual(r,{ok:true,quantidade:3,total:50});
  assert.equal(p.zeni,150);
  assert.equal(p.inventory['cristal-azul'],2);
  assert.equal(p.inventory.scrap,4);
});


test('cristal roxo legado migra para Cristal Azul na mochila e nos anúncios', () => {
  const g = new Game({ populate: false });
  const salvo = { inventory: { crystal: 99999, 'cristal-azul': 99999 },
    slots: [{ item: 'crystal', qty: 99999 }, { item: 'cristal-azul', qty: 99999 }] };
  const p = g.addPlayer('legado-cristais', 'Goku', salvo);
  assert.equal(ITENS_NEGOCIAVEIS.crystal, undefined);
  assert.equal(ITENS_NEGOCIAVEIS['cristal-azul'].raridade, 'comum');
  assert.equal(p.inventory.crystal, undefined);
  assert.equal(p.inventory['cristal-azul'], 199998);
  assert.deepEqual(p.slots.slice(0, 2), [
    { item: 'cristal-azul', qty: 99999 }, { item: 'cristal-azul', qty: 99999 }
  ]);
  const retorno = g.addPlayer('retorno-cristais', p.name, g.exportPlayer(p));
  assert.equal(retorno.inventory['cristal-azul'], 199998);

  g.mercado.restaurar({ ofertas: [
    { id: 'oferta-1', item: 'crystal', vendedorId: p.mercadoId, vendedor: p.name, quantidade: 2, preco: 15, criadoEm: 1000 }
  ] });
  const comprador = g.addPlayer('comprador-cristais');
  Object.assign(comprador, MERCHANT);
  assert.equal(g.mercado.comprar(comprador, { id: 'oferta-1', quantidade: 2 }).total, 30);
  assert.equal(comprador.inventory['cristal-azul'], 2);
  assert.equal(g.mercado.resumo(p).saldo, 30);
});

test('catálogo combina busca sem acento, categoria e raridade com as ordens disponíveis', () => {
  const itens = Object.values(ITENS_NEGOCIAVEIS);
  const botas = filtrarItensCatalogo(itens, { busca:'BOTAS', raridade:'epico', tipo:'botas' });
  assert.ok(botas.length > 1);
  assert.ok(botas.every(i => i.slot === 'botas' && i.raridade === 'epico'));
  assert.deepEqual(filtrarItensCatalogo(itens, { busca:'botas', raridade:'epico', tipo:'botas', ordem:'za' }), [...botas].reverse());
  assert.ok(filtrarItensCatalogo(itens, { busca:'Pocao de Energia', tipo:'consumivel' }).some(i => i.id === 'pocao-energia'));
  assert.ok(filtrarItensCatalogo(itens, { tipo:'consumivel', raridade:'sem-raridade' }).some(i => i.id === 'food'));
  assert.equal(filtrarItensCatalogo(itens, { ordem:'raridade' })[0].raridade, 'lendario');
  assert.ok(filtrarItensCatalogo(itens, { tipo:'calca', busca:'Calcas' }).every(i => i.slot === 'calca'));
  assert.deepEqual(filtrarItensCatalogo(itens, { busca:'armadura inexistente' }), []);
});

test('faixa permanece em cinto e proteção de Freeza migra sem substituir as calças', () => {
 const g = new Game({ populate: false });
 const a = g.addPlayer('luvas', 'Goku', { level: 120, equipamentos: { braco: 'faixa-treino' } });
 assert.equal(a.equipamentos.cinto, 'faixa-treino');
 assert.equal(a.equipamentos.braco, undefined);
 const b = g.addPlayer('calcas', 'Goku', {
  level: 120, equipamentos: { cinto: 'saia-freeza', calca: SET_INICIAL.calca }
 });
 assert.equal(b.equipamentos.calca, SET_INICIAL.calca);
 assert.equal(b.equipamentos.cinto, undefined);
 assert.equal(b.inventory['saia-freeza'], 1);
});
