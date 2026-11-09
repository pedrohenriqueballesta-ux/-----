import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game} from '../public/shared/game.mjs';
import {lugar,CONFIG} from '../public/shared/config.mjs';
import {statsFor} from '../public/shared/characters.mjs';
import {GENKI} from '../public/shared/genki.mjs';
import {GOKU_GENKI} from '../public/art/goku-genki.mjs';
import {GOKU_PASSO} from '../public/art/goku-passo.mjs';
import {colunaGenki,apresentarGenkiJogador,POSE_GENKI} from '../public/render/genki-personagem.mjs';
import {geometriaGenki} from '../public/render/genki.mjs';
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.01);i++)g.tick(.01);};
function cena(){const g=new Game({now:1000,populate:false}),p=g.addPlayer('goku');g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.level=50;p.stats=statsFor(50);p.ki=p.stats.ki;p.hp=p.stats.hp;p.autoAttack=p.autoSkills=false;return {g,p};}
test('folha 6 mantém 5×4, base dos pés e escala de corpo sem cortar mãos',async()=>{
 const f=GOKU_GENKI,png=await readFile(new URL('../public'+f.file,import.meta.url));
 assert.equal(f.rows,5);assert.equal(f.columns,4);assert.equal(png.readUInt32BE(16),f.width);assert.equal(png.readUInt32BE(20),f.height);
 assert.ok(Math.abs(f.referenceHeight-GOKU_PASSO.referenceHeight)<=6);
 assert.ok(f.frames[0][0][3]>300,'célula comporta os braços erguidos');
 for(const linha of f.frames){assert.equal(linha.length,4);const bases=linha.map(q=>q[5]-q[1]);assert.equal(new Set(bases).size,1);for(const [x,y,w,h,ax,ay]of linha){assert.ok(ax>x&&ax<x+w&&ay>y&&ay<y+h);assert.ok(x+w<=f.width&&y+h<=f.height);}}
});
test('pose passa por 0 → 1 na carga e 2 → 3 no lançamento, depois encerra',()=>{
 const p={id:'g',genkiCarga:{started:10,until:11.92}};
 for(const [t,col]of [[10,0],[10.249,0],[10.25,1],[11.91,1]])assert.equal(colunaGenki(p,t),col);
 const lancado={id:'g',genkiLancado:20};
 for(const [t,col]of [[19.99,null],[20,2],[20.149,2],[20.151,3],[20.349,3],[20.351,null]])assert.equal(colunaGenki(lancado,t),col);
 assert.equal(colunaGenki({...p,dead:true},10.3),null);
});
test('carga e arremesso usam a direção da Genki apenas na apresentação; SSJ mantém folhas antigas',()=>{
 const p={id:'p',facing:{x:1,y:0}},g={owner:'p',started:10,until:11.92,direction:{x:-1,y:-1}};
 const visual=apresentarGenkiJogador(p,[g],10.5);assert.deepEqual(visual.facing,g.direction);assert.deepEqual(p.facing,{x:1,y:0});
 assert.equal(colunaGenki(apresentarGenkiJogador(p,[],10.5),10.5),null);
 assert.deepEqual(apresentarGenkiJogador({...p,transformed:true},[g],10.5).facing,p.facing);
 const arremesso=apresentarGenkiJogador({...p,genkiLancado:12,genkiDirecao:g.direction},[],12.2);assert.deepEqual(arremesso.facing,g.direction);
});
test('snapshot sincroniza lançamento para observadores da mesma hunt e não vaza para outra',()=>{
 const {g,p}=cena(),mesmo=g.addPlayer('mesmo'),outro=g.addPlayer('outro');g.levar(mesmo,lugar(p.area));g.levar(outro,lugar('media'));
 assert.ok(g.cast(p,'genki').ok);const ki=p.ki,cooldown=p.genkiReady;passar(g,GENKI.carga+.01);
 const pp=g.snapshot(mesmo.id).players.find(j=>j.id===p.id);assert.ok(Number.isFinite(pp.genkiLancado));assert.deepEqual(pp.genkiDirecao,g.projectiles.find(s=>s.kind==='genki')?p.genkiDirecao:null);
 assert.equal(g.snapshot(outro.id).players.some(j=>j.id===p.id),false);
 assert.ok(p.ki>=ki);assert.equal(p.genkiReady,cooldown);assert.equal(CONFIG.skillCosts.genki,60);assert.equal(CONFIG.skillCooldowns.genki,45);
 passar(g,.36);assert.equal(g.snapshot(p.id).players.find(j=>j.id===p.id).genkiLancado,null);
});
test('morte, desconexão, portal e safe zone encerram carga e pose de arremesso',()=>{
 for(const lancar of [false,true])for(const cancelar of [p=>{p.hp=0;p.respawnAt=Infinity;},p=>{p.connected=false;},(p,g)=>g.levar(p,lugar('media')),p=>{Object.assign(p,lugar('inicial').chegada);}]){
  const {g,p}=cena();g.cast(p,'genki');if(lancar)passar(g,GENKI.carga+.01);cancelar(p,g);g.tick(.01);
  assert.equal(g.genkiCharges.length,0);assert.equal(p.genkiLancado,null);
  assert.equal(colunaGenki(apresentarGenkiJogador({...p,dead:p.hp<=0},g.genkiCharges,g.time),g.time),null);
 }
});
test('encaixe de apresentação da canalização não altera energia de SSJ, voo ou área',()=>{
 const efeito={started:10,x:100,y:200};const base=geometriaGenki('carga',efeito,10.5,{x:100,y:200,alturaCanalizacao:POSE_GENKI.alturaCanalizacao});
 assert.equal(base.y,200-POSE_GENKI.alturaCanalizacao);assert.equal(geometriaGenki('carga',efeito,10.5).y,138);
 assert.equal(GENKI.alturaOrigem,95);assert.equal(GENKI.velocidade,265);assert.equal(GENKI.area,72);assert.equal(GENKI.carga,1.92);
});
