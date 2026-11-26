import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { lugar } from '../public/shared/nucleo/config.mjs';
import { CHOCOLATE_BEAM } from '../public/shared/tecnicas/chocolate-beam.mjs';
import { tecnicasDoPerfil } from '../public/shared/tecnicas/barra-tecnicas.mjs';
import { estagioTecnicasBoo } from '../public/shared/tecnicas/majin-boo.mjs';
import { FORMAS_BOO, formaDisponivel } from '../public/shared/tecnicas/formas.mjs';
import { Autenticacao } from '../server/auth.mjs';

function cena() {
  const g = new Game({ now: 100, populate: false });
  const p = g.addPlayer('boo', 'Majin Boo', { vocacao: 'boo', level: 30 });
  Object.assign(p, { planet: 'namek', area: 'inicial', x: 1000, y: 1000 });
  const m = g.addMob('melee', 1260, 1000, 'inicial');
  p.targetId = m.id;
  return {g, p, m};
}
function ticks(g, segundos) {
  for (let i = 0; i < Math.round(segundos / .05); i++) g.tick(.05);
}
const raios = g => g.projectiles.filter(s => s.kind === CHOCOLATE_BEAM.id);

test('Boo é criado pelo catálogo, persiste a vocação e não recebe técnicas de outras vocações', () => {
  const auth = new Autenticacao();
  const conta = { personagens: [] };
  const criado = auth.criarPersonagem(conta, { nome: 'Majin Boo', vocacao: 'boo' });
  const g = new Game({populate:false});
  const p = g.addPlayer('p', criado.save.name, criado.save);
  assert.equal(p.vocacao, 'boo');
  assert.equal(g.exportPlayer(p).vocacao, 'boo');
  assert.equal(p.barraTecnicas[1], 'skill:chocolateBeam');
  assert.deepEqual(tecnicasDoPerfil('boo').map(t => t.id).sort(), [
    'form:buuhan', 'form:buutenks', 'form:evilBoo', 'form:kidBoo', 'form:superBoo',
    'skill:angryExplosion', 'skill:chocolateBeam', 'skill:cloneSummoning', 'skill:heal', 'skill:supernova'
  ]);
  assert.equal(g.cast(p,'transform').ok,false);
  assert.equal(g.cast(p,'kame').ok,false);
});

test('Raio valida vocação, nível, alcance, alvo e zona segura antes do custo', () => {
  const {g,p,m} = cena();
  const ki = p.ki;
  p.level = 29;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  p.level = 30; p.vocacao = 'vegeta';
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  p.vocacao = 'boo'; m.x += 700;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  m.x -= 700; p.targetId = null;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  g.levar(p,lugar('inicial')); p.targetId=m.id;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  assert.equal(p.ki,ki);
  assert.equal(p.chocolateBeamReady,0);
});

test('Raio segue a marca, causa dano uma vez e atordoa pela duração da forma base', () => {
  const {g,p,m} = cena();
  const outro = g.addMob('melee', 1120, 1000, 'inicial');
  m.attackReady = outro.attackReady = 1000;
  m.speed = outro.speed = 0;
  const hp = m.hp, ki = p.ki, hpOutro = outro.hp;
  assert.ok(g.cast(p,CHOCOLATE_BEAM.id).ok);
  assert.equal(p.ki,ki-CHOCOLATE_BEAM.custo);
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  ticks(g,.25);
  assert.equal(raios(g).length,0);
  ticks(g,.2);
  assert.equal(raios(g).length,1);
  p.targetId = outro.id;
  m.y += 30;
  m.telegraph = {kind:'area',started:g.time,until:g.time+1.8,x:p.x,y:p.y,radius:45};
  ticks(g,.35);
  assert.equal(raios(g).length,0);
  const dano = Math.max(1, Math.round(p.stats.attack * .18 * 100 / (100 + (m.defesa ?? 1) * 3)));
  assert.equal(m.hp,hp-dano);
  assert.equal(outro.hp,hpOutro);
  assert.equal(outro.chocolate,undefined);
  assert.equal(m.telegraph,null);
  assert.ok(Math.abs(m.chocolate.until - m.chocolate.started - 1.4) < 1e-9);
  assert.deepEqual(g.snapshot(p.id).mobs.find(s=>s.id===m.id).chocolate,m.chocolate);
  const pos = [m.x,m.y], ate = m.chocolate.until;
  p.targetId=m.id; p.chocolateBeamReady=0;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,false);
  g.time = ate - .01; g.updateMob(m,.05);
  assert.deepEqual([m.x,m.y],pos);
  assert.equal(m.telegraph,null);
  g.time = ate; g.updateMob(m,.05);
  assert.equal(m.chocolate,null);
  assert.equal(m.hp,hp-dano);
  assert.equal(p.kills,0);
  assert.equal(p.xp,0);
});

