import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { acaoDaTecnica, barraPadrao, nivelDaTecnica, tecnicaDisponivel, tecnicasDoPerfil } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { detalhesHabilidade } from '../public/render/hud/detalhes-habilidades.mjs';

test('Perfil lista as quatro formas do Vegeta com seus níveis e separa as formas de Goku', () => {
  const formas = vocacao => tecnicasDoPerfil(vocacao)
    .filter(t => t.id.startsWith('form:'))
    .map(t => [t.id, nivelDaTecnica(t, vocacao)]);
  assert.deepEqual(formas('vegeta'), [
    ['form:ssj', 100], ['form:majin', 200], ['form:ssj4', 300], ['form:ssjGod', 500]
  ]);
  assert.equal(formas('goku').some(([id]) => id === 'form:majin'), false);
  assert.equal(formas('goku').some(([id]) => id === 'form:kaioken'), true);
  assert.equal(tecnicaDisponivel('form:auto', { vocacao: 'vegeta', level: 99 }), false);
  assert.equal(tecnicaDisponivel('form:auto', { vocacao: 'vegeta', level: 100 }), true);
  const bloqueada = detalhesHabilidade('form:auto', { vocacao: 'vegeta', level: 50, forma: 'base' });
  assert.equal(bloqueada.nome, 'Super Saiyajin');
  assert.equal(Object.fromEntries(bloqueada.linhas).Estado, 'Bloqueada · requer nível 100');
  assert.equal(tecnicaDisponivel('form:ssj', { vocacao: 'vegeta', level: 99 }), false);
  assert.equal(tecnicaDisponivel('form:ssj', { vocacao: 'vegeta', level: 100 }), true);
  assert.equal(tecnicaDisponivel('form:ssj3', { vocacao: 'vegeta', level: 500 }), false);
  const detalhes = detalhesHabilidade('form:auto', { vocacao: 'vegeta', level: 100, forma: 'base' });
  assert.equal(Object.fromEntries(detalhes.linhas).Próxima, 'Majin Vegeta no nível 200');
});

test('Vegeta recebe a transformação automática na tecla 3 em barras novas e padrões antigos', () => {
  const game = new Game({ populate: false });
  const padrao = barraPadrao({}, 15, 300, 'base', 'vegeta');
  assert.equal(padrao[2], 'form:auto');
  const antiga = [...padrao];
  antiga[2] = null;
  for (const [i, save] of [
    {}, { barraTecnicas: antiga }, { barraTecnicas: antiga, barraPersonalizada: false },
    { barraTecnicas: antiga.map((id, i) => i === 2 ? 'form:ssj' : id), barraPersonalizada: false }
  ].entries()) {
    const vegeta = game.addPlayer('vegeta-' + i, 'Vegeta', { ...save, vocacao: 'vegeta', level: 200 });
    const estado = game.snapshot(vegeta.id).self;
    assert.deepEqual(estado.barraTecnicas, padrao);
    assert.equal(tecnicaDisponivel(estado.barraTecnicas[2], { ...estado, level: 99 }), false);
    assert.ok(tecnicaDisponivel(estado.barraTecnicas[2], { ...estado, level: 100 }));
    assert.ok(game.action(vegeta.id, acaoDaTecnica(estado.barraTecnicas[2])).ok);
    assert.equal(vegeta.forma, 'majin');
  }
});

test('formas equipadas e slots personalizados do Vegeta são preservados na reconexão', () => {
  const game = new Game({ populate: false });
  const vegeta = game.addPlayer('vegeta', 'Vegeta', { vocacao: 'vegeta', level: 500 });
  const slots = ['skill:galick', 'item:ki', null, 'form:majin', 'form:ssj4', null, 'skill:heal', 'item:food'];
  assert.ok(game.action(vegeta.id, { type: 'configurarBarra', slots }).ok);
  const reconectado = game.addPlayer('copia', 'Vegeta', game.exportPlayer(vegeta));
  assert.deepEqual(reconectado.barraTecnicas, slots);
  assert.ok(game.action(reconectado.id, acaoDaTecnica(reconectado.barraTecnicas[4])).ok);
  assert.equal(reconectado.forma, 'ssj4');
});

