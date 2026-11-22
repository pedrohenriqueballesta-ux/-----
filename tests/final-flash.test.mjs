import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../public/shared/nucleo/game.mjs';
import { lugar } from '../public/shared/nucleo/config.mjs';
import { FINAL_FLASH, contatoFinalFlash, colunaPoseFinalFlash } from '../public/shared/tecnicas/final-flash.mjs';
import { acaoDaTecnica, tecnicaDisponivel, tecnicasDoPerfil } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { detalhesHabilidade } from '../public/render/hud/detalhes-habilidades.mjs';
import { DIRECTIONS } from '../public/render/mapa/camera.mjs';
import { maoVisualFinalFlash } from '../public/render/vfx/final-flash.mjs';

const soltar = { type: 'skill', skill: 'finalFlash' };
function combate({ vocacao = 'vegeta', level = 200, forma = 'ssj', barraTecnicas, barraPersonalizada } = {}) {
  const game = new Game({ now: 10, populate: false });
  const player = game.addPlayer('p', 'Lutador', { level, vocacao, barraTecnicas, barraPersonalizada });
  game.levar(player, lugar('inicial'));
  const entrada = { x: player.x, y: player.y };
  Object.assign(player, { x: 1100, y: 1100, forma, ki: player.stats.ki, godmode: false });
  const mob = (id, dx, dy = 0, campos = {}) => {
    const alvo = { id, x: player.x + dx, y: player.y + dy, hp: 100000, corpo: 20, defesa: 0,
      planet: player.planet, area: player.area, ...campos };
    game.mobs.set(id, alvo);
    return alvo;
  };
  const alvo = mob('alvo', 330);
  player.targetId = alvo.id;
  return { game, player, alvo, mob, entrada, cast: () => game.action(player.id, soltar) };
}
function liberar(game, player) {
  game.time += FINAL_FLASH.carga;
  game.atualizarCargaFinalFlash(player);
  return game.kamehamehas[0];
}

test('Final Flash respeita vocação, nível, forma, safe zone, alcance, Ki e recarga', () => {
  for (const opcoes of [{ level: 199 }, { forma: 'base' }, { vocacao: 'goku' }]) {
    const { player, cast } = combate(opcoes);
    const ki = player.ki;
    assert.equal(cast().ok, false);
    assert.equal(player.ki, ki);
  }
  const { game, player, alvo, entrada, cast } = combate();
  const pos = { x: player.x, y: player.y };
  Object.assign(player, entrada);
  assert.equal(cast().ok, false);
  Object.assign(player, pos);
  player.targetId = null;
  assert.equal(cast().ok, false);
  player.targetId = alvo.id;
  alvo.x = player.x + FINAL_FLASH.mao + FINAL_FLASH.alcance + game.raioMob(alvo) + 1;
  assert.equal(cast().ok, false);
  alvo.x -= 1;
  player.ki = FINAL_FLASH.custo - 1;
  assert.equal(cast().ok, false);
  player.ki = player.stats.ki;
  const ki = player.ki;
  assert.equal(cast().ok, true);
  assert.equal(player.ki, ki - FINAL_FLASH.custo);
  assert.equal(player.charge.until - player.charge.started, FINAL_FLASH.carga);
  assert.equal(game.snapshot(player.id).self.finalFlashRemaining, FINAL_FLASH.recarga);
  player.charge = null;
  assert.equal(cast().ok, false);
});

test('Final Flash segue e acerta só o alvo original, mesmo quando outro mob cruza o feixe', () => {
  const { game, player, alvo, mob, cast } = combate();
  const naFrente = mob('frente', 85, 43);
  const longe = mob('outra-hunt', 80, 0, { area: 'outra-hunt' });
  assert.equal(cast().ok, true);
  const efeito = liberar(game, player);
  assert.equal(efeito.x, player.x + FINAL_FLASH.mao);
  game.time += .02;
  game.atualizarKamehamehas();
  assert.equal(efeito.impacto, undefined);
  assert.deepEqual(efeito.pesAlvoPrevisto, { x: alvo.x, y: alvo.y });

  // Outro mob cruza enquanto o alvo original muda de direção. Mudar a seleção também não redireciona.
  alvo.y += 80;
  naFrente.y = player.y + 20;
  assert.ok(game.action(player.id, { type: 'target', id: naFrente.id }).ok);
  game.time += .1;
  game.atualizarKamehamehas();
  assert.equal(efeito.targetId, alvo.id);
  assert.equal(efeito.impacto, undefined);
  assert.ok(efeito.direction.y > 0);
  const pesPrevistos = efeito.pesAlvoPrevisto;
  assert.deepEqual(pesPrevistos, { x: alvo.x, y: alvo.y });

  game.time += .2;
  game.atualizarKamehamehas();
  assert.equal(efeito.targetId, alvo.id);
  const contato = Math.hypot(efeito.impacto.x - alvo.x, efeito.impacto.y - alvo.y);
  assert.ok(Math.abs(contato - game.raioMob(alvo)) < 1e-8);
  assert.deepEqual(efeito.impacto.pesAlvo, pesPrevistos);
  assert.equal(alvo.hp, 100000 - Math.round(player.stats.attack * FINAL_FLASH.dano));
  assert.equal(naFrente.hp, 100000);
  assert.equal(longe.hp, 100000);
  alvo.x += 30;
  game.time += .1;
  game.atualizarKamehamehas();
  assert.deepEqual(efeito.impacto.pesAlvo, pesPrevistos);
  assert.deepEqual(game.events.filter(e => e.type === 'damage').map(e => e.targetId), [alvo.id]);
  game.time += FINAL_FLASH.impactoQuadros * FINAL_FLASH.impactoQuadro;
  game.atualizarKamehamehas();
  assert.equal(game.kamehamehas.length, 0);
  assert.equal(player.finalFlashAtivo, null);
});