test('Raio de Chocolate letal credita o abate uma vez e não atordoa o mob morto', () => {
  const {g,p,mob}=cenaBoo(700);
  p.forma='kidBoo';
  const alvo=mob(100,0);
  p.targetId=alvo.id;
  alvo.hp=1;
  assert.equal(g.cast(p,CHOCOLATE_BEAM.id).ok,true);
  ticks(g,.75);
  assert.equal(alvo.hp,0);
  assert.equal(alvo.chocolate,null);
  assert.equal(p.kills,1);
  ticks(g,.5);
  assert.equal(p.kills,1);
});

test('morte ou troca de área cancelam um raio no ar sem efeito no alvo', () => {
  for (const modo of ['morte','portal','desconexao']) {
    const {g,p,m} = cena();
    m.speed=0;
    assert.ok(g.cast(p,CHOCOLATE_BEAM.id).ok);
    ticks(g,.4);
    assert.equal(raios(g).length,1);
    if (modo==='portal') g.levar(p,lugar('vila'));
    if (modo==='desconexao') p.connected=false;
    if (modo==='morte') {p.hp=0;p.respawnAt=g.time+4;}
    ticks(g,.1);
    assert.equal(raios(g).length,0);
    assert.equal(m.chocolate,undefined);
  }
});

test('Auto Hunt usa o mesmo cast e a mesma aplicação do Raio de Chocolate', () => {
  const {g,p,m} = cena();
  p.autoHunt=true;p.autoSkills=true;p.autoAttack=false;m.speed=0;
  g.steer=()=>true;
  g.alvoMaisProximo=()=>m;
  ticks(g,.05);
  assert.equal(p.charge.chocolateBeam,true);
  assert.equal(p.charge.automated,true);
  ticks(g,.9);
  assert.ok(m.chocolate?.until>g.time);
});

test('Raio tem duração fixa mesmo em mob à distância e nunca reinicia o status', () => {
  const {g,p} = cena();
  const m = g.addMob('ranged', p.x + 21, p.y, 'inicial');
  m.speed=0;
  m.attackReady=1000;
  p.targetId=m.id;
  const segundo = g.addPlayer('boo2','Outro Boo',{vocacao:'boo',level:30});
  Object.assign(segundo,{planet:p.planet,area:p.area,x:p.x,y:p.y,targetId:m.id});
  assert.ok(g.cast(p,CHOCOLATE_BEAM.id).ok);
  assert.ok(g.cast(segundo,CHOCOLATE_BEAM.id).ok);
  ticks(g,.5);
  const status=m.chocolate;
  assert.ok(status);
  assert.ok(Math.abs(status.until-status.started-1.4)<1e-9);
  assert.equal(raios(g).length,0);
  ticks(g,.8);
  assert.equal(m.chocolate,status);
  assert.equal(g.hit(p,m,1e6),true);
  assert.equal(m.hp,0);
  assert.equal(m.chocolate,null);
});

test('Soco e Rajada de Ki do Boo saem na pose de ação uma vez', () => {
  const {g,p,m}=cena();
  m.x=p.x+40;m.y=p.y;m.speed=0;m.attackReady=1000;
  const hp=m.hp;
  assert.ok(g.cast(p,'basic').ok);
  ticks(g,.15);
  assert.equal(m.hp,hp);
  ticks(g,.05);
  assert.ok(m.hp<hp);
  const depois=m.hp;
  ticks(g,.05);
  assert.equal(m.hp,depois);
  m.x=p.x;m.y=p.y-260;
  p.aim={x:m.x,y:m.y};
  assert.ok(g.cast(p,'ki').ok);
  ticks(g,.2);
  assert.equal(g.projectiles.length,0);
  ticks(g,.1);
  assert.equal(g.projectiles.filter(s=>s.kind==='ki').length,1);
});

