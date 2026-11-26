import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { PORTAIS, lugar } from '../public/shared/nucleo/config.mjs';
import { createPlayer, exportPlayer } from '../public/shared/nucleo/characters.mjs';
import { METAS_SAGA_CELL, BILHETE_LABORATORIO } from '../public/shared/sistemas/saga-cell.mjs';
import { dropsEspecificos } from '../public/shared/sistemas/catalogo-itens.mjs';

// Saga do Cell (Pedro, 25/11/2026): bilhete do C20 → filhos do Cell → Semiperfeito → Ilha → Semiperfeito → Cell Perfeito.
const etapa = (g, p, n) => g.action(p.id, { type: 'resgatarMissao', id: 'saga-cell-' + n });
const estado = (g, p, n) => g.snapshot(p.id).self.missoes.find(m => m.id === 'saga-cell-' + n).estado;
function abater(g, p, tipo, area, quantos) {
  for (let i = 0; i < quantos; i++) {
    const m = [...g.mobs.values()].find(m => m.type === tipo && m.area === area && !m.dono);
    assert.ok(m, 'há ' + tipo + ' em ' + area);
    m.hp = m.maxHp; p.x = m.x; p.y = m.y;
    assert.equal(g.hit(p, m, 1e9), true); m.hp = m.maxHp;   // volta logo, para a próxima volta do laço
  }
}
function chefePessoal(g, p) { g.proximaSincroniaSaga = 0; g.tick(.01); return [...g.mobs.values()].find(m => m.dono === p.id); }
function viajar(g, p, destino) {
  const portal = PORTAIS.find(o => o.planet === p.planet && o.area === (p.area || null) && o.destinos.includes(destino));
  p.x = portal.x; p.y = portal.y; return g.usePortal(p, destino);
}

test('Saga do Cell: o C20 é o chefe raro do Deserto e derruba o Bilhete de Ouro do Dr. Gero (50%)', () => {
  const g = new Game({ now: 1000 });
  assert.ok([...g.mobs.values()].some(m => m.type === 'c20' && m.area === 'terra-deserto' && m.raro));
  assert.deepEqual(dropsEspecificos('c20').find(d => d.item === BILHETE_LABORATORIO)?.chance, .5);
  for (const tipo of ['cellJr', 'cellImperfeito']) assert.ok([...g.mobs.values()].some(m => m.type === tipo && m.area === 'terra-deserto'), tipo);
  for (const tipo of ['androide17Pos', 'androide18Pos', 'cellImperfeito']) assert.ok([...g.mobs.values()].some(m => m.type === tipo && m.area === 'terra-ilha'), tipo);
});

test('Saga do Cell: a cadeia completa, com chefes pessoais e a Ilha da Arena trancada até o Semiperfeito', () => {
  const g = new Game({ now: 1000 }), p = g.addPlayer('p', 'Goku', { level: 62 }), q = g.addPlayer('q', 'Outro', { level: 62 });
  p.connected = q.connected = true;
  g.levar(p, lugar('terra-hub')); g.levar(q, lugar('terra-deserto'));
  assert.equal(viajar(g, p, 'terra-ilha').ok, false, 'Ilha trancada no começo');
  assert.equal(estado(g, p, 1), 'disponivel'); assert.equal(estado(g, p, 2), 'bloqueada');
  // 1. Bilhete
  p.inventory[BILHETE_LABORATORIO] = 1; assert.equal(estado(g, p, 1), 'concluida');
  assert.equal(etapa(g, p, 1).ok, true); assert.equal(p.inventory[BILHETE_LABORATORIO] || 0, 0, 'o bilhete é consumido');
  // 2. Filhos do Cell
  g.levar(p, lugar('terra-deserto'));
  abater(g, p, 'cellJr', 'terra-deserto', METAS_SAGA_CELL.filhos.cellJr);
  assert.equal(estado(g, p, 2), 'andamento');
  abater(g, p, 'cellImperfeito', 'terra-deserto', METAS_SAGA_CELL.filhos.cellImperfeito);
  assert.equal(estado(g, p, 2), 'concluida'); assert.equal(etapa(g, p, 2).ok, true);
  // 3. Semiperfeito pessoal no Deserto: o outro jogador não vê nem atinge
  const semi = chefePessoal(g, p);
  assert.equal(semi?.type, 'cellSemiperfeito'); assert.equal(semi.area, 'terra-deserto');
  assert.ok(!g.snapshot(q.id).mobs.some(m => m.id === semi.id), 'outro jogador não vê o chefe pessoal');
  assert.ok(g.snapshot(p.id).mobs.some(m => m.id === semi.id), 'o dono vê');
  q.x = semi.x; q.y = semi.y; assert.equal(g.hit(q, semi, 1e9), false, 'outro jogador não atinge');
  p.x = semi.x; p.y = semi.y; assert.equal(g.hit(p, semi, 1e9), true);
  assert.ok(!g.mobs.has(semi.id), 'o chefe pessoal some ao morrer');
  assert.equal(estado(g, p, 3), 'concluida'); assert.equal(etapa(g, p, 3).ok, true);
  // 4. Ilha liberada; C17, C18 e Cell Imperfeito; o Semiperfeito reaparece na Ilha
  g.levar(p, lugar('terra-hub')); assert.equal(viajar(g, p, 'terra-ilha').ok, true, 'Ilha liberada');
  assert.equal(viajar(g, q, 'terra-ilha').ok, false, 'continua trancada para quem não chegou lá');
  for (const [tipo, n] of Object.entries(METAS_SAGA_CELL.ilha)) abater(g, p, tipo, 'terra-ilha', n);
  const semi2 = chefePessoal(g, p); assert.equal(semi2?.type, 'cellSemiperfeito'); assert.equal(semi2.area, 'terra-ilha');
  p.x = semi2.x; p.y = semi2.y; g.hit(p, semi2, 1e9);
  assert.equal(estado(g, p, 4), 'concluida'); assert.equal(etapa(g, p, 4).ok, true);
  // 5. Cell Perfeito no Deserto
  g.levar(p, lugar('terra-deserto'));
  const perfeito = chefePessoal(g, p); assert.equal(perfeito?.type, 'cellPerfeito'); assert.match(perfeito.name, /BOSS/);
  p.x = perfeito.x; p.y = perfeito.y; g.hit(p, perfeito, 1e9);
  assert.equal(estado(g, p, 5), 'concluida'); assert.equal(etapa(g, p, 5).ok, true);
  assert.equal(p.sagaCell.etapa, 5); assert.equal(chefePessoal(g, p), undefined, 'nada mais pendente');
  // O progresso fica salvo no personagem
  const volta = createPlayer('p2', 'Goku', exportPlayer(p), 1000);
  assert.equal(volta.sagaCell.etapa, 5);
});

