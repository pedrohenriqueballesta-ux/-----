import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { Game } from '../public/shared/nucleo/game.mjs';
import { MERCHANT, lugar } from '../public/shared/nucleo/config.mjs';
import { bagWeight, statsFor } from '../public/shared/nucleo/characters.mjs';
import { COLECIONAVEIS, PRODUTOS_STORE, recompensaPasse } from '../public/shared/sistemas/premium-config.mjs';
import { DURACAO_POCAO_XP } from '../public/shared/sistemas/bonus-premium.mjs';
import { DURACAO_EXTENSOR } from '../public/shared/sistemas/itens-premium.mjs';
import { EconomiaPremium } from '../server/premium.mjs';

function cena() {
  const g = new Game({ populate: false, now: 1000 });
  let agora = Date.parse('2026-11-24T13:00:00Z');
  g.agora = () => agora;
  const economia = new EconomiaPremium({ agora: g.agora, ambiente: 'development' });
  const a = { id: 'conta', premium: { saldo: 2000 } };
  const p = g.addPlayer('teste', 'Teste', { level: 50 });
  const preparar = id => economia.preparar(a, p, id);
  const confirmar = q => economia.confirmar(a, p, q.cotacao.id);
  const comprar = id => {
    const q = preparar(id);
    assert.ok(q.ok, q.reason);
    const resposta = confirmar(q);
    assert.ok(resposta.ok, resposta.reason);
    return q;
  };
  return { g, p, a, economia, preparar, confirmar, comprar, avancar: ms => { agora += ms; } };
}

test('três potências aplicam XP de abate aditivo com VIP e mantêm a taxa em ganhos fracionários', () => {
  for (const percentual of [10, 15, 20]) {
    const { g, p, comprar, avancar } = cena();
    comprar('vip-15');
    comprar('pocao-xp-' + percentual);
    assert.equal(g.action(p.id, { type: 'usarConsumivel', item: 'pocao-xp-' + percentual }).ok, true);
    g.awardXp(p, 100);
    assert.equal(p.xp, 130, 'VIP em cidade');
    g.levar(p, lugar('inicial'));
    p.autoHunt = true;
    for (let i = 0; i < 10; i++) g.awardXp(p, 10, true);
    assert.equal(p.xp, 260 + percentual);
    assert.equal(g.snapshot(p.id).self.huntAnalyzer.xp, 130 + percentual);
    assert.ok(g.snapshot(p.id).self.perfil.buffs.includes('XP extra atual: +' + (30 + percentual) + '%.'));
    avancar(15 * 86400000);
    g.awardXp(p, 100);
    assert.equal(p.xp, 360 + percentual * 2, 'poção continua após o fim do VIP');
  }
});

test('poção acumula só tempo online e vivo em hunt, inclusive sem Auto Hunt, e restaura a duração', () => {
  const { g, p, a, economia, comprar } = cena();
  comprar('pocao-xp-15');
  assert.equal(g.action(p.id, { type: 'usarConsumivel', item: 'pocao-xp-15' }).ok, true);
  assert.equal(p.bonusPremium.xp.segundos, DURACAO_POCAO_XP);
  g.updatePlayer(p, 100);
  assert.equal(p.bonusPremium.xp.segundos, DURACAO_POCAO_XP);
  assert.match(g.snapshot(p.id).self.perfil.buffs.join(' '), /08:00:00 restantes \(pausada\)/);
  g.levar(p, lugar('inicial'));
  assert.equal(p.autoHunt, false);
  g.updatePlayer(p, 10);
  assert.equal(p.bonusPremium.xp.segundos, DURACAO_POCAO_XP - 10);
  p.connected = false;
  g.updatePlayer(p, 100);
  assert.equal(p.bonusPremium.xp.segundos, DURACAO_POCAO_XP - 10);
  const volta = g.addPlayer('volta', 'Teste', JSON.parse(JSON.stringify(g.exportPlayer(p))));
  economia.vincularVip(a, volta);
  assert.deepEqual(volta.bonusPremium, p.bonusPremium);
  g.levar(volta, lugar('inicial'));
  volta.hp = 0;
  g.updatePlayer(volta, 100);
  assert.equal(volta.bonusPremium.xp.segundos, DURACAO_POCAO_XP - 10);
  volta.hp = volta.stats.hp;
  g.updatePlayer(volta, DURACAO_POCAO_XP - 10);
  assert.equal(volta.bonusPremium.xp, null);
});