function cenaBoo(level = 150, beneficiosDeTeste = false) {
  const g = new Game({ now: 100, populate: false, random: () => .999, beneficiosDeTeste });
  const p = g.addPlayer('boo', 'Boo', { vocacao: 'boo', level });
  Object.assign(p, { planet: 'namek', area: 'inicial', x: 3100, y: 2250 });
  const mob = (dx, dy, tipo = 'melee') => {
    const m = g.addMob(tipo, p.x + dx, p.y + dy, p.area);
    Object.assign(m, { hp: 100000, maxHp: 100000, speed: 0, attackReady: 10000 });
    return m;
  };
  return {g,p,mob};
}

test('Clones materializam juntos, recebem aggro e dano reais e creditam o abate ao dono', () => {
  const {g,p,mob}=cenaBoo(60);
  const m=mob(60,0);
  p.targetId=m.id;
  g.somarAmeaca(m,p,2000);
  m.alvoId=p.id;
  const ki=p.ki;
  assert.equal(g.cast(p,'cloneSummoning').ok,true);
  assert.equal(g.cast(p,'cloneSummoning').ok,false);
  ticks(g,.55);
  assert.equal(g.combateBoo.clones.size,0);
  ticks(g,.05);
  const grupo=[...g.combateBoo.clones.values()];
  assert.equal(grupo.length,1);
  assert.equal(new Set(grupo.map(c=>c.id)).size,1);
  assert.equal(new Set(grupo.map(c=>`${c.x}:${c.y}`)).size,1);
  assert.equal(g.players.size,1);
  assert.equal(p.cloneSummoningReady, g.time + 45);
  assert.equal(p.ki,ki-Math.ceil(p.stats.ki*.25));
  assert.ok(grupo.every(c=>g.alvoDoCombate(c.id)===null));
  assert.ok(grupo.every(c=>g.hit(m,c,100)===false));
  assert.equal(m.hp,m.maxHp);
  ticks(g,.6);
  ticks(g,.55);
  const clone=g.alvoDoMob(m);
  assert.ok(grupo.includes(clone));
  assert.equal(g.hit(m,clone,50),true);
  assert.ok(clone.defesa <= 1);
  assert.ok(clone.maxHp-clone.hp >= 48);
  assert.equal(p.hp,p.stats.hp);
  p.cloneSummoningReady=0;
  assert.equal(g.cast(p,'cloneSummoning').ok,false);
  m.hp=1;
  ticks(g,.5);
  assert.equal(m.hp,0);
  assert.equal(p.kills,1);
  assert.equal(g.exportPlayer(p).clonesBoo,undefined);
  assert.equal(g.hit(mob(72,45),clone,1e9),true);
  ticks(g,.05);
  assert.equal(g.combateBoo.clones.has(clone.id),false);
  g.levar(p,lugar('vila'));
  ticks(g,.05);
  assert.equal(g.combateBoo.clones.size,0);
  assert.ok(grupo.every(c=>!m.ameaca?.has(c.id)));
});

test('invocação cancelada ou sem pontos livres não cobra Ki nem cria grupo parcial', () => {
  const {g,p}=cenaBoo(60);
  const ki=p.ki;
  assert.equal(g.cast(p,'cloneSummoning',true).ok,true);
  ticks(g,.6);
  assert.equal(g.combateBoo.clones.size,0);
  assert.equal(p.ki,ki);
  g.combateBoo.pontosDosClones=()=>null;
  assert.equal(g.cast(p,'cloneSummoning').ok,false);
  assert.equal(p.cloneSummoningReady,undefined);
  assert.equal(g.combateBoo.clones.size,0);
});

test('Supernova fixa o centro nos pés, puxa apenas elegíveis e executa exatamente seis pulsos', () => {
  const {g,p,mob}=cenaBoo(100);
  const m=mob(125,0), dentro=mob(170,38), fora=mob(270,0), chefe=mob(125,-60,'subboss');
  p.targetId=m.id;
  const eventos = alvo => g.events.filter(e=>e.type==='damage'&&e.targetId===alvo.id);
  const atingidos = new Map();
  const hit=g.hit.bind(g);
  g.hit=(j,a,...rest)=> {
    const aplicado=hit(j,a,...rest);
    if(aplicado) atingidos.set(a.id,(atingidos.get(a.id)||0)+1);
    return aplicado;
  };
  assert.equal(g.cast(p,'supernova').ok,true);
  ticks(g,1.15);
  assert.equal(g.combateBoo.efeitos.size,0);
  ticks(g,.05);
  const [e]=g.combateBoo.efeitos.values();
  assert.equal(e.x,m.x); assert.equal(e.y,m.y);
  assert.equal(e.raio,96);
  m.x+=49;
  const antes=Math.hypot(dentro.x-e.x,dentro.y-e.y), chefeX=chefe.x, chefeY=chefe.y;
  ticks(g,.5);
  assert.equal(eventos(m).length,1);
  assert.ok(Math.hypot(dentro.x-e.x,dentro.y-e.y)<antes);
  assert.equal(g.combateBoo.fatorMovimento(dentro),.65);
  assert.equal(g.combateBoo.fatorMovimento(chefe),1);
  assert.deepEqual([chefe.x,chefe.y],[chefeX,chefeY]);
  assert.deepEqual([e.x,e.y],[p.x+125,p.y]);
  p.supernovaReady=0;
  assert.equal(g.cast(p,'supernova').ok,false);
  ticks(g,5.5);
  assert.equal(atingidos.get(m.id),6);
  assert.equal(atingidos.get(dentro.id),6);
  assert.equal(atingidos.get(chefe.id),6);
  assert.equal(atingidos.get(fora.id),undefined);
  assert.equal(g.combateBoo.efeitos.size,0);
  assert.equal(g.combateBoo.fatorMovimento(dentro),1);
});

