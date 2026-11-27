import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, lugar } from '../public/shared/nucleo/config.mjs';
import { FINAL_FLASH } from '../public/shared/tecnicas/final-flash.mjs';
import { BIG_BANG_ATTACK } from '../public/shared/tecnicas/big-bang-attack.mjs';
import { estagioTecnicasBoo } from '../public/shared/tecnicas/majin-boo.mjs';

function luta(level = 500, vocacao = 'vegeta') {
  const game = new Game({ now: 10, populate: false });
  const p = game.addPlayer('p', 'Lutador', { level, vocacao });
  game.levar(p, lugar('inicial'));
  const entrada = { x: p.x, y: p.y };
  Object.assign(p, { x: 3300, y: 2150, forma: 'ssj', autoHunt: true, autoSkills: true });
  const mob = game.addMob('saibaman', p.x + 175, p.y, p.area);
  Object.assign(mob, { hp: 100000, x: p.x + 175, y: p.y });
  p.targetId = mob.id;
  game.alvoMaisProximo = () => mob;
  game.steer = () => true;
  const configurar = (ids, reserva = 20, buff = null, buffMaisAlto = undefined) => game.action(p.id, {
    type: 'configurarComboAutoHunt', combo: { ordem: ids.map(item => typeof item === 'string' ? { id: item, ki: 0 } : item), reserva, buff, buffMaisAlto }
  });
  return { game, p, mob, entrada, configurar };
}

test('o combo usa a primeira técnica pronta e ignora prioridades em recarga ou fora do alcance', () => {
  const { game, p, mob, configurar } = luta();
  assert.ok(configurar(['galick', 'finalFlash', 'bigBangAttack']).ok);
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.galick);
  p.charge = null;
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.finalFlash);
  p.charge = null;
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.bigBangAttack);
  p.charge = null;
  p.finalFlashReady = p.bigBangAttackReady = p.galickReady = 0;
  mob.x = p.x + 465;
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.bigBangAttack);
});

for (const modo of ['normal', 'God Mode com recarga normal', 'God Mode com recarga rápida']) {
  test('dispara o combo configurado com as conjurações reais: ' + modo, () => {
    const { game, p, mob, configurar } = luta();
    p.autoAttack = p.autoFood = p.autoHeal = false;
    mob.hp = mob.maxHp = 1e9;
    game.updateMob = () => {};
    const rapido = modo === 'God Mode com recarga rápida';
    if (modo !== 'normal') {
      assert.ok(game.action(p.id, { type: 'godmodeConfig', options: {
        ...p.godmodeOptions, level: p.level, cooldownNormal: !rapido
      } }).ok);
      assert.ok(game.action(p.id, { type: 'godmode' }).ok);
    }
    assert.ok(configurar(['finalFlash', 'bigBangAttack', 'galick']).ok);

    const disparos = [];
    const nomes = ['Final Flash!', 'Big Bang Attack!', 'Galick Gun!'];
    for (let passo = 0; passo < 300 && disparos.length < 4; passo++) {
      const anterior = game.time;
      game.tick(.05);
      disparos.push(...game.events.filter(e => e.at > anterior && e.type === 'skillShout' && nomes.includes(e.text)).map(e => e.text));
    }
    assert.deepEqual(disparos.slice(0, 3), nomes);
    assert.equal(disparos[3], rapido ? 'Final Flash!' : 'Galick Gun!');
    assert.ok(mob.hp < mob.maxHp, 'o combo aplica dano ao alvo');
  });
}

