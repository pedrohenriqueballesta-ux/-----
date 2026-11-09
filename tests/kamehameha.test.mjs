import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../public/shared/game.mjs';
import { CONFIG, lugar } from '../public/shared/config.mjs';
import { statsFor } from '../public/shared/characters.mjs';
import { norm } from '../public/shared/math.mjs';
import { KAME, ESTAGIOS_KAME, estagioKame, quadroKame, geometriaKame, origemKame, atingidoPeloKame, IMPACTO_KAME, atingidoPeloImpactoKame } from '../public/shared/kamehameha.mjs';

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
  test('nível ' + e.nivel + ': acerta alvo selecionado, espalha pela sprite e preserva custo, dano e alcance', () => {
    const { g, p, mob } = cena(Math.max(3, e.nivel));
    const a = mob(25), b = mob(57), longe = mob(e.alcance + 2), atras = mob(-30), lado = mob(50, 150), outroLugar = mob(40, 0, 'media');
    p.targetId = a.id;
    const ki = p.ki; assert.equal(g.cast(p, 'kame').ok, true);
    assert.equal(ki - p.ki, CONFIG.skillCosts.kame); assert.equal(p.kameReady - g.time, CONFIG.skillCooldowns.kame);
    passar(g, .6); assert.equal(a.hp, a.maxHp, 'sem dano durante carga');
    passar(g, 1.5);
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
  const { g, p, mob } = cena(19); p.targetId = mob(100).id; g.cast(p, 'kame'); assert.equal(p.charge.nivel, 1);
  p.level = 20; passar(g, .7); assert.equal(g.kamehamehas[0].nivel, 1);
  passar(g, 4.4); p.ki = p.stats.ki; g.cast(p, 'kame'); assert.equal(p.charge.nivel, 20);
});
test('safe zone, portal, desconexão e morte cancelam feixe; snapshot não vaza entre hunts', () => {
  for (const sair of [p => { p.connected = false; }, p => { p.hp = 0; }, (p, g) => g.levar(p, lugar('media')), p => { p.x = lugar('inicial').chegada.x; }]) {
    const { g, p, mob } = cena(); p.targetId = mob(100).id; g.cast(p, 'kame'); passar(g, .7); assert.equal(g.kamehamehas.length, 1);
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
test('auto técnicas limita a carga ao alcance acrescido da aproximação prevista', () => {
  for (const dentro of [true, false]) {
    const { g, p, mob } = cena(20), m = mob(dentro ? 100 : 450); p.targetId = m.id; p.autoSkills = true; p.autoHunt = true;
    g.tick(.01); assert.equal(Boolean(p.charge), dentro);
    if (!dentro) assert.equal(p.charge,null,'não prepara contra alvo além da margem de aproximação');
  }
});
test('Kamehameha mira o selecionado mesmo com Auto Hunt OFF, mouse e corpo em outras direções', () => {
  const { g, p, mob } = cena(50), alvo = mob(0, 100), bloqueador = mob(20);
  p.targetId = alvo.id;p.facing={x:-1,y:0};p.aim=bloqueador;
  assert.ok(g.cast(p,'kame').ok);
  mesmaDirecao(p.charge.direction,norm(alvo.x-p.x,alvo.y-p.y));
  alvo.x+=40;g.tick(.01);mesmaDirecao(p.charge.direction,norm(alvo.x-p.x,alvo.y-p.y));
  passar(g,1);assert.ok(alvo.hp<alvo.maxHp);assert.equal(bloqueador.hp,bloqueador.maxHp);
});
test('sem alvo selecionado ou fora do alcance não gasta Ki nem entra em recarga', () => {
  const {g,p,mob}=cena();const alvo=mob(400),ki=p.ki,recarga=p.kameReady;
  for(const id of [null,alvo.id]) {p.targetId=id;assert.equal(g.cast(p,'kame').ok,false);assert.equal(p.ki,ki);assert.equal(p.kameReady,recarga);}
});
test('auto caça OFF: soco, rajada e Genki não viram o corpo para o alvo selecionado', () => {
  for (const skill of ['basic', 'ki', 'genki']) {
    const { g, p, mob } = cena(50), m = mob(30); p.targetId = m.id;
    p.facing = { x: 0, y: 1 };
    assert.ok(g.cast(p, skill, true).ok); assert.deepEqual(p.facing, { x: 0, y: 1 });
  }
});
test('virar durante a carga orienta o feixe; após colisão o impacto fica fixo', () => {
  const { g, p, mob } = cena(50), emCima = mob(-KAME.mao, -100), naDireita = mob(100);
  p.targetId = emCima.id;g.cast(p, 'kame');
  g.setInput(p.id, { x: 0, y: -1 }); g.tick(.01);
  mesmaDirecao(p.charge.direction, p.facing);
  p.input = { x: 0, y: 0 }; passar(g, .7);
  mesmaDirecao(g.kamehamehas[0].direction, norm(emCima.x-p.x,emCima.y-p.y));
  assert.ok(emCima.hp < emCima.maxHp);
  const fixo = structuredClone(g.snapshot(p.id).kamehamehas[0]);
  p.facing = { x: 1, y: 0 }; g.tick(.01);
  const k = g.kamehamehas[0]; assert.deepEqual(k.direction, fixo.direction);
  assert.deepEqual(k.impacto, fixo.impacto);
  passar(g, .6); assert.equal(naDireita.hp, naDireita.maxHp);
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
test('auto caça acompanha durante carga e mantém impacto após colisão', () => {
  const { g, p, mob } = cena(50), m = mob(130);
  g.action(p.id, { type: 'hunt' }); p.autoAttack = false; g.tick(.01);
  assert.ok(p.charge);
  m.y += 50; g.tick(.01);
  mesmaDirecao(p.charge.direction, norm(m.x - p.x, m.y - p.y));
  passar(g, .7);
  mesmaDirecao(g.kamehamehas[0].direction, p.facing);
  const impacto = structuredClone(g.kamehamehas[0].impacto);
  assert.ok(impacto);
  m.y -= 80; g.tick(.01);
  assert.deepEqual(g.kamehamehas[0].impacto, impacto);
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


test('silhueta do impacto gira nas oito direções e exclui cantos transparentes', () => {
  for(let i=0;i<8;i++) {
    const d={x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)},impacto={contatoX:200,contatoY:200};
    const ponto=(a,l)=>({x:200+a*d.x-l*d.y,y:200+a*d.y+l*d.x});
    assert.ok(atingidoPeloImpactoKame(ponto(32,0),impacto,d));
    for(const [a,l] of [[95,95],[-40,0],[140,0]])assert.equal(atingidoPeloImpactoKame(ponto(a,l),impacto,d),false);
  }
});
test('alvo selecionado recebe dano completo e impacto persiste após sua morte', () => {
  const { g, p, mob } = cena(150);
  const distante = mob(180), centro = mob(92), esquerda = mob(92, -32), direita = mob(92,32), fora = mob(155), primeiro = mob(60);
  primeiro.hp = 1;p.targetId=primeiro.id;
  g.cast(p,'kame');passar(g,.8);
  assert.equal(primeiro.hp,0);
  assert.equal(g.kamehamehas.length,1);assert.ok(g.kamehamehas[0].impacto);
  for(const alvo of [centro,esquerda,direita]) assert.ok(alvo.hp<alvo.maxHp);
  for(const alvo of [distante,fora]) assert.equal(alvo.hp,alvo.maxHp);
  const pos=structuredClone(g.kamehamehas[0].impacto);
  p.x+=20;p.facing={x:0,y:-1};passar(g,.2);
  assert.deepEqual(g.kamehamehas[0].impacto,pos);
  for(const alvo of [primeiro,centro,esquerda,direita]) assert.equal(g.events.filter(e=>e.type==='damage'&&e.targetId===alvo.id).length,1);
  passar(g,1.4);assert.equal(g.kamehamehas.length,0);
});
test('folha de impacto contém grade 4 × 4 com transparência',async()=>{
  const png=await readFile(new URL('../public'+IMPACTO_KAME.imagem,import.meta.url));
  assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1024);assert.equal(png[25],6);
});

test('alvo selecionado não é interceptado; dano secundário é dividido só entre mobs da silhueta',()=>{
  const {g,p,mob}=cena(50),bloqueador=mob(30),alvo=mob(110),a=mob(142),b=mob(142,32),fora=mob(200,90),outraHunt=mob(142,0,'media');
  p.targetId=alvo.id;const raw=p.stats.attack*4.2;
  assert.ok(g.cast(p,'kame').ok);passar(g,1.1);
  assert.equal(alvo.maxHp-alvo.hp,Math.round(raw*100/(100+(alvo.defesa??1)*3)));
  for(const m of [a,b])assert.equal(m.maxHp-m.hp,Math.round(raw/2*100/(100+(m.defesa??1)*3)));
  for(const m of [bloqueador,fora,outraHunt])assert.equal(m.hp,m.maxHp);
  passar(g,.5);for(const m of [alvo,a,b])assert.equal(g.events.filter(e=>e.type==='damage'&&e.targetId===m.id).length,1);
});
test('trocar seleção durante carga não redireciona técnica já iniciada; alvo inválido cancela',()=>{
  for(const invalidar of [m=>{m.hp=0;},m=>{m.area='media';}]){
    const {g,p,mob}=cena(50),alvo=mob(110),outro=mob(0,100);p.targetId=alvo.id;g.cast(p,'kame');p.targetId=outro.id;
    assert.equal(p.charge.targetId,alvo.id);invalidar(alvo);passar(g,1.1);assert.equal(outro.hp,outro.maxHp);assert.equal(g.kamehamehas.length,0);
  }
});

test('alvo selecionado colado ou sobreposto ao jogador também é atingido',()=>{
  for(const distancia of [0,5,19]){
    const {g,p,mob}=cena(50),alvo=mob(distancia-KAME.mao);p.targetId=alvo.id;
    assert.ok(g.cast(p,'kame').ok);passar(g,1);assert.ok(alvo.hp<alvo.maxHp);
  }
});

for(const nivel of [3,20,50,100,150])test('Auto Hunt nível '+nivel+': antecipa a carga e solta ao entrar no alcance',()=>{
  const {g,p,mob}=cena(nivel),alcance=estagioKame(nivel).alcance+KAME.mao;
  const alvo=mob(alcance+p.stats.mobility*KAME.carga-KAME.mao-3);
  p.autoHunt=true;p.autoSkills=true;p.autoAttack=false;
  g.tick(.01);assert.ok(p.charge);assert.ok(g.distanciaAoCorpo(p,alvo)>alcance,'carga começa fora do alcance');
  assert.equal(g.kamehamehas.length,0);
  let soltou=false;
  for(let i=0;i<200;i++){
    g.tick(.01);
    if(g.kamehamehas.length){
      const distancia=g.distanciaAoCorpo(p,alvo);
      assert.ok(distancia<=alcance,'não solta fora do alcance');
      assert.ok(distancia>alcance-p.stats.mobility*.05,'solta perto da borda, sem esperar corpo a corpo');
      soltou=true;break;
    }
  }
  assert.ok(soltou);
});
test('carga automática pronta aguarda alcance; desligar a caça cancela a espera',()=>{
  for(const cancelar of [false,true]){
    const {g,p,mob}=cena(20),alcance=estagioKame(20).alcance+KAME.mao;
    const alvo=mob(alcance+40-KAME.mao);p.autoHunt=true;p.autoSkills=true;
    // Simula aproximação interrompida por terreno sem tornar o alvo inválido.
    g.steer=ent=>{ent.moving=true;return true;};
    g.tick(.01);assert.ok(p.charge);
    passar(g,.9);assert.ok(p.charge);assert.equal(g.kamehamehas.length,0);
    if(cancelar){g.action(p.id,{type:'hunt',enabled:false});g.tick(.01);assert.equal(p.charge,null);}
    else{alvo.x=p.x+alcance-1;g.tick(.01);assert.equal(p.charge,null);assert.equal(g.kamehamehas.length,1);assert.ok(geometriaKame(20,g.time-g.kamehamehas[0].started));}
  }
});