test('Supernova reserva o alvo da conjuração e cancela se ele sair do alcance', () => {
  const {g,p,mob}=cenaBoo(100);
  const m=mob(125,0), outro=mob(100,50);
  p.targetId=m.id;
  const ki=p.ki;
  assert.ok(g.cast(p,'supernova').ok);
  m.x+=500;
  p.targetId=outro.id;
  ticks(g,1.2);
  assert.equal(g.combateBoo.efeitos.size,0);
  assert.equal(p.supernovaReady,undefined);
  assert.equal(p.ki,ki);
});

test('Angry Explosion não requer alvo, acerta o limite uma vez e respeita mapa, vocação e nível', () => {
  const {g,p,mob}=cenaBoo();
  const dentro=mob(80,0), limite=mob(0,128), fora=mob(-129,0), outraArea=mob(10,0);
  outraArea.area='vila';
  p.level=99;
  assert.equal(g.cast(p,'angryExplosion').ok,false);
  p.level=100; p.vocacao='goku';
  assert.equal(g.cast(p,'angryExplosion').ok,false);
  p.vocacao='boo'; p.ki=0;
  assert.equal(g.cast(p,'angryExplosion').ok,false);
  p.ki=p.stats.ki;
  assert.equal(g.cast(p,'angryExplosion',true).ok,false);
  assert.equal(g.cast(p,'angryExplosion').ok,true);
  ticks(g,.95);
  assert.equal(dentro.hp,dentro.maxHp);
  ticks(g,.05);
  const dano=dentro.maxHp-dentro.hp;
  assert.ok(dano>0); assert.ok(limite.hp<limite.maxHp);
  assert.equal(fora.hp,fora.maxHp); assert.equal(outraArea.hp,outraArea.maxHp);
  const [e]=g.combateBoo.efeitos.values();
  assert.equal(e.raio,128); assert.equal(e.x,p.x); assert.equal(e.y,p.y);
  fora.x=p.x-126;
  ticks(g,1.1);
  assert.equal(fora.hp,fora.maxHp);
  assert.equal(dentro.maxHp-dentro.hp,dano);
  assert.equal(g.combateBoo.efeitos.size,0);
  assert.equal(g.cast(p,'angryExplosion').ok,false);
});


test('cada forma do Boo libera no nível certo sem God Mode e mantém o kit da vocação', () => {
  assert.deepEqual(FORMAS_BOO.map(f=>[f.forma,f.nivel]), [
    ['evilBoo',100], ['superBoo',200], ['buutenks',300], ['buuhan',500], ['kidBoo',700]
  ]);
  for (const [i, forma] of FORMAS_BOO.entries()) {
    assert.equal(formaDisponivel(forma.nivel-1,'boo')?.forma,FORMAS_BOO[i-1]?.forma);
    const bloqueado=cenaBoo(forma.nivel-1);
    assert.equal(bloqueado.g.cast(bloqueado.p,'transform',false,forma.forma).ok,false);
    const {g,p}=cenaBoo(forma.nivel);
    assert.equal(g.cast(p,'transform').ok,true);
    assert.equal(p.forma,forma.forma);
    assert.equal(g.snapshot(p.id).players[0].transformed,true);
    assert.equal(g.exportPlayer(p).forma,undefined);
    assert.equal(g.cast(p,'transform').ok,true);
    assert.equal(p.forma,'base');
  }
});

