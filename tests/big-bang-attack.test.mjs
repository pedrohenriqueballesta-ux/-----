import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../public/shared/nucleo/game.mjs';
import { lugar } from '../public/shared/nucleo/config.mjs';
import { BIG_BANG_ATTACK, maoBigBang } from '../public/shared/tecnicas/big-bang-attack.mjs';
import { barraPadrao, tecnicaDisponivel, tecnicasDoPerfil } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { posicaoBigBang } from '../public/render/vfx/big-bang-attack.mjs';
import { DIRECTIONS } from '../public/render/mapa/camera.mjs';

const soltar = { type: 'skill', skill: 'bigBangAttack' };
function combate({ level = 100, vocacao = 'vegeta', forma = 'ssj', dx = 330, dy = 0 } = {}) {
  const game = new Game({ now: 10, populate: false });
  game.updateMob = () => {};
  const p = game.addPlayer('p', 'Lutador', { level, vocacao });
  game.levar(p, lugar('inicial'));
  const entrada = { x: p.x, y: p.y };
  Object.assign(p, { x: 1100, y: 1100, forma });
  const alvo = game.addMob('saibaman', p.x + dx, p.y + dy, p.area);
  Object.assign(alvo, { hp: 100000, maxHp: 100000, defesa: 0, corpo: 0 });
  p.targetId = alvo.id;
  return { game, p, alvo, entrada, cast: () => game.action(p.id, soltar) };
}
function ticks(game, tempo) {
  for (let i = 0; i < Math.round(tempo / 0.05); i++) game.tick(0.05);
}

test('Big Bang Attack valida vocação, nível, forma, alvo, distância, Ki e safe zone', () => {
  for (const opcoes of [{ level: 99 }, { forma: 'base' }, { vocacao: 'goku' }, { dx: 800 }]) {
    const { p, cast } = combate(opcoes);
    const ki = p.ki;
    assert.equal(cast().ok, false);
    assert.equal(p.ki, ki);
  }
  const { game, p, alvo, entrada, cast } = combate();
  const pos = { x: p.x, y: p.y };
  Object.assign(p, entrada);
  assert.equal(cast().ok, false);
  Object.assign(p, pos);
  p.targetId = null;
  assert.equal(cast().ok, false);
  p.targetId = alvo.id;
  p.ki = BIG_BANG_ATTACK.custo - 1;
  assert.equal(cast().ok, false);
  p.ki = p.stats.ki;
  const ki = p.ki;
  assert.ok(cast().ok);
  assert.equal(p.ki, ki - BIG_BANG_ATTACK.custo);
  assert.equal(game.snapshot(p.id).self.bigBangAttackRemaining, BIG_BANG_ATTACK.recarga);
  assert.equal(cast().ok, false);
});

test('a esfera nasce na palma, segue o alvo marcado e só explode uma vez na borda do corpo', () => {
  for (const { x, y } of DIRECTIONS) {
    const { game, p, alvo, cast } = combate({ dx: x * 258, dy: y * 258 });
    const outro = game.addMob('saibaman', p.x + x * 85, p.y + y * 85, p.area);
    assert.ok(cast().ok);
    ticks(game, 0.5);
    assert.equal(game.projectiles.length, 0);
    const mao = maoBigBang(p, p.facing);
    ticks(game, 0.05);
    const s = game.projectiles[0];
    assert.equal(s.kind, 'bigBangAttack');
    assert.deepEqual({ x: s.x, y: s.y, altura: s.altura }, mao);
    assert.deepEqual(posicaoBigBang(s, 0), { x: mao.x, y: mao.y - mao.altura });
    assert.ok(game.action(p.id, { type: 'target', id: outro.id }).ok);
    const hpOutro = outro.hp;
    alvo.x += 16;
    ticks(game, 0.6);
    assert.ok(s.impactoEm);
    assert.ok(Math.abs(Math.hypot(s.x - alvo.x, s.y - alvo.y) - game.raioMob(alvo)) < 1e-7);
    assert.equal(alvo.hp, 100000 - Math.round(p.stats.attack * BIG_BANG_ATTACK.dano));
    assert.equal(outro.hp, hpOutro);
    assert.equal(game.events.filter(e => e.type === 'damage').length, 1);
    const pos = [s.x, s.y];
    const pes = { x: alvo.x, y: alvo.y };
    assert.deepEqual(posicaoBigBang(s, 0.07), pes);
    alvo.x += 10;
    ticks(game, 0.15);
    assert.deepEqual(posicaoBigBang(s, 0.07), pes);
    assert.deepEqual([s.x, s.y], pos);
    ticks(game, 1);
    assert.equal(game.projectiles.length, 0);
  }
});

