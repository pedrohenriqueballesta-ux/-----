import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../public/shared/game.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';
import { statsFor } from '../public/shared/characters.mjs';
import { norm } from '../public/shared/math.mjs';
import { KAME, ESTAGIOS_KAME, estagioKame, quadroKame, geometriaKame, origemKame, atingidoPeloKame } from '../public/shared/kamehameha.mjs';

const mesmaDirecao = (a, b) => assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9);
const passar = (g, s) => { for (let i = 0; i < Math.round(s / .01); i++) g.tick(.01); };
function cena(nivel = 3) {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar('inicial')); p.x += 300; p.seguroAte = 0;
  p.level = nivel; p.stats = statsFor(nivel); p.hp = p.stats.hp; p.ki = p.stats.ki;
  p.autoAttack = false; p.autoSkills = false;
  const mob = (x, y = 0, area = p.area) => {
    const m = g.addMob('melee', p.x + KAME.mao + x, p.y + y, area);
    m.hp = m.maxHp = 100000; m.speed = 0; m.attackReady = Infinity; m.agressivo = false; return m;
  };
  return { g, p, mob };
}
test('estágios usam os marcos exatos do personagem, inclusive 150+; frames a cada 80 ms', () => {
  for (const [nivel, esperado] of [[1,1],[19,1],[20,20],[49,20],[50,50],[99,50],[100,100],[149,100],[150,150],[200,150]]) assert.equal(estagioKame(nivel).nivel, esperado);
  for (let i = 0; i < 16; i++) assert.equal(quadroKame(i * .08 + .001), i);
  assert.equal(quadroKame(1.28), -1); assert.equal(quadroKame(-.01), -1);
});
for (const e of ESTAGIOS_KAME) {
  test('pacote ' + e.nivel + ': 16 quadros RGBA, proporção original, alcance máximo exato e ponta completa', async () => {
    const png = await readFile(new URL('../public' + e.imagem, import.meta.url));
    assert.equal(png.readUInt32BE(16), 443 * 4); assert.equal(png.readUInt32BE(20), 221 * 4); assert.equal(png[25], 6);
    const json = JSON.parse(await readFile(new URL('../public/assets/skills/kamehameha/nivel-' + e.nivel + '/animation.json', import.meta.url)));
    assert.equal(json.frame_count, 16); assert.equal(json.range_tiles * json.tile_size, e.alcance);
    assert.equal(e.quadros.length, 16);
    const alcances = e.quadros.map((q, i) => {
      assert.ok(q.ponta < 443 && q.esquerda >= 0 && q.topo >= 0 && q.fundo < 221);
      return geometriaKame(e.nivel, i * .08 + .001).alcance;
    });
    assert.ok(Math.abs(Math.max(...alcances) - e.alcance) < .0001);
    assert.equal(alcances[0], 0);
  });
  test('nível ' + e.nivel + ': múltiplos alvos, um dano por alvo, sem ultrapassar o alcance ou atingir atrás', () => {
    const { g, p, mob } = cena(Math.max(3, e.nivel));
    const a = mob(25), b = mob(e.alcance - 1), longe = mob(e.alcance + 2), atras = mob(-30), lado = mob(50, 150), outroLugar = mob(40, 0, 'media');
    p.targetId = a.id;
    const ki = p.ki; assert.equal(g.cast(p, 'kame').ok, true);
    assert.equal(ki - p.ki, CONFIG.skillCosts.kame); assert.equal(p.kameReady - g.time, CONFIG.skillCooldowns.kame);
    passar(g, .6); assert.equal(a.hp, a.maxHp, 'sem dano durante carga');
    passar(g, 1.1);
    for (const m of [a, b]) { assert.ok(m.hp < m.maxHp); assert.equal(g.events.filter(ev => ev.type === 'damage' && ev.targetId === m.id).length, 1); }
    for (const m of [longe, atras, lado, outroLugar]) assert.equal(m.hp, m.maxHp);
    const esperado = Math.max(1, Math.round(p.stats.attack * 4.2 * 100 / (100 + (a.defesa ?? 1) * 3)));
    assert.equal(a.maxHp - a.hp, esperado, 'mesma fórmula de dano');
    assert.equal(g.kamehamehas.length, 0, 'limpa efeitos concluídos');
  });
}
test('colisão acompanha todas as oito direções', () => {
  const g = geometriaKame(150, .721);
  for (let i = 0; i < 8; i++) {
    const d = { x: Math.cos(i * Math.PI / 4), y: Math.sin(i * Math.PI / 4) }, o = origemKame({ x: 1000, y: 1000 }, d);
    assert.ok(atingidoPeloKame({ x: o.x + d.x * 100, y: o.y + d.y * 100 }, o, d, g));
    assert.equal(atingidoPeloKame({ x: o.x - d.x * 40, y: o.y - d.y * 40 }, o, d, g), false);
  }
});
test('evolução é automática no próximo disparo; estágio atual fica estável', () => {
  const { g, p } = cena(19); g.cast(p, 'kame'); assert.equal(p.charge.nivel, 1);
  p.level = 20; passar(g, .7); assert.equal(g.kamehamehas[0].nivel, 1);
  passar(g, 4.4); p.ki = p.stats.ki; g.cast(p, 'kame'); assert.equal(p.charge.nivel, 20);
});
test('safe zone, portal, desconexão e morte cancelam feixe; snapshot não vaza entre hunts', () => {
  for (const sair of [p => { p.connected = false; }, p => { p.hp = 0; }, (p, g) => g.levar(p, lugar('media')), p => { p.x = lugar('inicial').chegada.x; }]) {
    const { g, p } = cena(); g.cast(p, 'kame'); passar(g, .7); assert.equal(g.kamehamehas.length, 1);
    const outro = g.addPlayer('outro'); g.levar(outro, lugar('media'));
    assert.equal(g.snapshot(outro.id).kamehamehas.length, 0);
    sair(p, g); g.tick(.01); assert.equal(g.kamehamehas.length, 0);
  }
});
test('dano preserva os multiplicadores de Super Saiyajin e Kaioken', () => {
  const { g, p, mob } = cena(50), m = mob(30); p.targetId = m.id;
  p.transformed = true; p.kaiokenUntil = g.time + 6;
  g.cast(p, 'kame'); passar(g, 1.7);
  const dano = Math.round(p.stats.attack * 6 * 1.4 * 100 / (100 + (m.defesa ?? 1) * 3));
  assert.equal(m.maxHp - m.hp, dano);
});
test('auto técnicas usa o alcance do estágio antes de gastar Ki com Kamehameha', () => {
  for (const dentro of [true, false]) {
    const { g, p, mob } = cena(20), m = mob(dentro ? 100 : 250); p.targetId = m.id; p.autoSkills = true;
    g.tick(.01); assert.equal(Boolean(p.charge), dentro);
    if (!dentro) assert.ok(g.projectiles.some(s => s.owner === p.id), 'continua usando rajada de Ki');
  }
});
test('Kamehameha manual segue o corpo, ignorando mouse e inimigo selecionado em outra direção', () => {
  const { g, p, mob } = cena(50), lateral = mob(0, 100);
  p.facing = { x: -1, y: 0 }; p.targetId = lateral.id; p.aim = lateral;
  assert.ok(g.cast(p, 'kame').ok);
  assert.deepEqual(p.charge.direction, { x: -1, y: 0 });
  assert.deepEqual(p.facing, p.charge.direction);
  passar(g, 1.7); assert.equal(lateral.hp, lateral.maxHp, 'não vira sozinho para acertar o alvo');
});
test('auto caça OFF mantém direção manual com ataque e técnicas automáticos ON, durante carga e feixe', () => {
  const { g, p, mob } = cena(50), m = mob(30); p.targetId = m.id;
  p.autoAttack = true; p.autoSkills = true;
  g.setInput(p.id, { x: 0, y: -1 }); g.tick(.01);
  assert.equal(p.autoHunt, false);
  assert.deepEqual(p.facing, { x: 0, y: -1 });
  assert.deepEqual(p.charge.direction, p.facing);
  passar(g, .7); mesmaDirecao(g.kamehamehas[0].direction, { x: 0, y: -1 });
  g.setInput(p.id, { x: -1, y: 0 }); g.tick(.01);
  assert.deepEqual(p.facing, { x: -1, y: 0 });
  mesmaDirecao(g.kamehamehas[0].direction, p.facing);
  passar(g, .3); assert.deepEqual(p.facing, { x: -1, y: 0 });
});
test('auto caça OFF: soco, rajada e Genki não viram o corpo para o alvo selecionado', () => {
  for (const skill of ['basic', 'ki', 'genki']) {
    const { g, p, mob } = cena(50), m = mob(30); p.targetId = m.id;
    p.facing = { x: 0, y: 1 };
    assert.ok(g.cast(p, skill, true).ok); assert.deepEqual(p.facing, { x: 0, y: 1 });
  }
});
test('virar durante a carga e o feixe mantém origem, sprite e dano na direção atual do corpo', () => {
  const { g, p, mob } = cena(50), emCima = mob(-KAME.mao, -100), naDireita = mob(100);
  g.cast(p, 'kame');
  g.setInput(p.id, { x: 0, y: -1 }); g.tick(.01);
  mesmaDirecao(p.charge.direction, p.facing);
  p.input = { x: 0, y: 0 }; passar(g, .7);
  assert.deepEqual(g.kamehamehas[0].direction, { x: 0, y: -1 });
  assert.ok(emCima.hp < emCima.maxHp);
  p.facing = { x: 1, y: 0 }; g.tick(.01);
  const k = g.kamehamehas[0]; assert.deepEqual(k.direction, p.facing);
  assert.deepEqual({ x: k.x, y: k.y }, origemKame(p, p.facing));
  passar(g, .6); assert.ok(naDireita.hp < naDireita.maxHp);
  assert.equal(g.events.filter(e => e.type === 'damage' && e.targetId === emCima.id).length, 1);
});
test('auto caça parada vira para o inimigo e acerta Kamehameha nas oito direções', () => {
  for (let i = 0; i < 8; i++) {
    const { g, p, mob } = cena(50), d = { x: Math.cos(i * Math.PI / 4), y: Math.sin(i * Math.PI / 4) };
    const m = mob(-KAME.mao + d.x * 40, d.y * 40);
    g.action(p.id, { type: 'hunt' }); p.autoAttack = false;
    p.facing = { x: -d.x, y: -d.y }; g.tick(.01);
    mesmaDirecao(p.facing, norm(m.x - p.x, m.y - p.y));
    mesmaDirecao(p.charge.direction, p.facing);
    passar(g, 1.7); assert.ok(m.hp < m.maxHp, 'acertou direção ' + i);
  }
});
test('auto caça acompanha alvo que se move durante a carga e durante o feixe', () => {
  const { g, p, mob } = cena(50), m = mob(130);
  g.action(p.id, { type: 'hunt' }); p.autoAttack = false; g.tick(.01);
  assert.ok(p.charge);
  m.y += 50; g.tick(.01);
  mesmaDirecao(p.charge.direction, norm(m.x - p.x, m.y - p.y));
  passar(g, .7);
  mesmaDirecao(g.kamehamehas[0].direction, p.facing);
  m.y -= 80; g.tick(.01);
  mesmaDirecao(g.kamehamehas[0].direction, norm(m.x - p.x, m.y - p.y));
  passar(g, .8); assert.ok(m.hp < m.maxHp);
});
test('renderização reutiliza imagens e quadros, aguarda carregamento e mantém escala uniforme', async () => {
  const anteriorImage = globalThis.Image, anteriorDocument = globalThis.document, imagens = [], canvases = [];
  globalThis.Image = class { complete = false; naturalWidth = 0; constructor() { imagens.push(this); } };
  globalThis.document = { createElement() {
    const c = { getContext: () => ({ drawImage() {}, createLinearGradient: () => ({ addColorStop() {} }), fillRect() {} }) };
    canvases.push(c); return c;
  } };
  try {
    const { desenharKame, carregarKame, desenharKameComProfundidade, kameSobrePersonagem } = await import('../public/render/kamehameha.mjs');
    const efeito = { x: 200, y: 200, direction: { x: -1, y: 0 }, nivel: 150, started: 0 }, escalas = [], rotacoes = [], desenhos = [];
    const ctx = { save() {}, restore() {}, translate() {}, rotate(a) { rotacoes.push(a); }, scale(x, y) { escalas.push([x, y]); }, drawImage(...args) { desenhos.push(args); } };
    assert.equal(desenharKame(ctx, efeito, .1), false);
    Object.assign(carregarKame(150), { complete: true, naturalWidth: 1772 });
    for (let i = 0; i < 16; i++) assert.ok(desenharKame(ctx, efeito, i * .08 + .001));
    for (let i = 0; i < 100; i++) desenharKame(ctx, efeito, .721);
    assert.equal(imagens.length, 1); assert.equal(canvases.length, 16);
    assert.ok(escalas.every(([x, y]) => x === y)); assert.ok(rotacoes.every(r => r === Math.PI));
    assert.ok(escalas.every(([x]) => x === estagioKame(150).escala * .5), 'metade do volume anterior');
    assert.ok(desenhos.every(([, x]) => x === -2), 'só margem transparente fica atrás das mãos');
    const g = geometriaKame(150, .721);
    assert.equal(g.raio, g.q.raio * g.estagio.escala * .5, 'largura de dano acompanha o feixe menor');
    assert.equal(desenharKame(ctx, efeito, 1.3), false);
    // O sprite, e não um retângulo de recorte, determina a oclusão quando olhamos para cima.
    for (const direction of [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]) {
      const ordem = [], camada = { ...ctx, drawImage() { ordem.push('feixe'); } };
      assert.ok(desenharKameComProfundidade(camada, { ...efeito, direction }, .721, () => ordem.push('personagem')));
      assert.equal(kameSobrePersonagem(direction), direction.y > 0);
      assert.deepEqual(ordem, direction.y > 0 ? ['feixe'] : ['feixe', 'personagem']);
    }
  } finally {
    if (anteriorImage === undefined) delete globalThis.Image; else globalThis.Image = anteriorImage;
    if (anteriorDocument === undefined) delete globalThis.document; else globalThis.document = anteriorDocument;
  }
});