test('um mob comum sem acréscimo de corpo também recebe o feixe na borda', () => {
  const { game, player, alvo, cast } = combate();
  delete alvo.corpo;
  assert.ok(cast().ok);
  const efeito = liberar(game, player);
  game.time += .3;
  game.atualizarKamehamehas();
  assert.equal(efeito.impacto.x, alvo.x - game.raioMob(alvo));
});

test('Final Flash cancela carga, voo e efeitos quando seu estado deixa de ser válido', () => {
  for (const perder of [
    ({ player }) => { player.forma = 'base'; },
    ({ alvo }) => { alvo.hp = 0; },
    ({ alvo }) => { alvo.x += 1000; },
    ({ alvo }) => { alvo.area = 'outra-hunt'; }
  ]) {
    const c = combate();
    assert.ok(c.cast().ok);
    perder(c);
    assert.equal(liberar(c.game, c.player), undefined);
    assert.equal(c.player.charge, null);
  }
  for (const perder of [
    ({ alvo }) => { alvo.hp = 0; },
    ({ player }) => { player.hp = 0; },
    ({ player }) => { player.connected = false; },
    ({ game, player }) => { game.levar(player, lugar('terra')); }
  ]) {
    const c = combate();
    assert.ok(c.cast().ok);
    liberar(c.game, c.player);
    perder(c);
    c.game.time += .3;
    c.game.atualizarKamehamehas();
    assert.equal(c.game.kamehamehas.length, 0);
    assert.equal(c.player.finalFlashAtivo, null);
    assert.equal(c.game.events.some(e => e.type === 'damage'), false);
  }
});

test('Auto Hunt prioriza Final Flash em alcance e volta a agir depois da sustentação', () => {
  const { game, player, alvo } = combate();
  player.autoHunt = true;
  player.autoSkills = true;
  player.autoAttack = false;
  game.alvoMaisProximo = () => alvo;
  game.steer = () => true;
  game.updatePlayer(player, .01);
  assert.ok(player.charge?.finalFlash);
  assert.ok(player.charge.automated);
  assert.equal(player.galickReady, 0);
  const feixe = liberar(game, player);
  game.time += .3;
  game.atualizarKamehamehas();
  assert.ok(feixe.impacto);
  game.time += FINAL_FLASH.sustentacao + .01;
  game.atualizarKamehamehas();
  game.updatePlayer(player, .01);
  assert.ok(player.charge?.galick);
});

test('slot 5 aceita Final Flash, mantém barras personalizadas e usa o ícone anexado', async () => {
  const { game, player } = combate();
  const estado = game.snapshot(player.id).self;
  assert.equal(estado.barraTecnicas[4], 'skill:finalFlash');
  assert.deepEqual(acaoDaTecnica(estado.barraTecnicas[4]), soltar);
  assert.ok(tecnicaDisponivel(estado.barraTecnicas[4], estado));
  assert.ok(!tecnicaDisponivel(estado.barraTecnicas[4], { ...estado, finalFlashRemaining: 1 }));
  assert.ok(!tecnicaDisponivel(estado.barraTecnicas[4], { ...estado, forma: 'base' }));
  assert.ok(tecnicasDoPerfil('vegeta').some(t => t.id === 'skill:finalFlash' && t.imagem === FINAL_FLASH.icone));
  assert.ok(!tecnicasDoPerfil('goku').some(t => t.id === 'skill:finalFlash'));
  assert.equal(Object.fromEntries(detalhesHabilidade('skill:finalFlash', estado).linhas).Estado, 'Disponível');
  const antiga = [...estado.barraTecnicas];
  antiga[4] = null;
  assert.equal(combate({ barraTecnicas: antiga }).player.barraTecnicas[4], 'skill:finalFlash');
  const personalizada = combate({ barraTecnicas: antiga, barraPersonalizada: true });
  assert.equal(personalizada.player.barraTecnicas[4], null);
  const slots = [...antiga];
  slots[7] = 'skill:finalFlash';
  assert.equal(combate({ barraTecnicas: slots }).player.barraTecnicas[7], 'skill:finalFlash');
  const goku = combate({ vocacao: 'goku' });
  assert.equal(goku.game.action(goku.player.id, { type: 'configurarBarra', slots }).ok, false);
  const icon = await readFile(new URL('../public' + FINAL_FLASH.icone, import.meta.url));
  assert.equal(icon.readUInt32BE(16), 1254);
  assert.equal(icon.readUInt32BE(20), 1254);
});

test('contato usa o círculo do alvo e a pose acompanha a fase do feixe', () => {
  assert.equal(contatoFinalFlash({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 12, y: 40 }, 20), 24);
  assert.equal(contatoFinalFlash({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -25 }, 20), Infinity);
  assert.equal(colunaPoseFinalFlash({ carga: true, started: 10 }, 10.9), 2);
  assert.equal(colunaPoseFinalFlash({ started: 11 }, 11.1), 3);
  assert.equal(colunaPoseFinalFlash({ started: 11, impacto: { started: 11.2 } }, 12), null);
});

test('a esfera de carga fica na frente das mãos nas oito direções', () => {
  const pos = { x: 100, y: 200 };
  for (const direcao of DIRECTIONS) {
    const mao = maoVisualFinalFlash(pos, direcao);
    const carga = maoVisualFinalFlash(pos, direcao, true);
    const dx = carga.x - mao.x, dy = carga.y - mao.y;
    assert.ok(dx * direcao.x + dy * direcao.y > 11.9, direcao.label);
    assert.ok(Math.abs(dx * direcao.y - dy * direcao.x) < 1e-8, direcao.label);
  }
});
