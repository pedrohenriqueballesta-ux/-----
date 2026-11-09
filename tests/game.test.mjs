import {criarSessaoTeste,reentrarSessaoTeste} from './auth-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, PLANETS, PORTAIS, statsFor, xpForLevel, bagWeight, lugar } from '../public/shared/index.mjs';
import { createGameServer } from '../server.mjs';

const world = () => new Game({ now: 1000, populate: false, random: () => 0.99 });
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds / 0.05); i++) game.tick(0.05); }
// Põe o jogador na chegada de uma área, já sem a proteção de chegada (para testar combate).
function naArea(game, p, area = 'inicial') { game.levar(p, lugar(area)); p.x += 180; p.seguroAte = 0; return p; }

test('sementes de potências diferentes compartilham a recarga, sem consumir item ao bloquear', () => {
  const game = world(), p = game.addPlayer('a'); p.hp = 10;
  assert.equal(game.useSeed(p, 15).ok, true);
  assert.equal(p.hp, 28);
  const count = p.inventory.seed100;
  assert.equal(game.useSeed(p, 100).ok, false);
  assert.equal(p.inventory.seed100, count);
  assert.equal(p.hp, 28);
  advance(game, CONFIG.seedCooldown + 0.1);
  assert.equal(game.useSeed(p, 100).ok, true);
  assert.equal(p.hp, p.stats.hp);
});

test('vida só regenera com comida ativa e o efeito termina após cinco minutos', () => {
  const game = world(), p = game.addPlayer('a'); p.hp = 10;
  advance(game, 10); assert.equal(p.hp, 10);
  const food = p.inventory.food;
  assert.equal(game.useFood(p).ok, true);
  assert.equal(p.inventory.food, food - 1);
  advance(game, 10); assert.ok(Math.abs(p.hp - 30) < 0.01);
  assert.equal(game.useFood(p).ok, false, 'comida ativa não empilha');
  advance(game, 291); p.hp = 10; advance(game, 1);
  assert.equal(p.hp, 10);
});

test('subir de nível aumenta todos os atributos automaticamente e libera técnicas', () => {
  const game = world(), p = game.addPlayer('a'), before = { ...p.stats };
  assert.equal(game.cast(p, 'ki').ok, false);
  game.awardXp(p, xpForLevel(1));
  assert.equal(p.level, 2);
  for (const key of Object.keys(before)) assert.ok(p.stats[key] > before[key], key + ' deve aumentar');
  assert.equal(game.cast(p, 'ki').ok, true);
  assert.equal(game.cast(p, 'kame').ok, false);
  game.awardXp(p, xpForLevel(2));
  naArea(game,p);
  const alvoKame = game.addMob('melee',p.x+70,p.y,p.area);p.targetId=alvoKame.id;
  const kiBeforeKame = p.ki;
  assert.equal(game.cast(p, 'kame').ok, true);
  assert.equal(p.ki, kiBeforeKame - CONFIG.skillCosts.kame);
  assert.equal(game.snapshot(p.id).self.kameRemaining, CONFIG.skillCooldowns.kame);
});

test('sem PvP nesta versão: dano entre jogadores é recusado em qualquer lugar, de soco ou Kamehameha', () => {
  const game = world(), a = game.addPlayer('a', 'Goku', { level: 3 }), b = game.addPlayer('b');
  assert.equal(game.hit(a, b, 30), false, 'na Terra');
  for (const area of ['inicial', 'media', 'dificil']) {
    naArea(game, a, area); naArea(game, b, area); b.x = a.x + 40;
    assert.equal(game.hit(a, b, 30), false, 'na hunt ' + area); assert.equal(b.hp, b.stats.hp);
  }
  a.aim = { x: b.x, y: b.y }; a.kameReady = 0;
  a.targetId=b.id;assert.equal(game.cast(a, 'kame').ok, false, 'jogador não pode ser alvo do Kamehameha');
  advance(game, 0.8); assert.equal(b.hp, b.stats.hp);
});

test('mochila respeita capacidade de peso e uma compra bloqueada não gasta Zeni', () => {
  const game = world(), p = game.addPlayer('a'); p.y = 300;
  p.stats.capacity = bagWeight(p.inventory);
  const count = p.inventory.food, money = p.zeni;
  assert.equal(game.buy(p, 'food').ok, false);
  assert.equal(p.inventory.food, count); assert.equal(p.zeni, money);
});

