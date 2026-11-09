import {art} from '../art/assets.mjs';
import {drawGoku} from '../art/goku.mjs';
import {FOLHAS_GOKU_BASE} from '../art/goku-base.mjs';
import {DIRECTIONS} from './camera.mjs';
const tela=document.getElementById('previa'),ctx=tela.getContext('2d'),acao=document.getElementById('acao');
let rodando=true,tempo=0,anterior=performance.now();
document.getElementById('pausar').onclick=e=>{rodando=!rodando;e.target.textContent=rodando?'Pausar':'Reproduzir';};
await Promise.all(Object.values(FOLHAS_GOKU_BASE).map(([,chave])=>art[chave].decode()));
document.getElementById('estado').textContent='Seis folhas carregadas';
function desenhar(pos,facing,t,andando=false){
 const ciclo=t%1,personagem={facing,moving:andando||acao.value==='andar',transformed:false};
 let soco=null;
 if(acao.value==='soco')soco=ciclo;
 if(acao.value==='rajada')personagem.rajadaStarted=t-ciclo*.36;
 if(acao.value==='kamehameha'){
  if(ciclo<.5)personagem.charge={until:t+.65-ciclo*1.3};
  else personagem.kameStarted=t-(ciclo-.5)*1.5;
 }
 ctx.strokeStyle='#ffd477';ctx.beginPath();ctx.moveTo(pos.x-6,pos.y+6);ctx.lineTo(pos.x+6,pos.y+6);ctx.moveTo(pos.x,pos.y);ctx.lineTo(pos.x,pos.y+12);ctx.stroke();
 drawGoku(ctx,personagem,{...pos,travelled:t*70},t,soco);
}
function quadro(agora){
 if(rodando)tempo+=Math.min(.05,(agora-anterior)/1000);anterior=agora;
 ctx.fillStyle='#18363a';ctx.fillRect(0,0,1280,720);ctx.strokeStyle='#345054';
 for(let x=0;x<1280;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke();}
 for(let y=0;y<720;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}
 ctx.fillStyle='#f1d99b';ctx.font='17px system-ui';ctx.textAlign='center';
 DIRECTIONS.forEach((d,i)=>{const x=100+(i%4)*190,y=230+Math.floor(i/4)*270;ctx.fillText(d.label,x,y-115);desenhar({x,y},d,tempo);});
 ctx.fillText('Caminhada em círculo',1020,80);
 const angulo=tempo*.55,raio=140,x=1020+Math.cos(angulo)*raio,y=390+Math.sin(angulo)*raio;
 ctx.strokeStyle='#8cbaa1';ctx.beginPath();ctx.arc(1020,390,raio,0,Math.PI*2);ctx.stroke();
 const d={x:-Math.sin(angulo),y:Math.cos(angulo)};desenhar({x,y},d,tempo,true);
 requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
