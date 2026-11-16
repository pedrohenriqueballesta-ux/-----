import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';

function jogador(level) {
  const game = new Game({ now: 1000, populate: false });
  const p = game.addPlayer('nivel-' + level, 'Goku', { level });
  game.levar(p, lugar('inicial')); p.x += 250; p.seguroAte = 0; p.autoHeal = false;
  return { game, p };
}

test('a progressão de habilidades preserva cura inicial e espaça os demais desbloqueios', () => {
  assert.deepEqual(
    [CONFIG.skills.ki, CONFIG.skills.dash, CONFIG.skills.kame, CONFIG.skills.barrier, CONFIG.skills.genki],
    [20, 20, 40, 80, 200]
  );
  const { game, p } = jogador(1);
  p.hp = Math.floor(p.stats.hp / 2);
  assert.equal(game.cast(p, 'heal').ok, true, 'cura disponível no nível inicial');
});

test('Rajada de Ki e Imagem Residual liberam no nível 20', () => {
  const baixo = jogador(19); assert.equal(baixo.game.cast(baixo.p, 'ki').ok, false);
  const inicial = jogador(20); assert.equal(inicial.game.cast(inicial.p, 'ki').ok, true);
  const semDash = jogador(CONFIG.skills.dash - 1); assert.equal(semDash.game.cast(semDash.p, 'dash').ok, false);
  const dash = jogador(CONFIG.skills.dash); assert.equal(dash.game.cast(dash.p, 'dash').ok, true);
});

test('Kamehameha libera no nível 40, Barreira no 80 e Genki Dama no 200', () => {
  const semKame = jogador(CONFIG.skills.kame - 1);
  assert.equal(semKame.game.cast(semKame.p, 'kame').ok, false);
  const kame = jogador(CONFIG.skills.kame);
  const alvo = kame.game.addMob('melee', kame.p.x + 100, kame.p.y, kame.p.area);
  kame.p.targetId = alvo.id;
  assert.equal(kame.game.cast(kame.p, 'kame').ok, true);

  const semBarreira = jogador(CONFIG.skills.barrier - 1);
  assert.equal(semBarreira.game.cast(semBarreira.p, 'barrier').ok, false);
  const barreira = jogador(CONFIG.skills.barrier);
  assert.equal(barreira.game.cast(barreira.p, 'barrier').ok, true);

  const semGenki = jogador(CONFIG.skills.genki - 1);
  assert.equal(semGenki.game.cast(semGenki.p, 'genki').ok, false);
  const genki = jogador(CONFIG.skills.genki);
  assert.equal(genki.game.cast(genki.p, 'genki').ok, true);
});

test('Ryuken implementado no marco do SSJ3; Super Kamehameha segue só planejado', () => {
  assert.equal(CONFIG.skills.ryuken, CONFIG.skills.ssj3);
  assert.deepEqual(CONFIG.plannedSkillUnlocks, { superKamehameha: 500 });
  assert.equal(CONFIG.skills.superKamehameha, undefined);
});
