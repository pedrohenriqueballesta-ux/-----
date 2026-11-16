import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {CONFIG,lugar} from '../public/shared/config.mjs';
import {RYUKEN} from '../public/shared/ryuken.mjs';

// Ryuken / Punho do Dragão (Pedro, 12/11/2026): só no SSJ3, alvo único, ×13,5, 40 Ki, 10 s.
// Desde 16/11/2026 é técnica própria (tecla 8): no SSJ3 o Kamehameha continua na tecla 2.
function cena(level=CONFIG.skills.ssj3){
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  return {g,p};
}
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.05);i++)g.tick(.05);};
// Avança até o dragão acertar (ou o tempo acabar) e devolve o tempo gasto.
const ateAcertar=(g,m,max=3)=>{let t=0;while(m.hp===m.maxHp&&t<max){g.tick(.05);t+=.05;}return t;};
const mob=(g,p,dx)=>{const m=g.addMob('melee',p.x+dx,p.y);m.hp=m.maxHp=1e7;m.speed=0;m.aggro=0;return m;};

test('no SSJ3 o Kamehameha continua na tecla 2 e o Ryuken é outra técnica; fora do SSJ3 o Ryuken não sai',()=>{
  const {g,p}=cena(),m=mob(g,p,120);p.targetId=m.id;
  g.cast(p,'transform');assert.equal(p.forma,'ssj3');
  assert.ok(g.cast(p,'kame').ok);assert.ok(p.charge);assert.equal(p.ryuken,null);
  assert.equal(g.cast(p,'ryuken').ok,false,'não solta os dois ao mesmo tempo');
  passar(g,2);assert.ok(g.cast(p,'ryuken').ok);assert.ok(p.ryuken);
  const {g:g2,p:p2}=cena(),m2=mob(g2,p2,120);p2.targetId=m2.id;
  assert.equal(g2.cast(p2,'ryuken').ok,false,'na forma base não sai');assert.equal(p2.ryuken,null);
  const {g:g3,p:p3}=cena(CONFIG.skills.ryuken-1),m3=mob(g3,p3,120);p3.targetId=m3.id;p3.forma='ssj3';
  assert.equal(g3.cast(p3,'ryuken').ok,false,'antes do nível 300 não sai');
});
test('o Auto Hunt no SSJ3 usa o Ryuken quando está pronto',()=>{
  const {g,p}=cena(),m=mob(g,p,150);p.targetId=m.id;g.cast(p,'transform');
  p.autoHunt=true;p.autoSkills=true;p.autoAttack=false;g.tick(.05);
  assert.ok(p.ryuken,'lançou o Ryuken');assert.equal(p.charge,null);
});
test('custo 40 Ki, recarga 10 s e dano ×13,5 só no alvo, mesmo com outro mob no caminho',()=>{
  const {g,p}=cena(),alvo=mob(g,p,180),noCaminho=mob(g,p,90);p.targetId=alvo.id;g.cast(p,'transform');
  const ki=p.ki;assert.ok(g.cast(p,'ryuken').ok);assert.equal(p.ki,ki-40);
  assert.equal(g.cast(p,'ryuken').ok,false,'não lança outro enquanto o primeiro está saindo');
  const gasto=ateAcertar(g,alvo);assert.ok(gasto>=RYUKEN.lancamento,'o dragão só sai depois do lançamento');
  assert.equal(g.ryukenExplosoes.length,1);
  const def=100/(100+(alvo.defesa??1)*3);
  assert.equal(alvo.maxHp-alvo.hp,Math.round(p.stats.attack*13.5*def));
  assert.equal(noCaminho.hp,noCaminho.maxHp,'o dragão não acerta quem não é o alvo');
  passar(g,10-gasto-.1);assert.equal(g.cast(p,'ryuken').ok,false,'ainda em recarga');
  passar(g,.2);assert.equal(g.cast(p,'ryuken').ok,true);
});
test('o dragão acompanha o alvo que se move e o snapshot leva lançamento, voo e explosão',()=>{
  const {g,p}=cena(),alvo=mob(g,p,200),obs=g.addPlayer('o');g.levar(obs,lugar('inicial'));p.targetId=alvo.id;g.cast(p,'transform');
  g.cast(p,'ryuken');assert.ok(g.snapshot(obs.id).players.find(j=>j.id===p.id).ryuken);
  passar(g,RYUKEN.lancamento+.1);
  const voo=g.snapshot(obs.id).projectiles.find(s=>s.kind==='ryuken');assert.ok(voo);
  alvo.y+=60;ateAcertar(g,alvo);
  assert.ok(alvo.hp<alvo.maxHp,'alcançou o alvo depois que ele se moveu');
  assert.equal(g.snapshot(obs.id).ryukenExplosoes.length,1);
});
test('sem alvo ou fora do alcance não lança; sair do SSJ3 ou morrer cancela',()=>{
  {const {g,p}=cena();g.cast(p,'transform');assert.equal(g.cast(p,'ryuken').ok,false);}
  {const {g,p}=cena(),m=mob(g,p,2000);p.targetId=m.id;g.cast(p,'transform');assert.equal(g.cast(p,'ryuken').ok,false);}
  {const {g,p}=cena(),m=mob(g,p,150);p.targetId=m.id;g.cast(p,'transform');g.cast(p,'ryuken');g.cast(p,'transform');assert.equal(p.forma,'base');
   passar(g,2);assert.equal(m.hp,m.maxHp);assert.equal(g.projectiles.filter(s=>s.kind==='ryuken'&&s.ttl>0).length,0);}
  {const {g,p}=cena(),m=mob(g,p,150);p.targetId=m.id;g.cast(p,'transform');g.cast(p,'ryuken');p.hp=0;passar(g,2);assert.equal(m.hp,m.maxHp);}
});