test('movimento manual interrompe a caça e desconexão suspende evolução AFK', () => {
  const game = world(), p = naArea(game, game.addPlayer('a'));
  game.action(p.id, { type: 'hunt' }); assert.equal(p.autoHunt, true);
  game.setInput(p.id, { x: 1, y: 0 }); assert.equal(p.autoHunt, false);
  p.connected = false; p.hp = 20; p.foodUntil = game.time + 50;
  advance(game, 5); assert.equal(p.hp, 20);
});

test('teclado e condução automática mantêm velocidade igual nas quatro diagonais', () => {
  // Mede só a velocidade: o mob anda na Terra, sem água nem caminho por terra no meio.
  for (const [x, y] of [[1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0]]) {
    const game = world(), p = game.addPlayer('a'); p.planet = 'namek'; p.x = 1650; p.y = 900;
    const origin = { x: p.x, y: p.y };
    game.setInput(p.id, { x, y }); game.tick(0.1);
    assert.ok(Math.abs(Math.hypot(p.x - origin.x, p.y - origin.y) - p.stats.mobility * 0.1) < 1e-8);
    assert.equal(Math.sign(p.x - origin.x), x);
    assert.equal(Math.sign(p.y - origin.y), y);
    const direction = game.snapshot(p.id).players[0].facing;
    assert.equal(Math.sign(direction.x), x); assert.equal(Math.sign(direction.y), y);
    const mob = game.addMob('melee', 550, 380); mob.planet = 'terra'; mob.area = null;
    game.steer(mob, { x: mob.x + x * 100, y: mob.y + y * 100 }, 0.1, mob.speed);
    assert.ok(Math.abs(Math.hypot(mob.x - 550, mob.y - 380) - mob.speed * 0.1) < 1e-8);
    assert.equal(Math.sign(mob.facing.x), x); assert.equal(Math.sign(mob.facing.y), y);
  }
});

test('Saibaman, sentinela, subchefe e chefe transmitem direção e recuperação sem antecipar o dano', () => {
  for (const type of ['melee', 'ranged', 'subboss', 'boss']) {
    const game = world(), p = naArea(game, game.addPlayer('a')); p.x = 2800; p.y = 2000;
    const mob = game.addMob(type, 2775, 2025); mob.attackReady = game.time;
    game.tick(0.05);
    const view = game.snapshot(p.id).mobs[0];
    assert.ok(view.facing.x > 0 && view.facing.y < 0);
    assert.equal(view.strike.release, view.telegraph.until);
    assert.equal(p.hp, p.stats.hp, 'aviso não causa dano');
    const release = view.strike.release;
    game.time = release - 0.01; game.tick(0.01);
    const recovery = game.snapshot(p.id).mobs[0];
    assert.equal(recovery.telegraph, null);
    assert.ok(recovery.strike.until > game.time, 'a recuperação continua após o golpe');
    assert.equal(recovery.strike.release, release);
    if (type !== 'ranged') assert.ok(p.hp < p.stats.hp);
    else assert.ok(game.projectiles.some(s => s.owner === mob.id));
  }
});

test('transformação exige nível e termina quando o Ki acaba', () => {
  const game = world(), low = game.addPlayer('a'), high = game.addPlayer('b', 'Goku', { level: 5 });
  assert.equal(game.action(low.id, { type: 'transform' }).ok, false);
  const kiBeforeTransform = high.ki;
  assert.equal(game.action(high.id, { type: 'transform' }).ok, true);
  assert.equal(high.ki, kiBeforeTransform - CONFIG.skillCosts.transform);
  assert.equal(game.snapshot(high.id).self.transformRemaining, CONFIG.skillCooldowns.transform);
  high.ki = 0.1; advance(game, 0.1); assert.equal(high.transformed, false);
});

test('caça automática sustenta uma sessão inicial, derrota mobs e evolui sem entrada manual', () => {
  // Entra nas Planícies pelo portal e caça a hunt inteira, contornando a água por terra.
  const game = new Game({ now: 1000, random: () => 0.5 });
  const p = game.addPlayer('a'); game.levar(p, lugar('inicial'));
  game.action(p.id, { type: 'hunt' });
  advance(game, 60);
  assert.ok(p.kills >= 10);
  assert.ok(p.level >= 3);
  assert.ok(p.hp > 0);
  assert.equal(p.autoHunt, true);
  assert.equal(p.inventory.food, 4);
});