test('Angry Explosion exige o grupo no raio da forma atual, com mínimo configurável de 1 a 4', () => {
  const { game, p, mob, configurar } = luta(500, 'boo');
  p.forma = 'base';
  p.autoAttack = false;
  const raio = estagioTecnicasBoo(p.forma).raioAngry;
  mob.x = p.x + raio - 8;
  const longe = game.addMob('saibaman', p.x + raio + 1, p.y, p.area);
  const deOutroJogador = game.addMob('saibaman', p.x + 40, p.y, p.area);
  deOutroJogador.dono = 'outro';
  const morto = game.addMob('saibaman', p.x + 65, p.y, p.area);
  morto.hp = 0;
  game.addMob('saibaman', p.x + 50, p.y, 'media');

  assert.ok(configurar([{ id: 'angryExplosion', ki: 0, minMobs: 2 }, 'chocolateBeam']).ok);
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.chocolateBeam, 'o grupo insuficiente deixa passar a técnica seguinte');
  p.charge = null;
  p.forma = 'evilBoo';
  game.updatePlayer(p, 0);
  assert.equal(p.charge?.booTecnica, 'angryExplosion', 'a forma maior inclui o segundo inimigo');
  p.charge = null;
  longe.hp = 0;
  assert.ok(configurar([{ id: 'angryExplosion', ki: 0, minMobs: 1 }]).ok);
  game.updatePlayer(p, 0);
  assert.equal(p.charge?.booTecnica, 'angryExplosion');

  for (const invalido of [0, 5, 2.5, '2', null])
    assert.equal(configurar([{ id: 'angryExplosion', ki: 0, minMobs: invalido }]).ok, false);
  assert.ok(configurar([{ id: 'angryExplosion', ki: 0, minMobs: 4 }]).ok);
  const voltou = game.addPlayer('volta', 'Teste', game.exportPlayer(p));
  assert.equal(voltou.comboAutoHunt.ordem[0].minMobs, 4);
});

test('Supernova conta mobs ao redor do alvo marcado', () => {
  const { game, p, mob, configurar } = luta(500, 'boo');
  p.forma = 'base';
  const pertoDoBoo = game.addMob('saibaman', p.x - 50, p.y, p.area);
  assert.ok(configurar([{ id: 'supernova', ki: 0, minMobs: 2 }]).ok);
  game.updatePlayer(p, 0);
  assert.equal(p.charge, null);
  pertoDoBoo.x = mob.x + 55;
  game.updatePlayer(p, 0);
  assert.equal(p.charge?.booTecnica, 'supernova');
});

test('outras técnicas usam o mínimo de mobs perto do personagem', () => {
  const { game, p, mob, configurar } = luta();
  mob.x = p.x + 75;
  const segundo = game.addMob('saibaman', p.x + 190, p.y, p.area);
  assert.ok(configurar([{ id: 'finalFlash', ki: 0, minMobs: 2 }]).ok);
  game.updatePlayer(p, 0);
  assert.equal(p.charge, null);
  segundo.x = p.x + 100;
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.finalFlash);
});

test('mínimo individual e reserva depois do custo escolhem uma técnica mais barata ou nenhum ataque de Ki', () => {
  const { game, p, configurar } = luta();
  assert.ok(configurar([{ id: 'galick', ki: 80 }, 'finalFlash', 'bigBangAttack'], 40).ok);
  p.ki = p.stats.ki * .4 + BIG_BANG_ATTACK.custo;
  game.updatePlayer(p, 0);
  assert.ok(p.charge?.bigBangAttack);
  assert.ok(Math.abs(p.ki - p.stats.ki * .4) < 1e-8);
  p.charge = null;
  assert.ok(configurar(['finalFlash'], 40).ok);
  p.autoAttack = true;
  const ki = p.ki;
  game.updatePlayer(p, 0);
  assert.equal(p.charge, null);
  assert.equal(p.ki, ki);
  assert.equal(game.projectiles.length, 0);
  assert.equal(p.finalFlashReady, 0);
  assert.ok(FINAL_FLASH.custo > BIG_BANG_ATTACK.custo);
});

test('buff selecionado reativa com Ki durante a caça e respeita nível, safe zone e pausa', () => {
  const { game, p, entrada, configurar } = luta();
  assert.equal(configurar([], 25, 'majin').buffAplicado, true);
  p.autoSkills = false;
  assert.equal(p.forma, 'majin');
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'majin');
  p.ki = 0;
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'base');
  p.ki = p.stats.ki * CONFIG.transformacao.limiteAutomatico;
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'base');
  p.ki = p.stats.ki;
  const pos = { x: p.x, y: p.y };
  Object.assign(p, entrada);
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'base');
  Object.assign(p, pos, { autoHunt: false });
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'base');
  p.autoHunt = true;
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'majin');
  assert.ok(configurar([], 0, 'ultraEgo').ok);
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'majin');
});

