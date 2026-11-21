import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, lugar } from '../public/shared/nucleo/config.mjs';
import { readFile } from 'node:fs/promises';
import { GALICK, ESTAGIOS_GALICK, quadroGalick, colunaPoseGalick } from '../public/shared/tecnicas/galick-gun.mjs';
import { tecnicaDisponivel } from '../public/shared/tecnicas/barra-tecnicas.mjs';

function cena({ level = CONFIG.skills.galick, vocacao = 'vegeta', seguro = false } = {}) {
  const game = new Game({ populate: false, now: 1000 });
  const player = game.addPlayer('p', 'Teste', { level, vocacao });
  game.levar(player, lugar('inicial'));
  if (!seguro) player.x += 180;
  const mob = game.addMob('saibaman', player.x + 140, player.y, player.area);
  mob.hp = mob.maxHp = 1e6;
  player.targetId = mob.id;
  return { game, player, mob };
}

test('Galick Gun respeita vocação, nível, Ki, recarga e safe zone', () => {
  for (const opcoes of [{ vocacao: 'goku' }, { level: CONFIG.skills.galick - 1 }, { seguro: true }]) {
    const { game, player } = cena(opcoes);
    const antes = player.ki;
    assert.equal(game.cast(player, 'galick').ok, false);
    assert.equal(player.ki, antes);
    assert.equal(player.galickReady, 0);
  }
  const { game, player } = cena();
  player.ki = GALICK.custo - 1;
  assert.equal(game.cast(player, 'galick').ok, false);
  assert.equal(tecnicaDisponivel('skill:galick', game.snapshot(player.id).self), false);
  player.ki = GALICK.custo;
  assert.ok(tecnicaDisponivel('skill:galick', game.snapshot(player.id).self));
  assert.ok(game.cast(player, 'galick').ok);
  assert.equal(player.ki, 0);
  assert.equal(player.galickReady, game.time + GALICK.recarga);
  assert.equal(game.snapshot(player.id).self.galickRemaining, GALICK.recarga);
  player.charge = null;
  player.ki = GALICK.custo;
  assert.equal(game.cast(player, 'galick').ok, false);
  assert.equal(tecnicaDisponivel('skill:galick', game.snapshot(player.id).self), false);
  const goku = cena({ vocacao: 'goku' });
  const slots = ['skill:galick', null, null, null, null, null, null, null];
  assert.equal(goku.game.action(goku.player.id, { type: 'configurarBarra', slots }).ok, false);
});

function disparar(game, player) {
  game.time += GALICK.carga;
  game.updatePlayer(player, 0);
  game.atualizarKamehamehas();
  assert.equal(game.kamehamehas.length, 1);
  return game.kamehamehas[0];
}

test('Galick Gun cancela ao perder alcance, alvo ou área durante carga e voo', () => {
  for (const duranteVoo of [false, true]) {
    for (const motivo of ['alcance', 'alvo', 'area', 'morte']) {
      const { game, player, mob } = cena();
      const hp = mob.hp;
      assert.ok(game.cast(player, 'galick').ok);
      if (duranteVoo) disparar(game, player);
      if (motivo === 'alcance') mob.x = player.x + 450;
      if (motivo === 'alvo') game.mobs.delete(mob.id);
      if (motivo === 'area') mob.area = 'media';
      if (motivo === 'morte') mob.hp = 0;
      game.time += .5;
      game.updatePlayer(player, 0);
      game.atualizarKamehamehas();
      assert.equal(player.charge, null);
      assert.deepEqual(game.kamehamehas, []);
      assert.equal(mob.hp, motivo === 'morte' ? 0 : hp);
    }
  }
});

test('Galick Gun acerta uma vez na borda do corpo e mantém o impacto fixo até expirar', () => {
  const { game, player, mob } = cena();
  assert.ok(game.cast(player, 'galick').ok);
  const hp = mob.hp;
  const disparo = disparar(game, player);
  game.time += disparo.tempoVoo + .001;
  game.atualizarKamehamehas();
  assert.ok(mob.hp < hp);
  assert.equal(disparo.impacto.x, mob.x - (mob.corpo || 0));
  const impacto = { ...disparo.impacto }, depois = mob.hp;
  mob.x += 40;
  game.time += .5;
  game.atualizarKamehamehas();
  assert.deepEqual(disparo.impacto, impacto);
  assert.equal(mob.hp, depois);
  game.time += GALICK.impactoQuadros * GALICK.impactoQuadro;
  game.atualizarKamehamehas();
  assert.deepEqual(game.kamehamehas, []);
});

