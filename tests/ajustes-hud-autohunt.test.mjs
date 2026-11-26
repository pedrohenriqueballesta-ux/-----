import { VELOCIDADES_MONTARIA } from '../public/shared/sistemas/montarias.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, lugar } from '../public/shared/nucleo/config.mjs';
import { GALICK } from '../public/shared/tecnicas/galick-gun.mjs';
import { acaoDaTecnica } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { linhaGalick } from '../public/render/vfx/galick-gun.mjs';
import { recargaConsumivel, recargaTecnica } from '../public/render/hud/recargas-hud.mjs';

function cena() {
  const jogo = new Game({ now: 20, populate: false });
  const p = jogo.addPlayer('p', 'Vegeta', { level: 700, vocacao: 'vegeta' });
  jogo.levar(p, lugar('inicial'));
  Object.assign(p, { x: 3300, y: 2150, ki: p.stats.ki });
  const alvo = jogo.addMob('saibaman', p.x + 150, p.y - 50, p.area);
  Object.assign(alvo, { hp: 1000000, x: p.x + 150, y: p.y - 50 });
  p.targetId = alvo.id;
  return { jogo, p, alvo };
}

test('Galick Gun preserva o contato de dano e fixa a ponta do feixe e a explosão nos pés', () => {
  const { jogo, p, alvo } = cena();
  assert.ok(jogo.cast(p, 'galick').ok);
  jogo.time = p.charge.until;
  jogo.atualizarCargaGalick(p);
  const k = jogo.kamehamehas[0];
  assert.ok(jogo.atualizarGalick(k, p));
  jogo.time = k.started + k.tempoVoo + .001;
  assert.ok(jogo.atualizarGalick(k, p));
  const pes = { x: alvo.x, y: alvo.y };
  assert.deepEqual(k.impacto.pesAlvo, pes);
  assert.deepEqual(linhaGalick(k, jogo.time, k, pes).ponta, { x: pes.x, y: pes.y + GALICK.alturaMao });
  alvo.x += 15;
  assert.ok(jogo.atualizarGalick(k, p));
  assert.deepEqual(k.impacto.pesAlvo, pes);
});

test('HUD mostra recarga da cura e todas as sementes leem o mesmo relógio do servidor', () => {
  const { jogo, p } = cena();
  p.hp = p.stats.hp / 2;
  p.inventory.seed15 = 2;
  assert.ok(jogo.useSeed(p, 15).ok);
  assert.ok(jogo.curarVida(p).ok);
  const estado = jogo.snapshot(p.id).self;
  assert.ok(recargaTecnica(estado, 'skill:heal') > 0);
  for (const potencia of CONFIG.seedPotencies) {
    assert.equal(recargaTecnica(estado, 'item:seed' + potencia), CONFIG.seedCooldown);
    assert.equal(recargaConsumivel(estado, 'seed' + potencia), CONFIG.seedCooldown);
  }
  jogo.time += CONFIG.seedCooldown;
  assert.equal(recargaConsumivel(jogo.snapshot(p.id).self, 'seed100'), 0);
});

test('slot automático usa a forma mais forte e mantém o slot manual explícito', () => {
  const { jogo, p } = cena();
  p.forma = 'ssj';
  const estado = jogo.snapshot(p.id).self;
  assert.deepEqual(acaoDaTecnica('form:auto', estado), { type: 'transform', forma: 'ssjBlue' });
  assert.deepEqual(acaoDaTecnica('form:ssj', estado), { type: 'transform', forma: 'ssj' });
  assert.ok(jogo.action(p.id, acaoDaTecnica('form:auto', estado)).ok);
  assert.equal(p.forma, 'ssjBlue');
});

test('God Mode pode manter a recarga normal e salva a preferência', () => {
  const { jogo, p } = cena();
  p.godmode = true;
  assert.ok(jogo.cast(p, 'galick').ok);
  assert.equal(jogo.snapshot(p.id).self.galickRemaining, 1);
  p.galickReady = 0;
  p.charge = null;
  const options = { ...p.godmodeOptions, level: 700, cooldownNormal: true };
  assert.ok(jogo.action(p.id, { type: 'godmodeConfig', options }).ok);
  assert.ok(jogo.cast(p, 'galick').ok);
  assert.equal(jogo.snapshot(p.id).self.galickRemaining, GALICK.recarga);
  assert.equal(jogo.exportPlayer(p).godmodeOptions.cooldownNormal, true);
});

test('Nuvem aplica o mesmo multiplicador na perseguição e na patrulha do Auto Hunt', () => {
  const { jogo, p, alvo } = cena();
  const velocidades = [];
  jogo.steer = (_p, _destino, _dt, velocidade) => { velocidades.push(velocidade); return true; };
  jogo.proximaPatrulha = () => ({ id: 'ponto', x: alvo.x, y: alvo.y });
  p.autoHunt = true;
  for (const perseguir of [true, false]) {
    jogo.alvoMaisProximo = () => perseguir ? alvo : null;
    for (const montaria of [null, 'nimbus']) {
      p.montaria = montaria;
      jogo.updatePlayer(p, 0.05);
    }
  }
  assert.deepEqual(velocidades, [p.stats.mobility, VELOCIDADES_MONTARIA.free, p.stats.mobility, VELOCIDADES_MONTARIA.free]);
});
