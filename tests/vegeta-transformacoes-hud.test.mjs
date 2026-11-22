import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { acaoDaTecnica, barraPadrao, nivelDaTecnica, tecnicaDisponivel, tecnicasDoPerfil } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { detalhesHabilidade } from '../public/render/hud/detalhes-habilidades.mjs';
import { iconeDaForma, multiplicadorDaForma } from '../public/shared/tecnicas/formas.mjs';
import { CONFIG, lugar } from '../public/shared/nucleo/config.mjs';

test('Perfil lista as seis formas do Vegeta com seus níveis e separa as formas de Goku', () => {
  const formas = vocacao => tecnicasDoPerfil(vocacao)
    .filter(t => t.id.startsWith('form:'))
    .map(t => [t.id, nivelDaTecnica(t, vocacao)]);
  assert.deepEqual(formas('vegeta'), [
    ['form:ssj', 100], ['form:majin', 200], ['form:ssj4', 300], ['form:ssjGod', 500],
    ['form:ssjBlue', 700], ['form:ultraEgo', 900]
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

test('Rajada de Ki entra no slot 4 das barras padrão antigas e fica disponível em Técnicas no nível 1', () => {
  const game = new Game({ populate: false });
  const padrao = barraPadrao({}, 15, 1, 'base', 'vegeta');
  const antiga = padrao.map((id, i) => i === 3 ? null : id);
  for (const [i, save] of [
    {}, { barraTecnicas: antiga }, { barraTecnicas: antiga, barraPersonalizada: false },
    { barraTecnicas: antiga, barraPersonalizada: true }
  ].entries()) {
    const vegeta = game.addPlayer('rajada-barra-' + i, 'Vegeta', { ...save, vocacao: 'vegeta' });
    assert.deepEqual(vegeta.barraTecnicas, save.barraPersonalizada ? antiga : padrao);
  }
  const rajada = tecnicasDoPerfil('vegeta').find(t => t.id === 'skill:ki');
  assert.equal(padrao[3], rajada.id);
  assert.equal(nivelDaTecnica(rajada, 'goku'), CONFIG.skills.ki);
  assert.ok(tecnicaDisponivel(rajada.id, { vocacao: 'vegeta', level: 1 }));
  const detalhe = detalhesHabilidade(rajada.id, { vocacao: 'vegeta', level: 1, shotRemaining: .4 });
  assert.equal(Object.fromEntries(detalhe.linhas).Estado, 'Em recarga · 0,4 s');
});

test('Rajada de Ki pelo slot 4 acerta o alvo na base e nas seis formas do Vegeta', () => {
  for (const [level, forma] of [
    [1, 'base'], [100, 'ssj'], [200, 'majin'], [300, 'ssj4'],
    [500, 'ssjGod'], [700, 'ssjBlue'], [900, 'ultraEgo']
  ]) {
    const game = new Game({ populate: false });
    const p = game.addPlayer('lutador', 'Vegeta', { vocacao: 'vegeta', level });
    game.levar(p, lugar('inicial'));
    const rajada = acaoDaTecnica(p.barraTecnicas[3]);
    if (forma !== 'base') assert.ok(game.action(p.id, { type: 'transform', forma }).ok);
    assert.equal(game.action(p.id, rajada).ok, false, 'Zona segura');
    p.x += 180;
    const mob = game.addMob('saibaman', p.x + 100, p.y, p.area);
    mob.hp = mob.maxHp = 1e6;
    p.targetId = mob.id;
    const antes = p.ki;
    assert.ok(game.action(p.id, rajada).ok, forma);
    assert.equal(p.ki, antes - CONFIG.skillCosts.ki, forma);
    assert.equal(game.action(p.id, rajada).ok, false, 'Recarga');
    const snapshot = game.snapshot(p.id);
    assert.ok(Math.abs(snapshot.self.shotRemaining - CONFIG.skillCooldowns.ki) < 1e-6);
    assert.ok(snapshot.events.some(e => e.type === 'kiShot' && e.playerId === p.id));
    assert.equal(game.projectiles[0].damage, p.stats.attack * multiplicadorDaForma(forma, 'rajada'));
    for (let i = 0; i < 4; i++) game.tick(.1);
    assert.ok(mob.hp < mob.maxHp, forma);
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

test('a tecla 3 acompanha os desbloqueios do Vegeta até Ultra Ego', () => {
  const game = new Game({ populate: false });
  for (const [level, forma, nome] of [
    [100, 'ssj', 'Super Saiyajin'],
    [200, 'majin', 'Majin Vegeta'],
    [300, 'ssj4', 'Super Saiyajin 4'],
    [500, 'ssjGod', 'Super Saiyajin God'],
    [699, 'ssjGod', 'Super Saiyajin God'],
    [700, 'ssjBlue', 'Super Saiyajin Blue'],
    [899, 'ssjBlue', 'Super Saiyajin Blue'],
    [900, 'ultraEgo', 'Ultra Ego']
  ]) {
    const vegeta = game.addPlayer('vegeta-' + level, 'Vegeta', { vocacao: 'vegeta', level });
    const estado = game.snapshot(vegeta.id).self;
    assert.equal(detalhesHabilidade(estado.barraTecnicas[2], estado).nome, nome);
    assert.ok(game.action(vegeta.id, acaoDaTecnica(estado.barraTecnicas[2])).ok);
    assert.equal(vegeta.forma, forma);
  }
});

test('Ultra Ego é exclusivo do Vegeta, libera no 900 e mantém o dano do Blue', () => {
  const game = new Game({ populate: false });
  const vegeta = game.addPlayer('vegeta-ultra', 'Vegeta', { vocacao: 'vegeta', level: 899 });
  const goku = game.addPlayer('goku-ultra', 'Goku', { vocacao: 'goku', level: 1000 });
  const acao = acaoDaTecnica('form:ultraEgo');
  assert.equal(iconeDaForma('ultraEgo', 'vegeta'), '/assets/skills/transformacoes/vegeta/vegeta_ultra_ego.png');
  assert.equal(tecnicaDisponivel('form:ultraEgo', vegeta), false);
  assert.equal(game.action(vegeta.id, acao).ok, false);
  assert.equal(game.action(goku.id, acao).ok, false);
  vegeta.level = 900;
  assert.ok(game.action(vegeta.id, acaoDaTecnica('form:ssjBlue')).ok);
  assert.ok(game.action(vegeta.id, acao).ok);
  const estado = game.snapshot(vegeta.id).players.find(p => p.id === vegeta.id);
  assert.equal(estado.forma, 'ultraEgo');
  assert.equal(estado.transformed, true);
  for (const golpe of ['soco', 'rajada', 'kame', 'genki']) {
    assert.equal(multiplicadorDaForma('ultraEgo', golpe), multiplicadorDaForma('ssjBlue', golpe));
  }
  assert.ok(game.action(vegeta.id, acao).ok);
  assert.equal(vegeta.forma, 'base');
});

test('Blue usa o ícone do Vegeta, libera no 700 e mantém o dano do God', () => {
  const game = new Game({ populate: false });
  const vegeta = game.addPlayer('vegeta-blue', 'Vegeta', { vocacao: 'vegeta', level: 699 });
  const mudar = forma => game.action(vegeta.id, { type: 'transform', forma });
  assert.equal(iconeDaForma('ssjBlue', 'vegeta'), '/assets/skills/transformacoes/vegeta/vegeta_ssj_blue.png');
  assert.equal(tecnicaDisponivel('form:ssjBlue', vegeta), false);
  assert.equal(mudar('ssjBlue').ok, false);
  vegeta.level = 700;
  assert.equal(tecnicaDisponivel('form:ssjBlue', vegeta), true);
  assert.ok(mudar('ssjGod').ok);
  assert.ok(mudar('ssjBlue').ok);
  const estado = game.snapshot(vegeta.id).players.find(p => p.id === vegeta.id);
  assert.equal(estado.forma, 'ssjBlue');
  assert.equal(estado.transformed, true);
  for (const golpe of ['soco', 'rajada', 'kame', 'genki']) {
    assert.equal(multiplicadorDaForma('ssjBlue', golpe), multiplicadorDaForma('ssjGod', golpe));
  }
  assert.ok(mudar('ssjBlue').ok);
  assert.equal(vegeta.forma, 'base');
  assert.equal(tecnicaDisponivel('form:ssjBlue', { level: 1000, vocacao: 'goku' }), false);
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
