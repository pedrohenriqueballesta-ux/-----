import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, PORTAIS, PLANETS, lugar } from '../public/shared/nucleo/config.mjs';
import { mobStats, spawnPoints, janelaRenascimento } from '../public/shared/nucleo/enemies.mjs';
import { xpAjustadoPorNivel, fatorXPPorDiferencaNivel, fatorDanoDaHunt, progressoAposMorte } from '../public/shared/sistemas/progressao.mjs';
import { statsFor, xpForLevel } from '../public/shared/nucleo/characters.mjs';

test('as 15 hunts se alternam entre planetas e cobrem todos os níveis de 1 a 1000', () => {
  const hunts = ['terra-hunts', 'namek', 'vegeta'].flatMap(planet => PLANETS[planet].hunts)
    .map(lugar).sort((a, b) => a.nivel[0] - b.nivel[0]);
  assert.equal(hunts.length, 15);
  assert.equal(hunts[0].planet, 'terra-hunts');
  assert.equal(hunts[0].nivel[0], 1);
  assert.equal(hunts.at(-1).nivel[1], CONFIG.progression.nivelMaximo);
  for (let i = 1; i < hunts.length; i++) {
    assert.notEqual(hunts[i].planet, hunts[i - 1].planet, hunts[i].id);
    assert.equal(hunts[i].nivel[0], hunts[i - 1].nivel[1], hunts[i].id);
  }
  for (const spawn of spawnPoints(() => 0.5)) {
    const mob = mobStats(spawn.type, spawn.area);
    const [inicio, fim] = lugar(spawn.area).nivel;
    assert.ok(Number.isInteger(mob.level) && mob.level >= inicio && mob.level <= fim, spawn.area + ':' + spawn.type);
  }
  assert.equal(mobStats('cellPerfeito', 'terra-deserto').level, lugar('terra-ilha').nivel[1]);
});

test('recarga do spawn comum respeita a janela da hunt após um abate no servidor', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
  const p = game.addPlayer('respawn', 'Teste');
  const area = 'terra-montanhas';
  game.levar(p, lugar(area));
  p.x += 200; p.seguroAte = 0;
  const m = game.addMob('estegossauro', p.x + 60, p.y, area);
  const janela = janelaRenascimento(m.type, area);
  assert.deepEqual(janela, { minimo: 40, maximo: 55 });
  game.hit(p, m, 100000);
  assert.equal(m.deadUntil - game.time, 47.5);
  game.time = m.deadUntil - 1;
  game.updateMob(m, .05);
  assert.equal(m.hp, 0);
  game.time += 2;
  game.updateMob(m, .05);
  assert.equal(m.hp, m.maxHp);
});

test('XP de mobs iguais ao nível mantém recompensa integral; diferença reduz sem zerar', () => {
  assert.equal(fatorXPPorDiferencaNivel(20, 20), 1);
  assert.equal(xpAjustadoPorNivel(100, 60, 60), 100);
  assert.equal(xpAjustadoPorNivel(100, 70, 10), 71);
  assert.ok(fatorXPPorDiferencaNivel(1000, 60) >= CONFIG.progression.penalidadeXP.minimo);
  assert.ok(xpAjustadoPorNivel(100, 1000, 60) > 0, 'hunt antiga segue útil para XP');
  assert.equal(xpAjustadoPorNivel(0, 100, 1), 0);
});

test('recompensa de abate usa o nível da criatura e continua no servidor', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
  const p = game.addPlayer('xp', 'Teste', { level: 50 });
  game.levar(p, lugar('vegeta-planicies')); p.x += 180; p.seguroAte = 0;
  const mob = game.addMob('tsufuruGuerreiro', p.x + 100, p.y, 'vegeta-planicies');
  assert.equal(mob.level, 51);
  game.hit(p, mob, 100000);
  assert.equal(p.xp, xpAjustadoPorNivel(mob.xp, p.level, mob.level));
  assert.equal(p.kills, 1);
});