test('Store entrega sem ativar, confirma uma vez e valida efeitos apenas no uso', () => {
  const { g, p, a, economia, confirmar, comprar } = cena();
  const usar = item => g.action(p.id, { type: 'usarConsumivel', item });
  const primeira = comprar('pocao-xp-10');
  const saldo = economia.carteira(a).saldo;
  assert.equal(confirmar(primeira).repetida, true);
  assert.equal(economia.carteira(a).saldo, saldo);
  assert.equal(p.inventory['pocao-xp-10'], 1);
  assert.equal(p.bonusPremium.xp, null);
  assert.ok(usar('pocao-xp-10').ok);
  comprar('pocao-xp-20');
  assert.equal(usar('pocao-xp-20').ok, false);
  assert.equal(p.inventory['pocao-xp-20'], 1);

  const capacidade = p.stats.capacity;
  comprar('extensor-mochila-10');
  comprar('extensor-mochila-20');
  assert.equal(p.stats.capacity, capacidade);
  assert.equal(usar('extensor-mochila-10').ok, false);
  assert.ok(g.action(p.id, { type: 'equiparItem', item: 'extensor-mochila-10', slot: 'mochila' }).ok);
  assert.equal(p.stats.capacity, capacidade * 1.1);
  assert.ok(g.action(p.id, { type: 'equiparItem', item: 'extensor-mochila-20', slot: 'mochila' }).ok);
  assert.equal(p.inventory['extensor-mochila-10'], 1);
  g.awardXp(p, 10000);
  assert.equal(p.stats.capacity, statsFor(p.level, p.vocacao).capacity * 1.2);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  const salvo = g.addPlayer('salvo', 'Teste', JSON.parse(JSON.stringify(g.exportPlayer(p))));
  assert.equal(salvo.stats.capacity, p.stats.capacity);
  assert.deepEqual(salvo.inventory, Object.fromEntries(Object.entries(p.inventory).filter(([id, qtd]) => qtd)));
});

test('entrega com mochila cheia sobrevive ao save e é recolhida sem cobrança adicional', () => {
  const { g, p, a, economia, preparar, confirmar } = cena();
  const item = 'pocao-xp-20';
  const q = preparar(item);
  p.stats.capacity = bagWeight(p.inventory);
  const resultado = confirmar(q);
  assert.equal(resultado.transacao.entrega, 'pendente');
  assert.equal(confirmar(q).repetida, true);
  assert.deepEqual(economia.estado(a, p).entregasPremium, { [item]: 1 });
  assert.equal(p.inventory[item], undefined);
  assert.equal(economia.recolherEntrega(p, item).ok, false);
  const volta = g.addPlayer('volta', 'Teste', JSON.parse(JSON.stringify(g.exportPlayer(p))));
  assert.deepEqual(economia.recolherEntrega(volta, item), { ok: true, quantidade: 1 });
  assert.equal(volta.inventory[item], 1);
  assert.equal(volta.bonusPremium.xp, null);
  assert.equal(economia.recolherEntrega(volta, item).ok, false);
  assert.equal(economia.carteira(a).saldo, 1840);
});

test('comprador pode negociar um item inativo no Market e usar o item recebido', () => {
  const { g, p, comprar } = cena();
  const outro = g.addPlayer('mercado', 'Outro');
  for (const personagem of [p, outro]) {
    g.levar(personagem, lugar('vila'));
    Object.assign(personagem, { x: MERCHANT.x, y: MERCHANT.y });
  }
  const item = 'extensor-mochila-10';
  comprar(item);
  assert.equal(g.venderItem(p, item, 1).ok, false);
  const anuncio = g.action(p.id, { type: 'mercadoAnunciar', item, quantidade: 1, preco: 40 });
  assert.ok(anuncio.ok, anuncio.reason);
  assert.equal(g.action(p.id, { type: 'usarConsumivel', item }).ok, false);
  assert.ok(g.action(outro.id, { type: 'mercadoComprar', id: anuncio.id, quantidade: 1 }).ok);
  assert.ok(g.action(outro.id, { type: 'equiparItem', item }).ok);
  assert.equal(outro.equipamentos.mochila, item);
  assert.equal(p.equipamentos.mochila, undefined);
});

test('limpeza de efeitos exige ambiente de desenvolvimento e God Mode e preserva os itens guardados', () => {
  const { g, p, a, economia, comprar } = cena();
  const usar = item => g.action(p.id, { type: 'usarConsumivel', item });
  comprar('vip-15');
  comprar('pocao-xp-15'); assert.ok(usar('pocao-xp-15').ok);
  comprar('extensor-mochila-20'); assert.ok(g.action(p.id, { type: 'equiparItem', item: 'extensor-mochila-20' }).ok);
  comprar('pocao-xp-10');
  assert.ok(g.action(p.id, { type: 'food' }).ok);
  assert.equal(economia.limparEfeitos(a, p).ok, false);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  assert.equal(new EconomiaPremium().limparEfeitos(a, p).ok, false);
  assert.ok(economia.limparEfeitos(a, p).ok);
  assert.equal(economia.carteira(a).vipAte, 0);
  assert.equal(p.vipAte, 0);
  assert.equal(p.foodUntil, 0);
  assert.deepEqual(p.bonusPremium, { xp: null, extensores: {}, capacidadeRetida: 0, restoXp: 0 });
  assert.equal(p.inventory['pocao-xp-10'], 1);
  assert.ok(g.action(p.id, { type: 'godmode' }).ok);
  assert.equal(p.stats.capacity, statsFor(p.level, p.vocacao).capacity);
});