test('caça automática troca imediatamente para o mob mais próximo', () => {
  const game = world(), p = naArea(game, game.addPlayer('a'));
  const distante = game.addMob('melee', p.x + 110, p.y, 'inicial');
  game.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  game.tick(0.05);
  assert.equal(p.targetId, distante.id);

  const proximo = game.addMob('melee', p.x + 45, p.y, 'inicial');
  game.tick(0.05);
  assert.equal(p.targetId, proximo.id, 'não espera matar o alvo anterior');
});

test('caça automática mantém o alvo quando as distâncias quase empatam e evita tremedeira', () => {
  const game = world(), p = naArea(game, game.addPlayer('a'));
  const a = game.addMob('melee', p.x + 120, p.y, 'inicial');
  const b = game.addMob('melee', p.x + 128, p.y, 'inicial');
  game.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  game.tick(0.05);
  assert.equal(p.targetId, a.id);
  a.x = p.x + 132; b.x = p.x + 124;
  game.tick(0.05);
  assert.equal(p.targetId, a.id, 'uma diferença pequena não reinicia a rota a cada passo');
  b.x = p.x + 55;
  game.tick(0.05);
  assert.equal(p.targetId, b.id, 'troca quando outro alvo está claramente mais perto');
});

test('caça automática segue um trecho reto sem oscilar de lado', () => {
  const game = world(), p = naArea(game, game.addPlayer('a'));
  game.addMob('melee', p.x + 180, p.y, 'inicial');
  game.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  const yInicial = p.y;
  for (let i = 0; i < 12; i++) game.tick(0.05);
  assert.ok(p.x > 2580, 'avançou em direção ao alvo');
  assert.ok(Math.abs(p.y - yInicial) < 20, 'não alternou para os lados durante a perseguição');
});

test('caça automática sorteia pontos de patrulha diferentes pela hunt quando não há mobs por perto', () => {
  const patrulhaComSorteio = sorteio => {
    const game = world(), p = naArea(game, game.addPlayer('a'));
    const primeiro = game.addMob('melee', 5500, 2800, 'inicial');
    game.addMob('melee', 2250, 1300, 'inicial');
    const terceiro = game.addMob('melee', 5700, 1350, 'inicial');
    game.random = () => sorteio;
    p.autoHunt = true;
    const patrulha = game.proximaPatrulha(p);
    return { alvo: patrulha?.id, primeiro: primeiro.id, terceiro: terceiro.id };
  };
  const inicio = patrulhaComSorteio(0), fim = patrulhaComSorteio(0.99);
  assert.equal(inicio.alvo, inicio.primeiro);
  assert.equal(fim.alvo, fim.terceiro);
});

// Anda até o portal que leva ao destino, no lugar onde o jogador está, e usa.
function porPortal(game, p, destino) {
  const o = PORTAIS.find(o => o.planet === p.planet && o.area === (p.area || null) && o.destinos.includes(destino));
  if (o) { p.x = o.x; p.y = o.y + 20; }
  return game.action(p.id, { type: 'portal', destino });
}

test('jogador nasce na Terra e viaja só por portal: Terra → Vila → hunts → Vila → Terra', () => {
  const game = new Game({ now: 1000, random: () => 0.5 });
  const p = game.addPlayer('a');
  assert.equal(p.planet, 'terra');
  assert.equal(game.snapshot(p.id).mobs.length, 0, 'sem inimigos na Terra');
  assert.equal(game.action(p.id, { type: 'portal', destino: 'vila' }).ok, false, 'longe do portal não viaja');
  assert.equal(game.action(p.id, { type: 'travelPlanet', planet: 'namek' }).ok, false, 'a viagem por menu saiu');
  assert.equal(porPortal(game, p, 'vila').ok, true);
  assert.deepEqual([p.planet, p.area], ['namek', 'vila']);
  assert.equal(game.snapshot(p.id).mobs.length, 0, 'Vila sem inimigos');
  assert.equal(porPortal(game, p, 'inicial').ok, true);
  const naInicial = game.snapshot(p.id);
  assert.equal(naInicial.area, 'inicial');
  assert.ok(naInicial.mobs.length > 0 && naInicial.mobs.every(m => m.area === 'inicial' && ['passaro', 'inseto'].includes(m.type)), 'só os mobs básicos da hunt inicial');
  assert.equal(porPortal(game, p, 'dificil').ok, true, 'da saída de uma hunt vai direto a outra');
  assert.ok(game.snapshot(p.id).mobs.every(m => m.type === 'porunga'), 'só Porungas na hunt difícil (o chefe raro ainda não nasceu)');
  assert.equal(porPortal(game, p, 'terra').ok, false, 'da hunt não se vai à Terra');
  assert.equal(porPortal(game, p, 'vila').ok, true);
  assert.equal(porPortal(game, p, 'terra').ok, true);
  assert.deepEqual([p.planet, p.area], ['terra', null]);
});