test('tooltip: o botão 2 segue Kamehameha no SSJ3 e o botão 8 mostra o Ryuken',async()=>{
  const {detalhesHabilidade}=await import('../public/render/detalhes-habilidades.mjs');
  const r=detalhesHabilidade('ryuken',{level:CONFIG.skills.ryuken,forma:'ssj3'}),l=Object.fromEntries(r.linhas);
  assert.match(r.nome,/Ryuken/);assert.equal(l.Custo,'40 Ki');assert.equal(l.Estado,'Disponível');
  assert.match(Object.fromEntries(detalhesHabilidade('ryuken',{level:CONFIG.skills.ryuken,forma:'ssj2'}).linhas).Estado,/Super Saiyajin 3/);
  assert.equal(detalhesHabilidade('kame',{level:CONFIG.skills.ryuken,forma:'ssj3'}).nome,'Kamehameha');
});
test('Ryuken começa no slot 8, que pode receber outras técnicas',async()=>{
  const {ATALHOS}=await import('../public/shared/atalhos.mjs');
  const {barraPadrao,barraValida}=await import('../public/shared/barra-tecnicas.mjs');
  assert.deepEqual(ATALHOS.filter(a=>a.teclas.includes('8')).map(a=>a.id),['barraTecnicas']);
  assert.equal(ATALHOS.some(a=>a.teclas.includes('9')),false);
  assert.equal(barraPadrao()[7],'skill:ryuken');
  const nova=[...barraPadrao()];nova[7]='skill:superKamehameha';
  assert.deepEqual(barraValida(nova),nova);
});

test('voo começa onde o lançamento terminou (cabeça à frente do punho) e o último quadro fica até o voo chegar',async()=>{
  const {g,p}=cena(),alvo=mob(g,p,240);p.targetId=alvo.id;g.cast(p,"transform");assert.ok(g.cast(p,"ryuken").ok);
  passar(g,RYUKEN.lancamento+.05);
  const s=g.projectiles.find(x=>x.kind==='ryuken');assert.ok(s);
  const punhoX=p.x+20;assert.ok(s.x-punhoX>=RYUKEN.cabecaAFrente-1,'cabeça já à frente do punho');
  globalThis.Image=globalThis.Image||class{complete=true;naturalWidth=1024;};
  const {quadroRyuken}=await import('../public/render/ryuken.mjs');
  assert.equal(quadroRyuken('lancamento',RYUKEN.lancamento+.2),-1,'sem segurar, o lançamento some');
});