test('benefícios têm ícones próprios e a primeira recompensa do passe aponta para um quadro natalino', () => {
  const iconFiles = PRODUTOS_STORE.filter(p => p.categoria === 'beneficios').map(p => p.imagem);
  const [id] = recompensaPasse(1, 'gratis').colecao;
  assert.equal(id, 'goku-natalino');
  assert.match(COLECIONAVEIS[id].imagem, /goku-natalino-icone\.png$/);
  assert.equal(new Set(iconFiles).size, 5);
  for (const imagem of [...iconFiles, COLECIONAVEIS[id].imagem]) {
    assert.ok(existsSync(new URL('../public' + imagem, import.meta.url)), imagem);
  }
});

test('extensor equipa, pausa fora da sessão, persiste e reduz a capacidade retida ao liberar peso', () => {
 const { g, p, comprar } = cena();
 const id = 'extensor-mochila-20';
 comprar(id);
 assert.ok(g.action(p.id, { type: 'equiparItem', item: id, slot: 'mochila' }).ok);
 assert.equal(g.snapshot(p.id).self.extensorRestante, DURACAO_EXTENSOR);
 g.updatePlayer(p, 5);
 p.connected = false;
 g.updatePlayer(p, 60);
 const salvo = g.addPlayer('salvo', p.name, JSON.parse(JSON.stringify(g.exportPlayer(p))));
 assert.equal(g.snapshot(salvo.id).self.extensorRestante, DURACAO_EXTENSOR - 5);

 salvo.inventory = { 'cristal-azul': 1000, minerio: 32 }; // 97,04 kg, acima da capacidade normal.
 g.levar(salvo, lugar('vila'));
 Object.assign(salvo, { x: MERCHANT.x, y: MERCHANT.y });
 g.updatePlayer(salvo, DURACAO_EXTENSOR - 5);
 assert.equal(salvo.equipamentos.mochila, undefined);
 assert.equal(salvo.stats.capacity, 97.04);
 assert.equal(g.addItem(salvo, 'food'), false);
 assert.ok(g.action(salvo.id, { type: 'venderItem', item: 'minerio', quantidade: 32 }).ok);
 assert.equal(salvo.stats.capacity, 90);
 assert.equal(g.addItem(salvo, 'food'), false);
 const volta = g.addPlayer('volta', p.name, g.exportPlayer(salvo));
 assert.equal(volta.stats.capacity, 90);
 assert.ok(g.action(salvo.id, { type: 'venderItem', item: 'cristal-azul', quantidade: 110 }).ok);
 assert.equal(salvo.stats.capacity, statsFor(salvo.level, salvo.vocacao).capacity);
 assert.equal(salvo.bonusPremium.capacidadeRetida, 0);
 assert.equal(g.addItem(salvo, 'food'), true);
});

test('extensor retirado pausa o tempo e impede anunciar a unidade parcialmente usada', () => {
 const { g, p, comprar } = cena();
 const item = 'extensor-mochila-10';
 comprar(item);
 assert.ok(g.action(p.id, { type: 'equiparItem', item }).ok);
 g.updatePlayer(p, 60);
 assert.ok(g.action(p.id, { type: 'desequiparItem', slot: 'mochila', item }).ok);
 g.levar(p, lugar('vila'));
 Object.assign(p, { x: MERCHANT.x, y: MERCHANT.y });
 g.updatePlayer(p, 60);
 assert.equal(g.action(p.id, { type: 'mercadoAnunciar', item, quantidade: 1, preco: 100 }).ok, false);
 comprar(item);
 assert.ok(g.action(p.id, { type: 'mercadoAnunciar', item, quantidade: 1, preco: 100 }).ok);
 assert.ok(g.action(p.id, { type: 'equiparItem', item }).ok);
 assert.equal(g.snapshot(p.id).self.extensorRestante, DURACAO_EXTENSOR - 60);
});

test('compra em lote fixa quantidade e preço, divide a entrega e não cobra duas vezes', () => {
 const { p, a, economia } = cena();
 const id = 'pocao-xp-20';
 p.stats.capacity = bagWeight(p.inventory) + 0.25;
 assert.equal(economia.preparar(a, p, id, 100).ok, false);
 assert.equal(economia.preparar(a, p, 'vip-15', 2).ok, false);
 const {cotacao} = economia.preparar(a, p, id, 3);
 assert.deepEqual([cotacao.quantidade, cotacao.preco], [3, 480]);
 const {transacao} = economia.confirmar(a, p, cotacao.id);
 assert.deepEqual([transacao.entrega, transacao.mochila, transacao.pendentes], ['parcial', 1, 2]);
 assert.ok(economia.confirmar(a, p, cotacao.id).repetida);
 assert.equal(p.inventory[id], 1);
 assert.equal(p.entregasPremium[id], 2);
 assert.equal(p.bonusPremium.xp, null);
 assert.equal(economia.carteira(a).saldo, 1520);
});
