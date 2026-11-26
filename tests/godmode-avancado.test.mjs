import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG } from '../public/shared/nucleo/config.mjs';
import { GODMODE_CAPACITY, bagWeight, exportPlayer, statsFor } from '../public/shared/nucleo/characters.mjs';
import { ITENS_NEGOCIAVEIS } from '../public/shared/sistemas/itens-negociaveis.mjs';

function cena() {
  const game = new Game({ populate: false });
  const player = game.addPlayer('godmode-test', 'Teste', { level: 12, xp: 9, zeni: 321 });
  return { game, player };
}

test('God Mode aceita nível configurável e alterna HP/Ki sem mexer no progresso real', () => {
  const { game, player } = cena();
  const vidaReal = player.hp, kiReal = player.ki;
  assert.equal(game.action(player.id, { type: 'godmode' }).ok, true);
  assert.equal(player.level, CONFIG.progression.nivelMaximo, 'God Mode começa no teto de nível atual');
  assert.equal(CONFIG.progression.nivelMaximo, 1000, 'usa o teto de progressão recém-integrado');
  assert.equal(game.action(player.id, { type: 'godmodeConfig', options: {
    level: 43, hpInfinite: false, kiInfinite: true, zeniInfinite: false, capacityInfinite: false
  }}).ok, true);
  assert.equal(player.level, 43);
  assert.deepEqual([player.levelReal, player.xpReal], [12, 9]);
  assert.equal(player.hp, statsFor(43).hp);
  assert.equal(player.ki, statsFor(43).ki);
  assert.equal(player.zeni, 321);
  assert.equal(player.stats.capacity, statsFor(43).capacity);

  player.hp = Math.max(1, Math.floor(player.stats.hp / 2));
  player.ki = 10;
  game.tick(0.05);
  assert.ok(player.hp < player.stats.hp, 'HP configurado como finito não deve ser restaurado automaticamente');
  assert.equal(player.ki, player.stats.ki, 'Ki infinito deve continuar cheio');

  assert.equal(game.action(player.id, { type: 'godmodeConfig', options: {
    level: 67, hpInfinite: true, kiInfinite: false, zeniInfinite: true, capacityInfinite: true
  }}).ok, true);
  assert.equal(player.level, 67);
  assert.equal(player.hp, player.stats.hp);
  assert.equal(player.ki, statsFor(67).ki, 'a opção anterior mantinha Ki cheio; o novo limite acompanha o nível');
  assert.equal(player.zeni, 999999999);
  assert.equal(player.stats.capacity, GODMODE_CAPACITY);
  game.awardXp(player, 100000);
  assert.equal(player.level, 67, 'XP de teste não pode substituir o nível definido manualmente');
  assert.equal(player.xp, 0);

  game.action(player.id, { type: 'godmode' });
  assert.deepEqual([player.level, player.xp, player.zeni, player.hp, player.ki], [12, 9, 321, vidaReal, kiReal]);
});

test('God Mode valida configurações e entrega qualquer item do catálogo sem alterar o peso', () => {
  const { game, player } = cena();
  const pesoAntes = bagWeight(player.inventory);
  assert.equal(game.action(player.id, { type: 'godmodeConfig', options: { level: 0 } }).ok, false);
  assert.equal(game.action(player.id, { type: 'godmodeGrantItem', item: 'food', quantidade: 1 }).ok, false);
  game.action(player.id, { type: 'godmode' });
  const itens = Object.values(ITENS_NEGOCIAVEIS).filter(item => !item.origem);
  for (const item of itens) {
    const antes = player.inventory[item.id] || 0;
    assert.equal(game.action(player.id, { type: 'godmodeGrantItem', item: item.id, quantidade: 3 }).ok, true);
    assert.equal(player.inventory[item.id], antes + 3, item.id);
  }
  assert.equal(bagWeight(player.inventory), pesoAntes + itens.reduce((soma, item) => soma + 3 * item.peso, 0));
  for (const dados of [
    { item: '__proto__', quantidade: 1 }, { item: 'toString', quantidade: 1 },
    { item: 'food', quantidade: 0 }, { item: 'food', quantidade: 1.5 }, { item: 'food', quantidade: 10000 }
  ]) assert.equal(game.action(player.id, { type: 'godmodeGrantItem', ...dados }).ok, false);
});

test('opções do God Mode são salvas sem persistir o nível de teste como progresso real', () => {
  const { game, player } = cena();
  game.action(player.id, { type: 'godmodeConfig', options: {
    level: CONFIG.progression.nivelMaximo, hpInfinite: false, kiInfinite: true, zeniInfinite: false, capacityInfinite: true
  }});
  game.action(player.id, { type: 'godmode' });
  const salvo = exportPlayer(player);
  assert.equal(salvo.level, 12);
  assert.equal(salvo.xp, 9);
  assert.equal(salvo.godmode, true);
  assert.deepEqual(salvo.godmodeOptions, {
    level: CONFIG.progression.nivelMaximo, hpInfinite: false, kiInfinite: true, zeniInfinite: false, capacityInfinite: true,
    cooldownNormal: false, velocidadeMaxima: false
  });
  const restaurado = game.addPlayer('godmode-restored', 'Restaurado', salvo);
  assert.equal(restaurado.level, CONFIG.progression.nivelMaximo);
  assert.equal(restaurado.godmode, true);
  assert.deepEqual(restaurado.godmodeOptions, salvo.godmodeOptions);
});

test('ao desligar God Mode, Auto Hunt recalcula a forma permitida pelo nível real', () => {
  for (const [level, buff, buffMaisAlto, esperada] of [
    [60, null, true, 'base'],
    [200, null, true, 'majin'],
    [200, 'ultraEgo', false, 'base']
  ]) {
    const game = new Game({ populate: false });
    const p = game.addPlayer('vegeta', 'Vegeta', { level, vocacao: 'vegeta' });
    p.autoHunt = true;
    assert.ok(game.action(p.id, { type: 'godmode' }).ok);
    const configuracao = game.action(p.id, {
      type: 'configurarComboAutoHunt', combo: { ordem: [], reserva: 20, buff, buffMaisAlto }
    });
    assert.equal(configuracao.buffAplicado, true);
    assert.equal(p.forma, 'ultraEgo');

    assert.ok(game.action(p.id, { type: 'godmode' }).ok);
    assert.equal(p.level, level);
    assert.equal(p.forma, esperada);
    assert.equal(p.autoHunt, true);
    assert.deepEqual([p.comboAutoHunt.buff, p.comboAutoHunt.buffMaisAlto], [buff, buffMaisAlto]);
    game.tick(0.05);
    assert.equal(p.forma, esperada);
  }
});

test('God Mode preserva forma já liberada e remove forma que o novo nível de teste bloqueia', () => {
  const game = new Game({ populate: false });
  const p = game.addPlayer('vegeta', 'Vegeta', { level: 100, vocacao: 'vegeta' });
  game.action(p.id, { type: 'godmode' });
  assert.ok(game.action(p.id, { type: 'transform', forma: 'ssj' }).ok);
  game.action(p.id, { type: 'godmode' });
  assert.equal(p.forma, 'ssj');

  game.action(p.id, { type: 'godmode' });
  assert.ok(game.action(p.id, { type: 'transform', forma: 'ultraEgo' }).ok);
  assert.ok(game.action(p.id, { type: 'godmodeConfig', options: { ...p.godmodeOptions, level: 60 } }).ok);
  assert.equal(p.forma, 'base');
  assert.equal(p.formaAte, 0);
  assert.equal(p.godmode, true);
});