test('Auto Hunt continua abatendo mobs antigos e recebendo XP reduzido em nível avançado', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
  const p = game.addPlayer('auto-xp', 'Teste', { level: 100 });
  game.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  const mob = game.addMob('inseto', p.x + 60, p.y, 'inicial');
  p.autoHunt = true; p.autoAttack = true;
  for (let i = 0; i < 80 && p.kills === 0; i++) game.tick(0.05);
  assert.equal(p.kills, 1);
  assert.ok(p.xp > 0 && p.xp < mob.xp, 'XP positivo, reduzido pela diferença de níveis');
});

test('expansão não bloqueia acesso a hunts recomendadas para níveis mais altos', () => {
  const game = new Game({ now: 1000, populate: false, random: () => 0.5 });
  const p = game.addPlayer('baixo', 'Teste', { level: 1 });
  game.levar(p, lugar('vegeta-cidade'));
  const portal = PORTAIS.find(o => o.area === 'vegeta-cidade' && o.destinos.includes('vegeta-cratera'));
  p.x = portal.x; p.y = portal.y;
  assert.equal(game.usePortal(p, 'vegeta-cratera').ok, true);
  assert.equal(p.level, 1);
  assert.equal(p.area, 'vegeta-cratera');
});

test('a recompensa por abate aumenta, mas representa menos da barra nos níveis mais altos', () => {
  assert.equal(statsFor(100, 'goku').attack, 289.2);
  assert.ok(statsFor(1000, 'goku').attack > statsFor(100, 'goku').attack);
  const especies = [
    mobStats('tiranossauro', 'terra-montanhas'), mobStats('hatchiyack', 'vegeta-planicies'),
    mobStats('bardock', 'vegeta-floresta'), mobStats('broly', 'vegeta-cratera'),
  ];
  for (let i = 1; i < especies.length; i++) {
    const anterior = especies[i - 1], atual = especies[i];
    for (const atributo of ['level', 'hp', 'attack', 'defesa', 'xp']) assert.ok(atual[atributo] > anterior[atributo], atributo);
    assert.ok(atual.xp / xpForLevel(atual.level) < anterior.xp / xpForLevel(anterior.level));
  }
  assert.equal(especies.at(-1).level, 1000);
  assert.equal(xpForLevel(1), 30);
  assert.equal(xpForLevel(100), Math.round(30 * 100 ** 1.35));
});

test('God Mode leva ao nível máximo e desligá-lo restaura nível e recursos reais', () => {
  const game = new Game({ now: 1000, populate: false });
  const p = game.addPlayer('godmode', 'Teste', { level: 37, hp: 321, ki: 123, zeni: 456 });
  assert.equal(game.action(p.id, { type: 'godmode' }).ok, true);
  assert.equal(p.level, 1000);
  assert.equal(p.stats.hp, statsFor(1000).hp);
  assert.equal(p.stats.attack, statsFor(1000).attack);
  assert.equal(p.hp, p.stats.hp);
  assert.equal(p.ki, p.stats.ki);
  assert.equal(p.xp, 0);
  assert.equal(game.action(p.id, { type: 'godmode' }).ok, true);
  assert.deepEqual([p.level, p.hp, p.ki, p.zeni], [37, 321, 123, 456]);
});

test('morte desconta níveis inteiros, preserva a fração de XP e respeita o nível mínimo', () => {
  for (const [nivel, destino] of [[10, 9], [250, 249], [251, 249], [501, 498], [751, 747], [1000, 996]]) {
    const xp = Math.floor(xpForLevel(nivel) / 2);
    const resultado = progressoAposMorte(nivel, xp);
    const xpRestante = Math.floor(xp / xpForLevel(nivel) * xpForLevel(destino));
    let perda = xp - xpRestante;
    for (let n = destino; n < nivel; n++) perda += xpForLevel(n);
    assert.deepEqual(resultado, { nivel: destino, xp: xpRestante, perda });
  }
  assert.deepEqual(progressoAposMorte(1, 10), { nivel: 1, xp: 0, perda: 10 });
});