test('hunt da média tem Guerreiros de Namek, Veteranos de Namek e o subchefe; nível abaixo do recomendado entra com aviso', () => {
  const game = new Game({ now: 1000, random: () => 0.5 }), p = game.addPlayer('a');
  porPortal(game, p, 'vila');
  assert.equal(porPortal(game, p, 'media').ok, true, 'nível 1 entra na hunt média (só recomendação)');
  assert.ok(game.events.some(e => e.type === 'message' && /cuidado/.test(e.text)));
  const tipos = new Set(game.snapshot(p.id).mobs.map(m => m.type));
  assert.deepEqual([...tipos].sort(), ['guerreiro', 'subboss', 'veterano']);
  const media = [...game.mobs.values()].filter(m => m.area === 'media');
  assert.equal(media.filter(m => m.type === 'guerreiro').length, media.filter(m => m.type === 'veterano').length);
  assert.ok(media.filter(m => m.type === 'guerreiro').every(m => m.name === 'Guerreiro de Namek'));
  assert.ok(media.filter(m => m.type === 'veterano').every(m => m.name === 'Veterano de Namek'));
});

test('chegada protegida permanentemente; sair permite combate e morte volta ao quadrado', () => {
  const game = world(), p = game.addPlayer('a');
  game.levar(p, lugar('inicial'));
  const mob = game.addMob('melee', p.x + 30, p.y); mob.attackReady = game.time;
  assert.equal(game.hit(mob, p, 30), false, 'protegido logo após chegar');
  advance(game, CONFIG.chegadaSegura + 0.1);
  assert.equal(game.hit(mob, p, 30), false, 'continua protegido no quadrado');
  p.x += 100; assert.equal(game.hit(mob, p, 30), true, 'fora do quadrado leva dano');
  p.x += 600; p.hp = 1; game.hit(mob, p, 999);
  assert.equal(p.hp, 0);
  advance(game, CONFIG.respawnDelay + 0.1);
  assert.equal(p.area, 'inicial', 'renasce na mesma hunt');
  assert.deepEqual([Math.round(p.x), Math.round(p.y)], [Math.round(lugar('inicial').chegada.x), Math.round(lugar('inicial').chegada.y)]);
  assert.ok(game.protegido(p), 'protegido ao renascer');
});

test('áreas isoladas: golpe, projétil e aggro não passam de uma área para outra', () => {
  const game = world(), p = naArea(game, game.addPlayer('a', 'Goku', { level: 10 }), 'inicial');
  const outra = game.addMob('melee', p.x + 30, p.y, 'media'); outra.attackReady = game.time;
  assert.equal(game.hit(p, outra, 50), false, 'jogador não acerta mob de outra área');
  assert.equal(game.hit(outra, p, 50), false, 'mob de outra área não acerta o jogador');
  advance(game, 1); assert.equal(outra.telegraph, null, 'mob de outra área não persegue');
  assert.equal(game.snapshot(p.id).mobs.some(m => m.id === outra.id), false, 'nem aparece para o jogador');
  assert.equal(game.cast(p, 'genki').ok, true); advance(game, 0.5);
  assert.equal(outra.hp, outra.maxHp, 'Genki Dama não atravessa');
});

test('caça automática só dentro das hunts', () => {
  const game = world(), p = game.addPlayer('a');
  assert.equal(game.action(p.id, { type: 'hunt' }).ok, false, 'na Terra não');
  game.levar(p, lugar('vila'));
  assert.equal(game.action(p.id, { type: 'hunt' }).ok, false, 'na Vila não');
  game.levar(p, lugar('media'));
  assert.equal(game.action(p.id, { type: 'hunt' }).ok, true);
  assert.equal(game.action(p.id, { type: 'hunt', enabled: false }).ok, true);
  assert.equal(p.autoHunt, false);
});