test('o último ponto visual do projétil coincide com a explosão aos pés', () => {
  const pesAlvo = { x: 350, y: 150 };
  const efeito = {
    x: 288, y: 150, dx: 1, dy: 0, speed: 850, altura: 30, restante: BIG_BANG_ATTACK.alcance - 120,
    avancoVisual: 40, distanciaAteContato: 40, pesAlvo
  };
  assert.ok(posicaoBigBang(efeito, 0).y < pesAlvo.y);
  assert.deepEqual(posicaoBigBang(efeito, .07), pesAlvo);
  assert.deepEqual(posicaoBigBang({ ...efeito, impactoEm: 1 }, .10), pesAlvo);
});

test('cancela ao perder o alvo, a transformação ou mudar de área', () => {
  for (const fase of ['carga', 'voo']) {
    for (const cancelar of [
      ({ alvo }) => { alvo.hp = 0; alvo.deadUntil = Infinity; },
      ({ p }) => { p.forma = 'base'; },
      ({ game, p }) => { game.levar(p, lugar('terra'), { preservarForma: true }); },
      ({ game, p }) => { p.hp = 0; p.respawnAt = game.time + 5; },
      ({ p }) => { p.connected = false; }
    ]) {
      const c = combate();
      assert.ok(c.cast().ok);
      if (fase === 'voo') ticks(c.game, .55);
      cancelar(c);
      ticks(c.game, .6);
      assert.equal(c.p.charge, null);
      assert.equal(c.game.projectiles.length, 0);
      assert.ok(!c.game.events.some(e => e.type === 'damage'));
    }
  }
});

test('Auto Hunt se aproxima para lançar e usa Galick Gun se Big Bang Attack estiver em recarga', () => {
  const { game, p, alvo } = combate({ dx: 510 });
  p.autoHunt = p.autoSkills = true;
  p.autoAttack = false;
  game.alvoMaisProximo = () => alvo;
  game.steer = jogador => { jogador.x += 18; return true; };
  p.galickReady = game.time + 1;
  game.updatePlayer(p, .05);
  assert.equal(p.charge, null);
  for (let i = 0; i < 5 && !p.charge; i++) game.updatePlayer(p, .05);
  assert.ok(p.charge?.bigBangAttack && p.charge.automated);
  p.charge = null;
  alvo.x = p.x + 180;
  p.galickReady = game.time;
  game.updatePlayer(p, .05);
  assert.ok(p.charge?.galick);
});

test('slot 3, migração de barras, catálogo exclusivo e folhas 4×4', async () => {
  const { game, p } = combate();
  const id = 'skill:bigBangAttack';
  assert.equal(p.barraTecnicas[2], id);
  assert.ok(tecnicaDisponivel(id, game.snapshot(p.id).self));
  assert.ok(!tecnicaDisponivel(id, { ...game.snapshot(p.id).self, forma: 'base' }));
  assert.ok(tecnicasDoPerfil('vegeta').some(t => t.id === id));
  assert.ok(!tecnicasDoPerfil('goku').some(t => t.id === id));
  const anterior = barraPadrao({}, 15, 100, 'base', 'vegeta');
  anterior[2] = null;
  for (const personalizada of [true, false]) {
    const v = game.addPlayer(String(personalizada), 'Vegeta', { vocacao: 'vegeta', level: 100, barraTecnicas: anterior, barraPersonalizada: personalizada });
    assert.equal(v.barraTecnicas[2], personalizada ? null : id);
  }
  for (const fase of ['carga', 'projetil', 'impacto']) {
    const png = await readFile(new URL('../public/assets/skills/big-bang-attack/' + fase + '.png', import.meta.url));
    assert.equal(png.readUInt32BE(16), 1448);
    assert.equal(png.readUInt32BE(20), 1084);
    assert.equal(png[25], 6);
  }
});