test('Galick Gun separa carga, disparo, sustentação em loop e dissipação única', () => {
  assert.equal(quadroGalick('carga', 0), 0);
  assert.equal(quadroGalick('carga', GALICK.carga, GALICK.carga), 3);
  assert.equal(quadroGalick('disparo', 0), 4);
  assert.equal(quadroGalick('disparo', .11, .12), 7);
  assert.equal(quadroGalick('sustentacao', 3 * GALICK.quadro), 11);
  assert.equal(quadroGalick('sustentacao', 4 * GALICK.quadro), 8);
  assert.equal(quadroGalick('dissipacao', 0), 12);
  assert.equal(quadroGalick('dissipacao', GALICK.dissipacao), -1);
  const carga = { started: 0 };
  assert.equal(colunaPoseGalick(carga, 0), 0);
  assert.equal(colunaPoseGalick(carga, GALICK.carga * .4), 1);
  assert.equal(colunaPoseGalick(carga, GALICK.carga * .8), 2);
  const disparo = { started: GALICK.carga, castStarted: 0, impacto: { started: 1 } };
  assert.equal(colunaPoseGalick(disparo, 1.2), 3);
  assert.equal(colunaPoseGalick(disparo, 1.6), null);
});

test('as evoluções usam um só slot e fixam a versão no início da carga manual ou automática', async () => {
  const niveis = [40, 80, 120, 160, 200];

  for (const { versao, nivel } of ESTAGIOS_GALICK) {
    assert.equal(nivel, niveis[versao - 1]);
    const base = new URL(`../public/assets/skills/galick-gun/v${versao}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));
    const folha = await readFile(new URL(versao === 1 ? 'spritesheet.png' : `galick_gun_v${versao}_sheet_rgba.png`, base));
    const [largura, altura] = manifest.sheet_resolution ?? manifest.sheetDimensions ?? [manifest.sheetWidth, manifest.sheetHeight];
    assert.equal(folha.readUInt32BE(16), largura);
    assert.equal(folha.readUInt32BE(20), altura);
    assert.equal(folha[25], 6, 'folha RGBA');
    if (versao > 1) {
      const frames = manifest.frames ?? manifest.frameFiles;
      assert.equal(frames.length, 16);
      for (const [indice, nome] of frames.entries()) {
        assert.equal(nome, `frames/galick_gun_v${versao}_frame_${String(indice + 1).padStart(2, '0')}.png`);
        const frame = await readFile(new URL(nome, base));
        assert.equal(frame.readUInt32BE(16), largura / 4);
        assert.equal(frame.readUInt32BE(20), altura / 4);
        assert.equal(frame[25], 6, 'frame RGBA');
      }
    }
    const anterior = cena({ level: nivel - 1 });
    assert.equal(anterior.game.snapshot(anterior.player.id).self.galickVersao, versao - 1 || null);
    for (const automatica of [false, true]) {
      const { game, player } = cena({ level: nivel });
      const estado = game.snapshot(player.id).self;
      assert.equal(estado.galickVersao, versao);
      assert.equal(estado.barraTecnicas.filter(id => id === 'skill:galick').length, 1);
      if (automatica) {
        player.autoHunt = true;
        player.autoSkills = true;
        game.tick(.01);
      } else {
        assert.ok(game.cast(player, 'galick').ok);
      }
      assert.equal(player.charge?.versao, versao);
      player.level = 1000;
      assert.equal(disparar(game, player).versao, versao);
      assert.equal(game.snapshot(player.id).kamehamehas[0].versao, versao);
    }
  }
});

test('renderer escolhe a folha autorizada, limita o feixe à ponta e limpa os efeitos', async t => {
  const { desenharGalick, desenharImpactoGalick } = await import('../public/render/vfx/galick-gun.mjs');
  const imagens = [];
  const ImageOriginal = globalThis.Image, documentOriginal = globalThis.document;
  t.after(() => {
    if (ImageOriginal === undefined) delete globalThis.Image;
    else globalThis.Image = ImageOriginal;
    if (documentOriginal === undefined) delete globalThis.document;
    else globalThis.document = documentOriginal;
  });
  globalThis.Image = class {
    complete = true;
    naturalWidth = 1672;
    naturalHeight = 944;
    set src(url) { this.url = url; imagens.push(url); }
  };
  globalThis.document = {
    createElement: () => {
      const canvas = {};
      const context = {
        drawImage(imagem) { canvas.url = imagem.url; },
        putImageData() {}, clearRect() {},
        getImageData(x, y, largura, altura) {
          const data = new Uint8ClampedArray(largura * altura * 4);
          data[3] = data[data.length - 1] = 255;
          return { data };
        }
      };
      canvas.getContext = () => context;
      return canvas;
    }
  };

  const desenhos = [], rotacoes = [], origens = [];
  const ctx = {
    globalAlpha: 1, save() {}, restore() { this.globalAlpha = 1; },
    translate: (...posicao) => origens.push(posicao),
    rotate: angulo => rotacoes.push(angulo),
    drawImage: (...args) => desenhos.push(args)
  };
  const efeito = { x: 200, y: 300, started: 0, distancia: 150, tempoVoo: .4 };
  for (const { versao } of ESTAGIOS_GALICK) {
    for (let i = 0; i < 8; i++) {
      const angulo = i * Math.PI / 4;
      const direction = { x: Math.cos(angulo), y: Math.sin(angulo) };
      desenhos.length = 0;
      const disparo = { ...efeito, versao, direction };
      assert.ok(desenharGalick(ctx, disparo, .01));
      assert.match(desenhos[0][0].url, new RegExp('/v' + versao + '/'));
      assert.equal(desenhos.length, 1);
      assert.equal(desenhos[0][1] + desenhos[0][3], disparo.distancia);
      assert.ok(desenhos[0][4] <= 85);
      assert.ok(desenharGalick(ctx, { ...disparo, carga: true }, .2));
      assert.ok(Math.max(...desenhos.at(-1).slice(7, 9)) <= 24 + (versao - 1) * 3 + 1e-8);
      assert.ok(Math.abs(rotacoes.at(-1) - Math.atan2(direction.y, direction.x)) < 1e-8);
      assert.deepEqual(origens.at(-1), [200, 300 - GALICK.alturaMao]);
      const impacto = { x: 350, y: 300, started: .4 };
      assert.ok(desenharGalick(ctx, { ...disparo, impacto }, .6));
      assert.ok(desenharGalick(ctx, { ...disparo, impacto }, .8));
      assert.equal(desenharGalick(ctx, { ...disparo, impacto }, 1), false);
      assert.ok(desenharImpactoGalick(ctx, impacto, .41, versao));
      assert.ok(Math.abs(desenhos.at(-1)[7] - [58, 76, 92, 108, 122][versao - 1]) < 1e-8);
      assert.deepEqual(origens.at(-1), [350, 300 - GALICK.alturaMao]);
      assert.equal(desenharImpactoGalick(ctx, impacto, 2), false);
    }
  }
  assert.equal(imagens.length, ESTAGIOS_GALICK.length + 1);
});

test('o feixe cresce a partir da mão na direção do disparo mesmo com deslocamento da montaria', async () => {
  const { linhaGalick } = await import('../public/render/vfx/galick-gun.mjs');
  const disparo = {
    x: 200, y: 300, direction: { x: 1, y: 0 },
    started: 0, tempoVoo: .4, distanciaContato: 150, distancia: 150
  };
  const mao = { x: 205, y: 278 };
  assert.deepEqual(linhaGalick(disparo, 0, mao).ponta, mao);
  assert.deepEqual(linhaGalick(disparo, .2, mao).ponta, { x: 277.5, y: 278 });
  const impacto = { ...disparo, impacto: { started: .4 } };
  assert.deepEqual(linhaGalick(impacto, .4, mao).ponta, { x: 350, y: 278 });
});

test('cada evolução usa o alcance do Kamehameha e rejeita um alvo além da borda sem consumir Ki', () => {
  const alcances = [128, 192, 256, 320, 384];
  for (const { nivel, versao, alcance } of ESTAGIOS_GALICK) {
    assert.equal(alcance, alcances[versao - 1]);
    const { game, player, mob } = cena({ level: nivel });
    const limite = alcance + GALICK.mao + (mob.corpo || 0);
    mob.x = player.x + limite + 1;
    const ki = player.ki;
    assert.equal(game.cast(player, 'galick').ok, false);
    assert.equal(player.ki, ki);
    mob.x--;
    assert.ok(game.cast(player, 'galick').ok);
    assert.equal(disparar(game, player).distanciaContato, alcance);
  }
});

test('Auto Hunt antecipa a carga para disparar perto do limite de cada versão e segue avançando', () => {
  for (const { nivel, versao, alcance } of ESTAGIOS_GALICK) {
    const { game, player, mob } = cena({ level: nivel });
    player.autoHunt = true;
    player.autoAttack = true;
    player.autoSkills = true;
    player.ki = GALICK.custo;
    const limite = alcance + GALICK.mao + (mob.corpo || 0);
    const passo = .02;
    mob.x = player.x + limite + player.stats.mobility * (GALICK.carga + .08);
    // Alvo estacionário e rota livre para medir o alcance na largada com precisão.
    game.updateMob = () => {};
    game.steer = (p, destino, dt, velocidade) => {
      p.x += Math.min(destino.x - p.x, dt * velocidade);
      p.moving = true;
      return true;
    };
    let iniciouFora = false, disparo;
    for (let i = 0; i < 100 && !disparo; i++) {
      game.tick(passo);
      if (player.charge?.galick && mob.x - player.x > limite) iniciouFora = true;
      disparo = game.kamehamehas.find(k => k.galick);
    }
    assert.ok(iniciouFora, 'prepara fora do alcance efetivo');
    assert.equal(disparo?.versao, versao);
    assert.ok(disparo.distanciaContato <= alcance);
    assert.ok(disparo.distanciaContato > alcance - 3 * passo * player.stats.mobility);
    const xDisparo = player.x;
    game.tick(passo);
    assert.ok(player.x > xDisparo, 'continua avançando após disparar');
  }
});
