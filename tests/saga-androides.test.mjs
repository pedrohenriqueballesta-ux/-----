import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { lugar } from '../public/shared/nucleo/config.mjs';
import { createPlayer, exportPlayer } from '../public/shared/nucleo/characters.mjs';
import { METAS_ANDROIDES, ID_TASK_ANDROIDES, SUPER_C17 } from '../public/shared/sistemas/saga-androides.mjs';
import { dropsEspecificos } from '../public/shared/sistemas/catalogo-itens.mjs';
import { CHEFE_RARO } from '../public/shared/nucleo/enemies.mjs';

// Saga dos Androides (Pedro, 26/11/2026): aceitar → C16, C17 e C18 → C17 Infernal pessoal → Super C17 raro pessoal.
const missao = (g, p) => g.snapshot(p.id).self.missoes.find(m => m.id === ID_TASK_ANDROIDES);
function abater(g, p, tipo, quantos) {
  for (let i = 0; i < quantos; i++) {
    const m = [...g.mobs.values()].find(m => m.type === tipo && m.area === 'terra-neve' && !m.dono);
    assert.ok(m, 'há ' + tipo + ' na Neve');
    m.hp = m.maxHp; p.x = m.x; p.y = m.y;
    assert.equal(g.hit(p, m, 1e9), true); m.hp = m.maxHp;
  }
}
const sincronizar = g => { g.proximaSincroniaSaga = 0; g.tick(.01); };
const pessoal = (g, p, tipo) => [...g.mobs.values()].find(m => m.dono === p.id && m.type === tipo);

test('Saga dos Androides: os abates só contam depois de aceitar a task', () => {
  const g = new Game({ now: 1000 }), p = g.addPlayer('p', 'Goku', { level: 700 }); p.connected = true;
  g.levar(p, lugar('terra-neve'));
  assert.equal(missao(g, p).estado, 'disponivel'); assert.equal(missao(g, p).aceitar, true);
  abater(g, p, 'androide18', 2); assert.equal(p.sagaAndroides.contagens.androide18, 0, 'sem aceitar não conta');
  assert.equal(g.action(p.id, { type: 'aceitarMissao', id: ID_TASK_ANDROIDES }).ok, true);
  assert.equal(missao(g, p).estado, 'andamento');
  assert.equal(g.action(p.id, { type: 'aceitarMissao', id: ID_TASK_ANDROIDES }).ok, false, 'aceitar duas vezes não');
  abater(g, p, 'androide18', 2); assert.equal(p.sagaAndroides.contagens.androide18, 2);
});

test('Saga dos Androides: metas cumpridas chamam o C17 Infernal pessoal; vencê-lo conclui a task e libera o Super C17', () => {
  const g = new Game({ now: 1000 }), p = g.addPlayer('p', 'Goku', { level: 700 }), q = g.addPlayer('q', 'Outro', { level: 700 });
  p.connected = q.connected = true; g.levar(p, lugar('terra-neve')); g.levar(q, lugar('terra-neve'));
  g.action(p.id, { type: 'aceitarMissao', id: ID_TASK_ANDROIDES });
  for (const [tipo, n] of Object.entries(METAS_ANDROIDES)) abater(g, p, tipo, n - 1);
  sincronizar(g); assert.equal(pessoal(g, p, 'c17Infernal'), undefined, 'antes das três metas não aparece');
  for (const tipo of Object.keys(METAS_ANDROIDES)) abater(g, p, tipo, 1);
  sincronizar(g); const inf = pessoal(g, p, 'c17Infernal');
  assert.ok(inf, 'o C17 Infernal apareceu'); assert.match(inf.name, /BOSS/);
  assert.ok(!g.snapshot(q.id).mobs.some(m => m.id === inf.id), 'o outro jogador não vê');
  q.x = inf.x; q.y = inf.y; assert.equal(g.hit(q, inf, 1e9), false, 'o outro jogador não atinge');
  assert.equal(p.sagaAndroides.venceuInfernal, false);
  p.x = inf.x; p.y = inf.y; assert.equal(g.hit(p, inf, 1e9), true);
  assert.equal(p.sagaAndroides.venceuInfernal, true, 'desbloqueio registrado no personagem');
  assert.equal(missao(g, p).estado, 'concluida');
  sincronizar(g); assert.equal(pessoal(g, p, 'c17Infernal'), undefined, 'não volta');
  assert.equal(g.action(p.id, { type: 'resgatarMissao', id: ID_TASK_ANDROIDES }).ok, true);
  assert.equal(missao(g, p).estado, 'resgatada');
  const volta = createPlayer('p2', 'Goku', exportPlayer(p), 1000);
  assert.equal(volta.sagaAndroides.venceuInfernal, true, 'fica salvo');
  assert.ok(dropsEspecificos('c17Infernal').length && dropsEspecificos('superC17').length, 'os dois chefes têm drop');
});

