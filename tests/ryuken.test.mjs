import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {CONFIG,lugar} from '../public/shared/config.mjs';
import {RYUKEN} from '../public/shared/ryuken.mjs';

// Ryuken / Punho do Dragão (Pedro, 12/11/2026): só no SSJ3, na tecla do Kamehameha; alvo único, ×13,5, 40 Ki, 10 s.
function cena(){
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level:CONFIG.skills.ssj3});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  return {g,p};
}
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.05);i++)g.tick(.05);};
// Avança até o dragão acertar (ou o tempo acabar) e devolve o tempo gasto.
const ateAcertar=(g,m,max=3)=>{let t=0;while(m.hp===m.maxHp&&t<max){g.tick(.05);t+=.05;}return t;};
const mob=(g,p,dx)=>{const m=g.addMob('melee',p.x+dx,p.y);m.hp=m.maxHp=1e7;m.speed=0;m.aggro=0;return m;};

test('no SSJ3 a tecla do Kamehameha solta o Ryuken; fora dele continua o Kamehameha',()=>{
  const {g,p}=cena(),m=mob(g,p,120);p.targetId=m.id;
  g.cast(p,'transform');assert.equal(p.forma,'ssj3');
  assert.ok(g.cast(p,'kame').ok);assert.ok(p.ryuken);assert.equal(p.charge,null);
  const {g:g2,p:p2}=cena(),m2=mob(g2,p2,120);p2.targetId=m2.id;
  assert.ok(g2.cast(p2,'kame').ok);assert.ok(p2.charge);assert.equal(p2.ryuken,null);
});
test('custo 40 Ki, recarga 10 s e dano ×13,5 só no alvo, mesmo com outro mob no caminho',()=>{
  const {g,p}=cena(),alvo=mob(g,p,180),noCaminho=mob(g,p,90);p.targetId=alvo.id;g.cast(p,'transform');
  const ki=p.ki;assert.ok(g.cast(p,'kame').ok);assert.equal(p.ki,ki-40);
  assert.equal(g.cast(p,'kame').ok,false,'não lança outro enquanto o primeiro está saindo');
  const gasto=ateAcertar(g,alvo);assert.ok(gasto>=RYUKEN.lancamento,'o dragão só sai depois do lançamento');
  assert.equal(g.ryukenExplosoes.length,1);
  const def=100/(100+(alvo.defesa??1)*3);
  assert.equal(alvo.maxHp-alvo.hp,Math.round(p.stats.attack*13.5*def));
  assert.equal(noCaminho.hp,noCaminho.maxHp,'o dragão não acerta quem não é o alvo');
  passar(g,10-gasto-.1);assert.equal(g.cast(p,'kame').ok,false,'ainda em recarga');
  passar(g,.2);assert.equal(g.cast(p,'kame').ok,true);
});
test('o dragão acompanha o alvo que se move e o snapshot leva lançamento, voo e explosão',()=>{
  const {g,p}=cena(),alvo=mob(g,p,200),obs=g.addPlayer('o');g.levar(obs,lugar('inicial'));p.targetId=alvo.id;g.cast(p,'transform');
  g.cast(p,'kame');assert.ok(g.snapshot(obs.id).players.find(j=>j.id===p.id).ryuken);
  passar(g,RYUKEN.lancamento+.1);
  const voo=g.snapshot(obs.id).projectiles.find(s=>s.kind==='ryuken');assert.ok(voo);
  alvo.y+=60;ateAcertar(g,alvo);
  assert.ok(alvo.hp<alvo.maxHp,'alcançou o alvo depois que ele se moveu');
  assert.equal(g.snapshot(obs.id).ryukenExplosoes.length,1);
});
test('sem alvo ou fora do alcance não lança; sair do SSJ3 ou morrer cancela',()=>{
  {const {g,p}=cena();g.cast(p,'transform');assert.equal(g.cast(p,'kame').ok,false);}
  {const {g,p}=cena(),m=mob(g,p,2000);p.targetId=m.id;g.cast(p,'transform');assert.equal(g.cast(p,'kame').ok,false);}
  {const {g,p}=cena(),m=mob(g,p,150);p.targetId=m.id;g.cast(p,'transform');g.cast(p,'kame');g.cast(p,'transform');assert.equal(p.forma,'base');
   passar(g,2);assert.equal(m.hp,m.maxHp);assert.equal(g.projectiles.filter(s=>s.kind==='ryuken'&&s.ttl>0).length,0);}
  {const {g,p}=cena(),m=mob(g,p,150);p.targetId=m.id;g.cast(p,'transform');g.cast(p,'kame');p.hp=0;passar(g,2);assert.equal(m.hp,m.maxHp);}
});

test('tooltip do botão 2 no SSJ3 mostra o Ryuken; fora dele, o Kamehameha',async()=>{
  const {detalhesHabilidade}=await import('../public/render/detalhes-habilidades.mjs');
  const r=detalhesHabilidade('kame',{level:70,forma:'ssj3'});assert.match(r.nome,/Ryuken/);
  assert.equal(Object.fromEntries(r.linhas).Custo,'40 Ki');
  assert.equal(detalhesHabilidade('kame',{level:70,forma:'ssj2'}).nome,'Kamehameha');
});

test('voo começa onde o lançamento terminou (cabeça à frente do punho) e o último quadro fica até o voo chegar',async()=>{
  const {g,p}=cena(),alvo=mob(g,p,240);p.targetId=alvo.id;g.cast(p,"transform");assert.ok(g.cast(p,"kame").ok);
  passar(g,RYUKEN.lancamento+.05);
  const s=g.projectiles.find(x=>x.kind==='ryuken');assert.ok(s);
  const punhoX=p.x+20;assert.ok(s.x-punhoX>=RYUKEN.cabecaAFrente-1,'cabeça já à frente do punho');
  globalThis.Image=globalThis.Image||class{complete=true;naturalWidth=1024;};
  const {quadroRyuken}=await import('../public/render/ryuken.mjs');
  assert.equal(quadroRyuken('lancamento',RYUKEN.lancamento+.2),-1,'sem segurar, o lançamento some');
});