test('buff de nível mais alto troca de forma ao desbloquear um degrau e guarda a escolha manual', () => {
  const { game, p, configurar } = luta(100);
  assert.ok(configurar([], 20, 'ssj', true).ok);
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'ssj');
  p.level = 200;
  p.ki = p.stats.ki * 0.49;
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'ssj');
  p.ki = p.stats.ki;
  game.updatePlayer(p, 0);
  assert.equal(p.forma, 'majin');
  const reconectado = game.addPlayer('outro', 'Lutador', game.exportPlayer(p));
  assert.equal(reconectado.comboAutoHunt.buffMaisAlto, true);
  assert.equal(reconectado.comboAutoHunt.buff, 'ssj');
  assert.equal(configurar([], 20, 'ssj', 'true').ok, false);
  assert.equal(configurar([], 20, 'ssj', false).buffAplicado, true);
  assert.equal(p.forma, 'ssj');
});

test('salvar aplica o buff sem seleção manual e sem ligar a caça, respeitando Ki e conjuração', () => {
  const { game, p, configurar } = luta();
  p.autoHunt = false;
  p.forma = 'base';
  p.ki = 1;
  assert.equal(configurar([], 20, null, true).buffAplicado, false);
  assert.equal(p.forma, 'base');
  p.ki = p.stats.ki;
  p.charge = { until: game.time + 1 };
  assert.equal(configurar([], 20, null, true).buffAplicado, false);
  assert.equal(p.forma, 'base');
  p.charge = null;
  assert.equal(configurar([], 20, null, true).buffAplicado, true);
  assert.equal(p.forma, 'ssjGod');
  assert.equal(p.autoHunt, false);
  assert.equal(configurar([], 20, 'ssj').buffAplicado, true);
  assert.equal(p.forma, 'ssj');
});

test('o servidor rejeita duplicatas e técnicas ou buffs de outras vocações e persiste o combo por personagem', () => {
  const { game, p, configurar } = luta();
  assert.ok(configurar(['bigBangAttack', 'galick'], 28, 'ssj').ok);
  assert.equal(configurar(['bigBangAttack', 'bigBangAttack']).ok, false);
  assert.equal(configurar(['kame']).ok, false);
  assert.equal(configurar(['galick'], 101).ok, false);
  assert.equal(configurar([], 20, 'ssj3').ok, false);
  assert.equal(configurar([{ id: 'galick', ki: -1 }]).ok, false);
  const salvo = game.exportPlayer(p);
  const outro = game.addPlayer('p2', 'Lutador', salvo);
  assert.deepEqual(game.snapshot(outro.id).self.comboAutoHunt, {
    ordem: [{ id: 'bigBangAttack', ki: 0 }, { id: 'galick', ki: 0 }], reserva: 28, buff: 'ssj', buffMaisAlto: false
  });
  assert.equal(outro.autoHunt, false);
  const goku = luta(500, 'goku');
  assert.equal(goku.configurar(['bigBangAttack']).ok, false);
  assert.ok(goku.configurar(['kame', 'genki'], 20, 'ssj4').ok);
});

test('pausar Auto Hunt cancela a canalização de Genki Dama disparada pelo combo', () => {
  const { game, p, configurar } = luta(500, 'goku');
  assert.ok(configurar(['genki', 'kame']).ok);
  game.updatePlayer(p, 0);
  assert.equal(game.genkiCharges.length, 1);
  game.updatePlayer(p, 0);
  assert.equal(p.charge, null);
  game.action(p.id, { type: 'hunt', enabled: false });
  game.atualizarGenkis(0);
  assert.equal(game.genkiCharges.length, 0);
});