test('Super C17: raro pessoal, só para quem venceu o C17 Infernal, em ponto sorteado; o relógio recomeça ao vencê-lo', () => {
  const g = new Game({ now: 1000 }), p = g.addPlayer('p', 'Goku', { level: 700 }), q = g.addPlayer('q', 'Outro', { level: 700 });
  p.connected = q.connected = true; g.levar(p, lugar('terra-neve')); g.levar(q, lugar('terra-neve'));
  p.sagaAndroides.aceita = true; p.sagaAndroides.venceuInfernal = true;
  sincronizar(g); assert.equal(pessoal(g, p, 'superC17'), undefined, 'espera o tempo de raro');
  assert.ok(p.proximoSuperC17 - g.time >= SUPER_C17.tempo.minimo - 1 && p.proximoSuperC17 - g.time <= SUPER_C17.tempo.maximo);
  g.time = p.proximoSuperC17 + 1; sincronizar(g);
  const s = pessoal(g, p, 'superC17'); assert.ok(s, 'o Super C17 apareceu');
  assert.equal(pessoal(g, q, 'superC17'), undefined, 'quem não venceu o Infernal não tem Super C17');
  assert.ok(!g.snapshot(q.id).mobs.some(m => m.id === s.id), 'nem vê o dos outros');
  // Saiu da hunt e voltou: ele continua esperando (não nasce outro).
  g.levar(p, lugar('terra-hub')); sincronizar(g); g.levar(p, lugar('terra-neve')); sincronizar(g);
  const s2 = pessoal(g, p, 'superC17'); assert.equal(s2.id, s.id, 'o mesmo Super C17 continua lá');
  assert.equal([...g.mobs.values()].filter(m => m.dono === p.id && m.type === 'superC17').length, 1);
  p.x = s2.x; p.y = s2.y; assert.equal(g.hit(p, s2, 1e9), true);
  assert.ok(p.proximoSuperC17 > g.time + SUPER_C17.tempo.minimo - 1, 'o relógio recomeçou');
  sincronizar(g); assert.equal(pessoal(g, p, 'superC17'), undefined, 'não volta na hora');
  assert.equal(p.sagaAndroides.superVencidos, 1);
});

test('Super C17: o tempo é o mesmo do chefe raro', () => assert.deepEqual({ ...SUPER_C17.tempo }, CHEFE_RARO));

test('Super C17: com o modo de teste (DBI_CHEFE_JA) aparece em 10 s', () => {
  const g = new Game({ now: 1000, chefeJa: true }), p = g.addPlayer('p', 'Goku', { level: 700 }); p.connected = true;
  g.levar(p, lugar('terra-neve')); p.sagaAndroides.venceuInfernal = true;
  sincronizar(g); g.time += 11; sincronizar(g); assert.ok(pessoal(g, p, 'superC17'));
});

test('C17 Infernal e Super C17: golpe especial TARGET (rajadas brancas e Shocking Death Ball) persegue o alvo e acerta', () => {
  for (const [tipo, golpe, visual] of [['c17Infernal', 'rajadasBrancas', 'rajadaBranca'], ['superC17', 'deathBall', 'deathBall']]) {
    const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p', 'Goku', { level: 700 }); p.connected = true;
    g.levar(p, lugar('terra-neve'));
    const m = g.addMob(tipo, p.x + 300, p.y + 250, 'terra-neve'); m.attackReady = 0;
    p.x = m.x + 60; p.y = m.y; p.seguroAte = 0;   // de perto também (sem distância mínima)
    g.updateMob(m, .05);
    assert.equal(m.strike?.kind, golpe, tipo + ' usa o golpe especial'); assert.equal(m.telegraph?.alvoId, p.id);
    assert.ok(m.especialReady > g.time, 'tem recarga');
    g.time = m.telegraph.until + .01; g.updateMob(m, .05);
    const s = g.projectiles.find(s => s.visual === visual && s.owner === m.id);
    assert.ok(s, 'o projétil saiu'); assert.equal(s.kind, 'mobKiTarget', 'persegue o alvo');
    const hp = p.hp; for (let i = 0; i < 80 && s.ttl !== 0; i++) { p.x += 4; g.tick(.05); }
    assert.ok(p.hp < hp, tipo + ': acertou mesmo com o alvo andando');
  }
});