test('Saga do Cell: o chefe pessoal some se o dono desconecta ou sai da etapa', () => {
  const g = new Game({ now: 1000 }), p = g.addPlayer('p', 'Goku', { level: 62 }); p.connected = true;
  p.sagaCell.etapa = 2; g.levar(p, lugar('terra-deserto'));
  const semi = chefePessoal(g, p); assert.ok(semi);
  p.connected = false; assert.equal(chefePessoal(g, p), undefined); assert.ok(!g.mobs.has(semi.id));
});

test('C20: a absorção de energia suga vida e Ki de quem está perto e cura o C20', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p', 'Goku', { level: 62 }); p.connected = true;
  g.levar(p, lugar('terra-deserto'));
  const c20 = g.addMob('c20', p.x + 300, p.y + 300, 'terra-deserto'); c20.hp = c20.maxHp * .5; c20.attackReady = 0;
  p.x = c20.x + 60; p.y = c20.y; p.seguroAte = 0; p.hp = p.stats.hp; p.ki = p.stats.ki;
  const hpC20 = c20.hp, ki = p.ki, hp = p.hp;
  g.updateMob(c20, .05); assert.equal(c20.telegraph?.kind, 'absorcao'); assert.equal(c20.strike.kind, 'absorcao');
  g.time = c20.telegraph.until + .01; g.updateMob(c20, .05);
  assert.ok(p.hp < hp, 'tirou vida'); assert.ok(p.ki < ki, 'tirou Ki'); assert.ok(c20.hp > hpC20, 'o C20 se curou');
  assert.ok(c20.absorcaoReady > g.time, 'tem recarga');
});

test('Cell Semiperfeito: carrega a bola na cauda, lança no alvo e explode onde ele está', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p', 'Goku', { level: 62 }); p.connected = true;
  g.levar(p, lugar('terra-deserto'));
  const semi = g.addMob('cellSemiperfeito', p.x + 400, p.y + 300, 'terra-deserto'); semi.attackReady = 0;
  p.x = semi.x + 300; p.y = semi.y; p.seguroAte = 0; p.hp = p.stats.hp; const hp = p.hp;
  g.updateMob(semi, .05);
  assert.equal(semi.telegraph?.kind, 'bolaNegra'); assert.equal(semi.strike.kind, 'cauda'); assert.ok(semi.caudaReady > g.time, 'tem recarga');
  g.time = semi.telegraph.until + .01; g.updateMob(semi, .05);
  assert.ok(p.hp < hp, 'a bola acertou o alvo');
});

test('Cell Perfeito: Kamehameha de longe e auto-regeneração uma vez abaixo de 30%', () => {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p', 'Goku', { level: 62 }); p.connected = true;
  g.levar(p, lugar('terra-deserto'));
  const c = g.addMob('cellPerfeito', p.x + 400, p.y + 300, 'terra-deserto'); c.attackReady = 0;
  p.x = c.x + 300; p.y = c.y; p.seguroAte = 0;
  g.updateMob(c, .05);
  assert.equal(c.strike?.kind, 'kameCell'); assert.ok(c.telegraph?.kame && c.telegraph.beam);
  g.time = c.telegraph.until + .01; g.updateMob(c, .05);
  assert.ok(g.projectiles.some(s => s.kind === 'kameCell' && s.owner === c.id), 'o Kamehameha saiu');
  c.telegraph = null; c.hp = c.maxHp * .2; const antes = c.hp;
  g.updateMob(c, .05); assert.equal(c.strike.kind, 'regeneracao'); assert.ok(c.regenerou);
  g.time = c.regenerando + .01; g.updateMob(c, .05); assert.ok(c.hp > antes, 'regenerou');
  c.hp = c.maxHp * .1; g.updateMob(c, .05); assert.notEqual(c.strike?.kind === 'regeneracao' && c.regenerando > 0, true, 'só uma vez');
});
