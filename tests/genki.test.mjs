import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../public/shared/game.mjs';
import { GENKI, quadroGenki } from '../public/shared/genki.mjs';
import { GENKI_ARTE, carregarGenki, desenharGenki, geometriaGenki } from '../public/render/genki.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';
import { statsFor } from '../public/shared/characters.mjs';

const passar = (g, segundos) => { for (let i = 0; i < Math.round(segundos / .01); i++) g.tick(.01); };
function cena(transformado = false) {
  const g = new Game({ now: 1000, populate: false }), p = g.addPlayer('p');
  g.levar(p, lugar('inicial')); p.x += 180; p.seguroAte = 0;
  p.level = 50; p.stats = statsFor(50); p.hp = p.stats.hp; p.ki = p.stats.ki;
  p.transformed = transformado; p.autoHeal = false; p.autoFood = false;
  const mob = (dx, dy = 0) => {
    const m = g.addMob('melee', p.x + dx, p.y + dy, p.area);
    Object.assign(m, { hp: 100000, maxHp: 100000, speed: 0, agressivo: false, attackReady: Infinity });
    return m;
  };
  return { g, p, mob };
}

test('três folhas originais RGBA 4×4, com 16 células completas de 384×384', async () => {
  for (const arte of Object.values(GENKI_ARTE)) {
    const png = await readFile(new URL('../public' + arte.imagem, import.meta.url));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20), png[25]], [1536,1536,6]);
  }
  for (let i = 0; i < 16; i++) {
    assert.equal(quadroGenki('carga', i * .12), i);
    assert.equal(quadroGenki('explosao', i * .11), i);
    assert.equal(quadroGenki('voo', i * .1), i);
    assert.equal(quadroGenki('voo', 16 * .1 + i * .1), i);
  }
  assert.equal(quadroGenki('carga', GENKI.carga), -1);
  assert.equal(quadroGenki('explosao', GENKI.explosao), -1);
  assert.equal(quadroGenki('voo', 100), 8);
});

test('canaliza uma vez, acompanha movimento, lança uma vez e preserva Ki e cooldown', () => {
  const { g, p, mob } = cena(), alvo = mob(600); p.targetId = alvo.id;
  const ki = p.ki, facing = { ...p.facing };
  assert.equal(g.cast(p, 'genki').ok, true);
  assert.equal(p.ki, ki - 60); assert.equal(p.genkiReady, g.time + 45);
  assert.equal(g.projectiles.length, 0); assert.equal(g.genkiCharges.length, 1);
  assert.equal(g.cast(p, 'genki').ok, false); assert.equal(p.ki, ki - 60);
  g.setInput(p.id, { x: 1, y: 0 }); passar(g, .2);
  assert.equal(g.genkiCharges[0].x, p.x); assert.equal(g.genkiCharges[0].y, p.y);
  assert.equal(p.charge, null, 'não toma a carga/pose do Kame');
  assert.deepEqual(p.facing, facing);
  passar(g, 1.7); assert.equal(g.projectiles.length, 0); assert.equal(alvo.hp, alvo.maxHp);
  passar(g, .02); assert.equal(g.genkiCharges.length, 0); assert.equal(g.projectiles.filter(s => s.kind === 'genki').length, 1);
});

test('nova canalização ancora a ponta do V na cabeça e cresce acima, sem mudar voo e explosão', () => {
  const efeito = { started: 0, x: 100, y: 200, dx: 1, dy: 0 };
  for (let i = 0; i < 16; i++) {
    const g = geometriaGenki('carga', efeito, i * .12, { x: 300 + i, y: 400 + i });
    assert.deepEqual(g.ancora, [191,334]);
    assert.equal(g.x, 300 + i); assert.equal(g.y, 338 + i);
    assert.equal(g.angulo, 0); assert.equal(g.escala, .4);
  }
  assert.equal(GENKI.carga, 1.92);
  assert.equal(GENKI_ARTE.voo.escala, .42); assert.equal(GENKI_ARTE.explosao.escala, .6);
});

test('voo não expira após 2,35s nem depende do fim do loop; segue alvo distante até impacto', () => {
  const { g, p, mob } = cena(), alvo = mob(1800); p.targetId = alvo.id;
  g.cast(p, 'genki'); passar(g, GENKI.carga + 2.5);
  assert.equal(g.projectiles.length, 1); assert.equal(alvo.hp, alvo.maxHp);
  const s = g.projectiles[0], anterior = s.dy;
  alvo.y += 200; passar(g, .05); assert.ok(s.dy > anterior, 'ajusta direção para o alvo em movimento');
  for (let i = 0; i < 1500 && !g.genkiExplosions.length; i++) g.tick(.01);
  assert.ok(alvo.hp < alvo.maxHp); assert.equal(g.projectiles.length, 0);
  assert.equal(g.genkiExplosions.length, 1);
  const vida = alvo.hp, impacto = { ...g.genkiExplosions[0] };
  passar(g, 1); assert.equal(alvo.hp, vida, 'explosão visual não aplica dano repetido');
  assert.equal(g.genkiExplosions[0].x, impacto.x); assert.equal(g.genkiExplosions[0].y, impacto.y);
  passar(g, .8); assert.equal(g.genkiExplosions.length, 0);
});

