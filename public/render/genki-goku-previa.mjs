import {Game} from '../shared/game.mjs';
import {lugar} from '../shared/config.mjs';
import {statsFor} from '../shared/characters.mjs';
import {GENKI} from '../shared/genki.mjs';
import {DIRECTIONS} from './camera.mjs';
import {art} from '../art/assets.mjs';
import {FOLHAS_GOKU_BASE} from '../art/goku-base.mjs';
import {drawGoku} from '../art/goku.mjs';
import {carregarGenki,desenharGenki,GENKI_ARTE} from './genki.mjs';
import {apresentarGenkiJogador,POSE_GENKI} from './genki-personagem.mjs';
import {carregarNimbus,desenharNimbus} from './nimbus.mjs';
const ctx=document.getElementById('previa').getContext('2d'),fase=document.getElementById('fase'),alvo=document.getElementById('alvo'),nimbus=document.getElementById('nimbus'),segura=document.getElementById('segura');
const tempos={erguendo:.1,carga:.8,preparando:GENKI.carga+.07,arremesso:GENKI.carga+.23,normal:GENKI.carga+.5};
carregarGenki();
await Promise.all([...Object.values(FOLHAS_GOKU_BASE).map(([,chave])=>art[chave].decode()),carregarNimbus(),...Object.values(GENKI_ARTE).map(a=>{const im=new Image();im.src=a.imagem;return im.decode();})]);
let cenas=[],antes=performance.now();
function criar(){
 cenas=DIRECTIONS.map(d=>{
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('previa');g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.level=50;p.stats=statsFor(50);p.hp=p.stats.hp;p.ki=p.stats.ki;p.autoAttack=p.autoSkills=false;
  const norma=Math.hypot(d.x,d.y);p.facing={x:d.x/norma,y:d.y/norma};p.montaria=nimbus.checked?'nimbus':null;
  if(alvo.checked){const m=g.addMob('melee',p.x+p.facing.x*500,p.y+p.facing.y*500,p.area);m.hp=m.maxHp=100000;m.speed=0;m.attackReady=Infinity;m.agressivo=false;p.targetId=m.id;}
  g.cast(p,'genki');const tempo=tempos[fase.value]||0;
  for(let t=0;t<tempo-.00001;t+=.01)g.tick(.01);
  if(segura.checked){const z=lugar('inicial');p.x=z.chegada.x;p.y=z.chegada.y;g.tick(.01);}
  return{g,p,d};
 });
}
for(const el of [fase,alvo,nimbus,segura])el.onchange=criar;
criar();
function quadro(agora){
 const dt=Math.min(.04,(agora-antes)/1000);antes=agora;
 if(fase.value==='ciclo'){if(cenas[0].g.time>1003.1)criar();for(const {g}of cenas)g.tick(dt);}
 ctx.fillStyle='#18363a';ctx.fillRect(0,0,1280,900);ctx.strokeStyle='#304d52';
 for(let x=0;x<1280;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,900);ctx.stroke();}for(let y=0;y<900;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}
 cenas.forEach(({g,p,d},i)=>{
  const snap=g.snapshot(p.id),player=apresentarGenkiJogador(snap.players[0],snap.genkiCharges,g.time),x=160+(i%4)*320,y=330+Math.floor(i/4)*430;
  ctx.fillStyle='#ffe3a2';ctx.font='18px system-ui';ctx.textAlign='center';ctx.fillText(d.label,x,y-300);
  ctx.save();ctx.beginPath();ctx.rect((i%4)*320,Math.floor(i/4)*430+45,320,420);ctx.clip();ctx.translate(x-p.x,y-p.y);
  let pos={x:p.x,y:p.y};const montado=desenharNimbus(ctx,player,pos,g.time,{flutuar:false});if(montado)pos=montado.personagem;
  if(segura.checked){ctx.strokeStyle='#65dfab';ctx.strokeRect(p.x-60,p.y-35,120,65);}
  drawGoku(ctx,player,pos,g.time);
  for(const carga of snap.genkiCharges)desenharGenki(ctx,'carga',carga,g.time,{...pos,alturaCanalizacao:POSE_GENKI.alturaCanalizacao});
  for(const voo of snap.projectiles)if(voo.kind==='genki')desenharGenki(ctx,'voo',voo,g.time);
  for(const explosao of snap.genkiExplosions)desenharGenki(ctx,'explosao',explosao,g.time);
  ctx.restore();
 });
 document.getElementById('estado').textContent=segura.checked?'Genki cancelada · pose encerrada':'Folha 6 · corpo na mesma escala';requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