test('duas sessões HTTP reais recebem o mundo compartilhado e entradas não alteram atributos', async () => {
  const app = await createGameServer({ port: 0, dataDir: null });
  const base = 'http://127.0.0.1:' + app.port;
  const post = async (path, data, token) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data) });
    return { status: res.status, value: await res.json() };
  };
  const controllers = [];
  try {
    const a = await criarSessaoTeste(base,'Jogador A');
    const b = await criarSessaoTeste(base,'Jogador B');
    assert.notEqual(a.playerId, b.playerId);
    assert.notEqual(a.token, b.token);
    for (const session of [a, b]) {
      const controller = new AbortController(); controllers.push(controller);
      const res = await fetch(base + '/api/events', {headers:{Authorization:'Bearer '+session.token},signal:controller.signal});
      assert.equal(res.status, 200); const reader = res.body.getReader(); let text = '';
      while (!text.includes('data: ')) text += new TextDecoder().decode((await reader.read()).value);
      const first = JSON.parse(text.split('data: ')[1].split('\n')[0]);
      assert.equal(first.players.length, 2);
      assert.ok(first.players.some(p => p.id === a.playerId));
      assert.ok(first.players.some(p => p.id === b.playerId));
    }
    await post('/api/input', { x: 1, y: 0, hp: 99999, level: 100 }, a.token);
    assert.equal(app.game.players.get(a.playerId).level, 1);
    assert.equal(app.game.players.get(a.playerId).stats.hp, statsFor(1).hp);
    const unauthorized = await post('/api/action', { type: 'seed' }, 'inventado');
    assert.equal(unauthorized.status, 401);
  } finally { controllers.forEach(c => c.abort()); await app.close(); }
});

test('Kaioken alterna sem custo nem recarga; Barreira preserva duração e recarga', () => {
  const game = world(), p = game.addPlayer('power', 'Goku', { level: 1 });
  assert.equal(game.cast(p, 'kaioken').ok, false);
  assert.equal(game.cast(p, 'barrier').ok, false);
  game.awardXp(p, xpForLevel(1));
  assert.equal(p.level, 2);
  const kiBefore = p.ki;
  assert.equal(game.cast(p, 'kaioken').ok, true);
  assert.equal(p.ki, kiBefore, 'Decisão do Pedro em 09/11: ativação gratuita');
  assert.equal(game.snapshot(p.id).self.kaiokenActive, true);
  assert.equal(game.snapshot(p.id).self.kaiokenRemaining, CONFIG.skillCooldowns.kaioken);
  assert.equal(game.cast(p, 'kaioken').ok, true);
  assert.equal(p.forma, 'base');
  game.cast(p, 'kaioken');
  advance(game, 6.1);
  assert.equal(game.snapshot(p.id).self.kaiokenActive, true, 'Não há duração fixa de seis segundos');
  assert.equal(game.snapshot(p.id).self.kaiokenRemaining, 0);

  const defended = world(), dp = naArea(defended, defended.addPlayer('defended', 'Goku', { level: 2 }));
  const attacker = defended.addMob('melee', dp.x + 20, dp.y);
  const hpBefore = dp.hp;
  const kiBeforeBarrier = dp.ki;
  assert.equal(defended.cast(dp, 'barrier').ok, true);
  assert.equal(dp.ki, kiBeforeBarrier - CONFIG.skillCosts.barrier);
  assert.equal(defended.hit(attacker, dp, 30), true);
  const mitigated = hpBefore - dp.hp;
  assert.ok(mitigated > 0 && mitigated < 30, 'a barreira reduz o dano recebido');
  assert.equal(defended.snapshot(dp.id).self.barrierActive, true);
  assert.equal(defended.snapshot(dp.id).self.barrierRemaining, CONFIG.skillCooldowns.barrier);
});