test('golpe fatal aplica perda uma vez, atualiza atributos e salva o novo progresso', () => {
  const g = new Game({ populate: false, now: 100 });
  const p = g.addPlayer('a', 'Goku', { level: 500, xp: 0, bonusPremium: { capacidade: 20 } });
  Object.assign(p, { planet: 'namek', area: 'inicial', x: 1000, y: 1000, hp: 1, forma: 'ssj4', autoHunt: true });
  const m = g.addMob('saibaman', 1000, 1020, 'inicial');
  const antes = structuredClone(p.inventory);
  assert.equal(g.hit(m, p, 1e8), true);
  assert.equal(p.level, 498);
  assert.equal(p.forma, 'base');
  assert.equal(p.autoHunt, false);
  assert.deepEqual(p.stats, statsFor(498, p.vocacao, p.equipamentos, 20));
  assert.deepEqual(p.inventory, antes);
  assert.ok(g.snapshot(p.id).events.some(e => e.type === 'message' && /Perdeu .+ XP\. Nível 500 → 498\./.test(e.text)));
  const xp = p.xp;
  assert.equal(g.hit(m, p, 1e8), false);
  g.time += CONFIG.respawnDelay;
  g.updatePlayer(p, 0.02);
  assert.equal(p.hp, p.stats.hp);
  assert.equal(p.xp, xp);
  const reentrada = g.addPlayer('b', p.name, g.exportPlayer(p));
  assert.deepEqual([reentrada.level, reentrada.xp], [498, xp]);
});

test('morte em God Mode com HP finito preserva o progresso real', () => {
  const g = new Game({ populate: false, now: 100 });
  const p = g.addPlayer('a', 'Teste', { level: 80, xp: 451, godmode: true, godmodeOptions: { hpInfinite: false } });
  Object.assign(p, { planet: 'namek', area: 'inicial', x: 1000, y: 1000, hp: 1 });
  const m = g.addMob('saibaman', 1000, 1020, 'inicial');
  assert.equal(g.hit(m, p, 1e8), true);
  assert.equal(p.level, CONFIG.progression.nivelMaximo);
  assert.deepEqual([g.exportPlayer(p).level, g.exportPlayer(p).xp], [80, 451]);
});

test('risco da hunt cresce só abaixo da entrada e é limitado', () => {
  for (const nivel of [300, 380, 1000]) assert.equal(fatorDanoDaHunt(nivel, 300), 1);
  assert.equal(fatorDanoDaHunt(1), 1);
  assert.ok(fatorDanoDaHunt(299, 300) < 1.03);
  assert.ok(fatorDanoDaHunt(250, 300) < fatorDanoDaHunt(230, 300));
  assert.equal(fatorDanoDaHunt(1, 1000), 4);
});

test('entrar antes da faixa mantém o XP integral, mas a mesma sequência de golpes pode matar', () => {
  function combate(level) {
    const g = new Game({ now: 1000, populate: false, random: () => 0.5, randomCombat: () => 0.5 });
    const p = g.addPlayer('p', 'Teste', { level });
    const destino = lugar('vegeta-floresta');
    g.levar(p, destino);
    p.x += 180;
    p.seguroAte = 0;
    const mob = g.addMob('nappa', p.x + 60, p.y, destino.id);
    const segundoMob = g.addMob('nappa', p.x + 80, p.y, destino.id);
    assert.equal(g.action(p.id, { type: 'hunt' }).ok, true);
    assert.equal(g.hit(p, segundoMob, 1000000), true);
    const xp = p.xp;
    assert.equal(xp, segundoMob.xp);
    // Isola o fator de risco com a mesma vida e defesa nas duas comparações.
    p.hp = 1000;
    p.stats.defense = 100;
    for (let i = 0; i < 5 && p.hp > 0; i++) g.hit(mob, p, 250);
    return { p, xp };
  }
  const naFaixa = combate(300);
  const abaixo = combate(230);
  assert.ok(naFaixa.p.hp > 0);
  assert.equal(naFaixa.p.autoHunt, true);
  assert.equal(abaixo.p.hp, 0);
  assert.equal(abaixo.p.autoHunt, false);
  assert.equal(abaixo.p.level, 229);
  assert.equal(abaixo.xp, naFaixa.xp);
});