test('Auto Hunt usa a maior forma liberada, e desativar God Mode remove uma forma acima do nível real', () => {
  const {g,p}=cenaBoo(300,true);
  p.comboAutoHunt={ordem:[],reserva:0,buff:null,buffMaisAlto:true};
  assert.equal(g.aplicarBuffDoCombo(p),true);
  assert.equal(p.forma,'buutenks');
  g.action(p.id,{type:'godmode'});
  assert.equal(g.aplicarBuffDoCombo(p),true);
  assert.equal(p.forma,'kidBoo');
  p.autoHunt=true;
  g.action(p.id,{type:'godmode'});
  assert.equal(p.level,300);
  assert.equal(p.forma,'buutenks');
});


test('cada forma congela quantidade, stun, raio, atração e dano na execução', () => {
  const formas = ['base', ...FORMAS_BOO.map(f=>f.forma)];
  for (const [i, forma] of formas.entries()) {
    const etapa = estagioTecnicasBoo(forma), anterior = i && estagioTecnicasBoo(formas[i-1]);
    assert.equal(etapa.clones, [1,1,2,3,4,5][i]);
    assert.equal(etapa.danoChocolate, [.18,.26,.34,.42,.50,.58][i]);
    assert.equal(etapa.raioNova, [96,128,144,160,176,192][i]);
    assert.equal(etapa.raioAngry, [128,160,176,192,208,224][i]);
    if (anterior) for (const atributo of ['stun','danoChocolate','raioNova','atracao','danoNova','raioAngry','danoAngry'])
      assert.ok(etapa[atributo] > anterior[atributo], atributo + ' ' + forma);
    const {g,p,mob}=cenaBoo(700);
    p.forma=forma;
    const alvo=mob(95,0), outro=mob(-50,0);
    p.targetId=alvo.id;
    assert.ok(g.cast(p,'cloneSummoning').ok);
    ticks(g,.6);
    assert.equal(g.combateBoo.clones.size,etapa.clones,forma);
    ticks(g,.6);
    const danosBoo = [];
    const hit = g.hit.bind(g);
    g.hit = (atacante, mob, dano, opcoes) => {
      if (atacante === p && mob === alvo) danosBoo.push(dano);
      return hit(atacante, mob, dano, opcoes);
    };
    assert.ok(g.cast(p,'chocolateBeam').ok);
    ticks(g,.65);
    assert.deepEqual(danosBoo,[p.stats.attack*etapa.danoChocolate]);
    assert.ok(Math.abs(alvo.chocolate.until-alvo.chocolate.started-etapa.stun)<1e-6);
    assert.ok(g.cast(p,'supernova').ok);
    ticks(g,1.2);
    const nova=[...g.combateBoo.efeitos.values()].find(e=>e.tipo==='supernova');
    assert.equal(nova.raio,etapa.raioNova);
    assert.equal(nova.atracao,etapa.atracao);
    assert.equal(nova.dano,p.stats.attack*etapa.danoNova);
    ticks(g,6);
    const hp=outro.hp;
    assert.ok(g.cast(p,'angryExplosion').ok);
    ticks(g,1);
    const angry=[...g.combateBoo.efeitos.values()].find(e=>e.tipo==='angryExplosion');
    assert.equal(angry.raio,etapa.raioAngry);
    assert.equal(hp-outro.hp,Math.round(p.stats.attack*etapa.danoAngry*100/(100+outro.defesa*3)));
  }
});

test('clones trocam para o alvo marcado e seguem o Boo quando perde a marca', () => {
  const {g,p,mob}=cenaBoo(200);
  p.forma='superBoo';
  const primeiro=mob(55,0), segundo=mob(0,60);
  p.targetId=primeiro.id;
  assert.ok(g.cast(p,'cloneSummoning').ok);
  ticks(g,2.5);
  const clones=[...g.combateBoo.clones.values()];
  assert.equal(clones.length,2);
  assert.ok(clones.every(c=>c.strikeStarted));
  assert.equal(segundo.hp,segundo.maxHp);
  p.targetId=segundo.id;
  const hpPrimeiro=primeiro.hp;
  ticks(g,1.5);
  assert.equal(primeiro.hp,hpPrimeiro);
  assert.ok(segundo.hp<segundo.maxHp);
  p.targetId=null;
  p.y-=120;
  const dist=c=>Math.hypot(c.x-p.x,c.y-p.y);
  const antes=clones.map(dist);
  ticks(g,1.25);
  assert.ok(clones.every((c,i)=>dist(c)<antes[i]-40));
});