test('Genki Dama só libera no nível 10 e atinge o alvo com projétil de área', () => {
  const game = world(), p = naArea(game, game.addPlayer('ultimate', 'Goku', { level: 9 }));
  assert.equal(game.cast(p, 'genki').ok, false);
  game.awardXp(p, xpForLevel(9));
  assert.equal(p.level, 10);
  const target = game.addMob('melee', p.x + 35, p.y - 22);
  const kiBefore = p.ki;
  assert.equal(game.cast(p, 'genki').ok, true);
  assert.equal(p.ki, kiBefore - 60);
  assert.equal(game.snapshot(p.id).self.genkiRemaining, CONFIG.skillCooldowns.genki);
  advance(game, 0.45);
  assert.equal(target.hp, target.maxHp, 'não causa dano durante a canalização');
  advance(game, 2);
  assert.equal(target.hp, 0, 'o projétil da Genki Dama deve acertar o alvo próximo');
  assert.equal(game.cast(p, 'genki').ok, false, 'a técnica ainda está na recarga de 45 segundos');
  advance(game, 0.6);
  assert.equal(game.cast(p, 'genki').ok, false, 'a técnica continua em recarga após 1 segundo');
});

test('dá para chegar andando (clique no chão) a cada portal, partindo da chegada da área', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 }), p = game.addPlayer('a');
  for (const o of PORTAIS) {
    game.levar(p, lugar(o.area || 'terra'));
    game.action(p.id, { type: 'moveTo', x: o.x, y: o.y });
    let t = 0; while (t < 20 && Math.hypot(p.x - o.x, p.y - o.y) > 20) { game.tick(0.05); t += 0.05; }
    assert.ok(Math.hypot(p.x - o.x, p.y - o.y) <= 20, o.id + ': travou a ' + Math.round(Math.hypot(p.x - o.x, p.y - o.y)) + ' do portal');
  }
});

test('andar por clique contorna quina de casa e recorte de penhasco sem travar', () => {
  // Casos que travavam antes de 03/11: porta da casa 2 na Vila e um recorte de penhasco no Planalto.
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 }), p = game.addPlayer('a');
  // (A casa da Vila saiu do mapa por ora; o caso da quina fica coberto pelas ruínas e pelo penhasco.)
  for (const [area, alvo] of [['vila', { x: 936, y: 2952 }], ['dificil', { x: 6522, y: 1466 }], ['dificil', { x: 6686, y: 1230 }]]) {
    game.levar(p, lugar(area)); game.action(p.id, { type: 'moveTo', ...alvo });
    let t = 0; while (t < 20 && Math.hypot(p.x - alvo.x, p.y - alvo.y) > 20) { game.tick(0.05); t += 0.05; }
    assert.ok(Math.hypot(p.x - alvo.x, p.y - alvo.y) <= 20, area + ': travou em ' + Math.round(p.x) + ',' + Math.round(p.y));
  }
});

test('hunt fácil: 20 mobs, metade Pássaro e metade Inseto de Namek, os dois de perto', () => {
  const game = new Game({ now: 1000, random: () => 0.5 });
  const mobs = [...game.mobs.values()].filter(m => m.area === 'inicial');
  assert.equal(mobs.length, 20);
  assert.equal(mobs.filter(m => m.type === 'passaro').length, 10);
  assert.equal(mobs.filter(m => m.type === 'inseto').length, 10);
  assert.deepEqual([...new Set(mobs.map(m => m.name))].sort(), ['Inseto de Namek', 'Pássaro de Namek']);
  for (const type of ['passaro', 'inseto']) {
    const g = world(), p = naArea(g, g.addPlayer('a')); p.x = 2650; p.y = 2000;
    const mob = g.addMob(type, 2700, 2000); mob.attackReady = g.time; g.tick(0.05);
    assert.equal(mob.telegraph?.kind, 'area', type + ' ataca de perto');
  }
});

test('Veterano de Namek dispara de longe e soca de perto; Guerreiro de Namek só de perto', () => {
  for (const [tipo, dist, golpe] of [['veterano', 180, 'shot'], ['veterano', 40, 'area'], ['guerreiro', 40, 'area']]) {
    const g = world(), p = naArea(g, g.addPlayer('a'), 'media'); p.x = 2650; p.y = 4000;
    const mob = g.addMob(tipo, 2650 + dist, 4000, 'media'); mob.attackReady = g.time; g.tick(0.05);
    assert.equal(mob.telegraph?.kind, golpe, tipo + ' a ' + dist);
  }
});

test('caça automática sai de fresta sem saída na beira do penhasco (travava olhando para o norte)', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 }), p = naArea(game, game.addPlayer('a', 'Goku', { level: 12 }), 'media');
  p.x = 5880; p.y = 3824; p.autoAttack = false; p.autoSkills = false;
  const mob = game.addMob('veterano', 5931, 3689, 'media'); mob.attackReady = Infinity;
  game.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  advance(game, 3);
  assert.ok(Math.hypot(mob.x - p.x, mob.y - p.y) < 60, 'chegou ao alvo');
});