test('dano principal e em área preservam os multiplicadores das formas base e transformada', () => {
  for (const transformado of [false,true]) {
    const { g, p, mob } = cena(transformado), alvo = mob(400), extra = mob(400,65), fora = mob(400,200);
    p.targetId = alvo.id;
    const bruto = p.stats.attack * (transformado ? 14 : 10);
    g.cast(p, 'genki'); passar(g, 4);
    const dano = raw => Math.max(1, Math.round(raw * 100 / (100 + alvo.defesa * 3)));
    assert.equal(alvo.maxHp - alvo.hp, dano(bruto));
    assert.equal(extra.maxHp - extra.hp, dano(bruto * .45));
    assert.equal(fora.hp, fora.maxHp);
    assert.equal(CONFIG.skillCosts.genki, 60); assert.equal(CONFIG.skillCooldowns.genki, 45);
  }
});

test('sem alvo selecionado, conserva o disparo pela mira ou direção e não some antes do inimigo distante', () => {
  for (const mirar of [false,true]) {
    const {g,p,mob} = cena(), m = mob(1200);
    p.facing = { x: 1, y: 0 }; p.aim = mirar ? { x: m.x, y: m.y } : null;
    assert.equal(g.cast(p,'genki').ok,true); assert.equal(g.genkiCharges[0].targetId,null);
    passar(g,GENKI.carga + 2.5); assert.equal(g.projectiles.length,1);
    passar(g,3); assert.ok(m.hp < m.maxHp); assert.equal(g.projectiles.length,0);
  }
});

test('morte, desconexão, safe zone, portal ou perda do alvo cancelam carga e voo', () => {
  for (const fase of ['carga','voo']) for (const cancelar of [
    (g,p) => { p.hp = 0; p.respawnAt = Infinity; }, (g,p) => { p.connected = false; },
    (g,p) => { p.x = lugar(p.area).chegada.x; p.y = lugar(p.area).chegada.y; },
    (g,p) => g.levar(p,lugar('media')), (g,p,m) => { m.hp = 0; m.deadUntil = Infinity; },
    (g,p,m) => { m.area = 'media'; }
  ]) {
    const { g,p,mob } = cena(), m = mob(1200); p.targetId = m.id; g.cast(p,'genki');
    if (fase === 'voo') passar(g, GENKI.carga + .05);
    cancelar(g,p,m); g.tick(.05);
    assert.equal(g.genkiCharges.length,0); assert.equal(g.projectiles.length,0);
    assert.equal(g.genkiExplosions.length,0);
    assert.ok(p.genkiReady > g.time, 'cancelamento não zera cooldown');
  }
});

test('snapshots e dano ficam no mesmo lugar; sem PvP e sem acertar dentro da safe zone', () => {
  const { g,p,mob } = cena(), alvo = mob(400), outro = g.addPlayer('outro'), longe = g.addPlayer('longe');
  g.levar(outro,lugar(p.area)); outro.x = alvo.x; outro.y = alvo.y; outro.seguroAte = 0;
  const vida = outro.hp; p.targetId = alvo.id; g.cast(p,'genki');
  assert.equal(g.snapshot(outro.id).genkiCharges.length,1); assert.equal(g.snapshot(longe.id).genkiCharges.length,0);
  passar(g,4); assert.equal(outro.hp,vida);
  // O efeito já terminou neste instante; nova cena para conferir a explosão no impacto.
  const c = cena(), m = c.mob(400); c.p.targetId = m.id; c.g.cast(c.p,'genki');
  for (let i=0;i<400 && !c.g.genkiExplosions.length;i++) c.g.tick(.01);
  const distante = c.g.addPlayer('distante');
  assert.equal(c.g.snapshot(distante.id).genkiExplosions.length,0);
  assert.equal(c.g.snapshot(c.p.id).genkiExplosions.length,1);
});

test('render usa células inteiras e rotação nas oito direções, com imagens carregadas uma só vez', () => {
  const original = globalThis.Image; let criadas = 0;
  globalThis.Image = class { constructor() { criadas++; this.complete = true; this.naturalWidth = 1536; } };
  try {
    const desenhos = [], rotacoes = [];
    const ctx = { save(){},restore(){},translate(){},rotate(a){rotacoes.push(a);},drawImage(...args){desenhos.push(args);} };
    carregarGenki(); carregarGenki(); assert.equal(criadas,3);
    for (let d=0;d<8;d++) for (let frame=0;frame<16;frame++) {
      const angulo = d * Math.PI/4, efeito = {x:300,y:400,dx:Math.cos(angulo),dy:Math.sin(angulo),started:0};
      assert.equal(desenharGenki(ctx,'voo',efeito,frame*.1),true);
      const a = desenhos.at(-1); assert.deepEqual(a.slice(1,5),[frame%4*384,Math.floor(frame/4)*384,384,384]);
      assert.ok(Math.abs(Math.sin(rotacoes.at(-1)-angulo)) < 1e-9);
      const geo = geometriaGenki('voo',efeito,frame*.1);
      assert.equal(a[5]+geo.ancora[0]*geo.escala,0); assert.equal(a[6]+geo.ancora[1]*geo.escala,0);
    }
    assert.equal(desenharGenki(ctx,'carga',{x:0,y:0,started:0},GENKI.carga),false);
    assert.equal(desenharGenki(ctx,'explosao',{x:0,y:0,started:0},GENKI.explosao),false);
  } finally { if(original===undefined)delete globalThis.Image;else globalThis.Image=original; }
});