test('Vegeta pode selecionar somente a skin base e restaura barras antigas sem Kaioken', () => {
  const game = new Game({ populate: false });
  const slots = ['skill:galick', 'form:kaioken', 'form:ssj', null, null, null, null, null];
  const vegeta = game.addPlayer('vegeta', 'Vegeta', { vocacao: 'vegeta', level: 100, skin: 'natalino', barraTecnicas: slots });
  assert.equal(vegeta.skin, 'base');
  assert.deepEqual(vegeta.barraTecnicas, ['skill:galick', null, 'form:ssj', null, null, null, null, null]);
  assert.equal(game.action(vegeta.id, { type: 'configurarBarra', slots }).ok, false);
  assert.equal(game.action(vegeta.id, { type: 'transform', forma: 'kaioken' }).ok, false);
  assert.equal(game.action(vegeta.id, { type: 'skin', skin: 'natalino' }).ok, false);
  assert.ok(game.action(vegeta.id, { type: 'skin', skin: 'base' }).ok);

  const goku = game.addPlayer('goku', 'Goku', { vocacao: 'goku', level: 50, skin: 'natalino' });
  assert.equal(goku.skin, 'natalino');
  assert.ok(game.action(goku.id, { type: 'transform', forma: 'kaioken' }).ok);
  assert.equal(goku.forma, 'kaioken');
});

test('um save do Vegeta com consumíveis rearranjados recebe SSJ1 no terceiro slot vazio', () => {
  const game = new Game({ populate: false });
  const slots = ['skill:heal', 'skill:galick', null, null, null, 'item:seed15', 'item:ki', 'item:food'];
  const vegeta = game.addPlayer('vegeta', 'Vegeta', {
    vocacao: 'vegeta', level: 40, barraTecnicas: slots, barraPersonalizada: true
  });
  assert.deepEqual(vegeta.barraTecnicas, slots.map((id, i) => i === 2 ? 'form:auto' : id));
  assert.equal(tecnicaDisponivel(vegeta.barraTecnicas[2], game.snapshot(vegeta.id).self), false);
});

test('a tecla 3 acompanha os desbloqueios do Vegeta até God', () => {
  const game = new Game({ populate: false });
  for (const [level, forma, nome] of [
    [100, 'ssj', 'Super Saiyajin'],
    [200, 'majin', 'Majin Vegeta'],
    [300, 'ssj4', 'Super Saiyajin 4'],
    [500, 'ssjGod', 'Super Saiyajin God'],
    [900, 'ssjGod', 'Super Saiyajin God']
  ]) {
    const vegeta = game.addPlayer('vegeta-' + level, 'Vegeta', { vocacao: 'vegeta', level });
    const estado = game.snapshot(vegeta.id).self;
    assert.equal(detalhesHabilidade(estado.barraTecnicas[2], estado).nome, nome);
    assert.ok(game.action(vegeta.id, acaoDaTecnica(estado.barraTecnicas[2])).ok);
    assert.equal(vegeta.forma, forma);
  }
});

test('God exige nível 500 no servidor, e os níveis de SSJ2 e SSJ4 de Goku são preservados', () => {
  const game = new Game({ populate: false });
  const vegeta = game.addPlayer('vegeta-god', 'Vegeta', { vocacao: 'vegeta', level: 499 });
  assert.equal(tecnicaDisponivel('form:ssjGod', vegeta), false);
  assert.equal(game.action(vegeta.id, { type: 'transform', forma: 'ssjGod' }).ok, false);
  assert.ok(game.action(vegeta.id, { type: 'transform', forma: 'ssj4' }).ok);
  assert.equal(tecnicaDisponivel('form:ssj2', vegeta), false);
  vegeta.level = 500;
  assert.ok(game.action(vegeta.id, { type: 'transform', forma: 'ssjGod' }).ok);
  assert.ok(game.snapshot(vegeta.id).players.find(p => p.id === vegeta.id).transformed);
  assert.equal(tecnicaDisponivel('form:ssj4', { level: 300, vocacao: 'goku' }), false);
  assert.equal(tecnicaDisponivel('form:ssj2', { level: 200, vocacao: 'goku' }), true);
  assert.equal(tecnicaDisponivel('form:ssjGod', { level: 500, vocacao: 'goku' }), false);
});