test('caça automática não persegue um mob isolado atrás de água ou penhasco', async () => {
  const { caminhoPorTerra } = await import('../public/shared/passagem.mjs');
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 });
  const p = naArea(game, game.addPlayer('a'), 'media');
  const isolado = game.addMob('guerreiro', 5904, 3708, 'media');
  assert.equal(caminhoPorTerra(p.planet, p, isolado, p.area, 40), null, 'o local do alvo não tem ligação por terra');
  game.action(p.id, { type: 'hunt' }); p.autoAttack = false; p.autoSkills = false;
  const antes = { x: p.x, y: p.y }; advance(game, 1);
  assert.equal(p.targetId, null, 'a caça não fixa o alvo inacessível');
  assert.deepEqual({ x: p.x, y: p.y }, antes, 'não empurra o personagem contra a barreira');
});

test('Veterano de Namek se aproxima enquanto ataca, em vez de ficar parado atirando', () => {
  const game = world(), p = naArea(game, game.addPlayer('a', 'Goku', { level: 12 }), 'media'); p.x = 2650; p.y = 4000;
  const v = game.addMob('veterano', 2850, 4000, 'media');
  for (let i = 0; i < 40; i++) { game.tick(0.05); p.hp = p.stats.hp; }
  assert.ok(Math.hypot(v.x - p.x, v.y - p.y) < 120);
});

test('hunt difícil tem Porunga (de perto, voando) no lugar do Saibaman de elite', () => {
  const game = new Game({ now: 1000, random: () => 0.5 });
  const dificil = [...game.mobs.values()].filter(m => m.area === 'dificil');
  assert.ok(dificil.some(m => m.type === 'porunga' && m.name === 'Porunga'));
  assert.equal(dificil.filter(m => m.type === 'melee').length, 0);
  const g = world(), p = naArea(g, g.addPlayer('a', 'Goku', { level: 20 }), 'dificil'); p.x = 6300; p.y = 2000;
  const mob = g.addMob('porunga', 6340, 2000, 'dificil'); mob.attackReady = g.time; g.tick(0.05);
  assert.equal(mob.telegraph?.kind, 'area', 'Porunga ataca de perto');
});

test('chefe raro: nasce no círculo do planalto entre 45 e 90 minutos, e de novo no mesmo intervalo', async () => {
  const { CIRCULO_DO_CHEFE } = await import('../public/shared/enemies.mjs');
  const game = new Game({ now: 1000, random: () => 0.5 }), chefe = [...game.mobs.values()].find(m => m.type === 'boss');
  assert.equal(chefe.hp, 0, 'não está no mapa quando o servidor liga');
  assert.ok(chefe.deadUntil - game.time >= 45 * 60 && chefe.deadUntil - game.time <= 90 * 60);
  const p = naArea(game, game.addPlayer('a'), 'dificil');
  game.time = chefe.deadUntil; game.tick(0.05);
  assert.equal(chefe.hp, chefe.maxHp, 'apareceu');
  assert.ok(Math.hypot(chefe.x - CIRCULO_DO_CHEFE.x, chefe.y - CIRCULO_DO_CHEFE.y) <= CIRCULO_DO_CHEFE.r + 1, 'dentro do círculo');
  assert.ok(game.events.some(e => e.type === 'message' && e.playerId === p.id && /apareceu/.test(e.text)), 'avisou quem está na hunt');
  game.hit(p, chefe, 1e9);
  assert.ok(chefe.deadUntil - game.time >= 45 * 60 - 1 && chefe.deadUntil - game.time <= 90 * 60, 'volta entre 45 e 90 min');
});

test('modo de teste do chefe: nasce em 10 s e volta em 60 s (o jogo normal não muda)', () => {
  const game = new Game({ now: 1000, random: () => 0.5, chefeJa: true }), chefe = [...game.mobs.values()].find(m => m.type === 'boss');
  assert.equal(chefe.deadUntil - game.time, 10);
  game.time = chefe.deadUntil; game.tick(0.05); assert.equal(chefe.hp, chefe.maxHp);
  game.hit(null, chefe, 1e9); assert.ok(Math.abs(chefe.deadUntil - game.time - 60) < 0.01);
});
