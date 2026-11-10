import {art} from '../art/assets.mjs';
import {drawLutador,LUTADORES} from '../art/lutadores.mjs';
import {drawGoku} from '../art/goku.mjs';
import {FOLHAS_GOKU_BASE} from '../art/goku-base.mjs';
import {FOLHAS_NAMEK_NORTE} from '../art/namek-norte.mjs';
import {DIRECTIONS} from './camera.mjs';
const $=id=>document.getElementById(id),ctx=$('previa').getContext('2d');
await Promise.all([...Object.values(FOLHAS_NAMEK_NORTE).flatMap(Object.values),...Object.values(FOLHAS_GOKU_BASE)].map(([,chave])=>art[chave].decode()));
$('estado').textContent='Doze folhas carregadas';
let rodando=true,tempo=0,anterior=performance.now();
$('pausar').onclick=()=>{rodando=!rodando;$('pausar').textContent=rodando?'Pausar':'Reproduzir';};
function quadro(agora) {
  if(rodando)tempo+=Math.max(0,Math.min(.05,(agora-anterior)/1000));anterior=agora;
  ctx.fillStyle='#18363a';ctx.fillRect(0,0,1280,740);ctx.strokeStyle='#345054';
  for(let x=0;x<1280;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,740);ctx.stroke();}
  for(let y=0;y<740;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}
  const fase=rodando?tempo%1:Number($('fase').value),tipo=$('tipo').value,acao=$('acao').value;
  ctx.fillStyle='#f1d99b';ctx.font='17px system-ui';ctx.textAlign='center';
  DIRECTIONS.forEach((d,i)=>{
    const x=105+(i%4)*320,y=335+Math.floor(i/4)*350;
    ctx.fillText(d.label,x+45,y-245);
    ctx.strokeStyle='#ffd477';ctx.beginPath();ctx.moveTo(x-10,y+6);ctx.lineTo(x+10,y+6);ctx.moveTo(x,y);ctx.lineTo(x,y+12);ctx.stroke();
    // Parado: respiração pelo tempo (pausado, a barra de fase escolhe o quadro). Andar usa o passo próprio do mob.
    const pose=['andar','parado'].includes(acao)?null:fase,passo=LUTADORES[tipo].passo??96*LUTADORES[tipo].altura/70;
    drawLutador(ctx,tipo,x,y,acao==='andar',d,0,pose,(rodando?tempo:fase)*passo,acao==='rajada',rodando?tempo:fase);
    drawGoku(ctx,{facing:d,moving:false,transformed:false},{x:x+135,y},tempo);
  });requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
