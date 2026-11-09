import {art} from '../art/assets.mjs';
import {drawGoku} from '../art/goku.mjs';
import {FOLHAS_GOKU_BASE} from '../art/goku-base.mjs';
import {FOLHAS_GOKU_KAIOKEN} from '../art/goku-kaioken.mjs';
import {DIRECTIONS} from './camera.mjs';
const $=id=>document.getElementById(id),ctx=$('previa').getContext('2d');
await Promise.all([...Object.values(FOLHAS_GOKU_BASE),...Object.values(FOLHAS_GOKU_KAIOKEN)].map(([,chave])=>art[chave].decode()));
$('estado').textContent='Seis folhas Kaioken e seis folhas base carregadas';
let rodando=true,tempo=0,anterior=performance.now();
$('pausar').onclick=()=>{rodando=!rodando;$('pausar').textContent=rodando?'Pausar':'Reproduzir';};
function desenhar(pos,facing,andando=false) {
  const fase=rodando?tempo%1:Number($('fase').value),agora=100+fase,acao=$('acao').value;
  const p={forma:$('forma').value,transformed:$('forma').value==='ssj',facing,moving:andando||acao==='andar'};
  let soco=null;
  if(acao==='soco')soco=fase;
  if(acao==='rajada')p.rajadaStarted=agora-fase*.36;
  if(acao==='kamehameha') {
    if(fase<.5)p.charge={until:agora+.65-fase*1.3};else p.kameStarted=agora-(fase-.5)*1.5;
  }
  if(acao==='genki') {
    if(fase<.6)p.genkiCarga={started:agora-fase*3.2,until:agora+1.92-fase*3.2};else p.genkiLancado=agora-(fase-.6)*.875;
  }
  ctx.strokeStyle='#ffd477';ctx.beginPath();ctx.moveTo(pos.x-8,pos.y+6);ctx.lineTo(pos.x+8,pos.y+6);ctx.moveTo(pos.x,pos.y);ctx.lineTo(pos.x,pos.y+12);ctx.stroke();
  drawGoku(ctx,p,{...pos,travelled:(rodando?tempo:fase)*96},agora,soco);
}
function quadro(agora) {
  if(rodando)tempo+=Math.min(.05,(agora-anterior)/1000);anterior=agora;
  ctx.fillStyle='#18363a';ctx.fillRect(0,0,1280,720);ctx.strokeStyle='#345054';
  for(let x=0;x<1280;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke();}
  for(let y=0;y<720;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}
  ctx.fillStyle='#f1d99b';ctx.font='17px system-ui';ctx.textAlign='center';
  DIRECTIONS.forEach((d,i)=>{const x=100+(i%4)*190,y=230+Math.floor(i/4)*270;ctx.fillText(d.label,x,y-115);desenhar({x,y},d);});
  ctx.fillText('Caminhada em círculo',1020,80);
  const angulo=tempo*.55,raio=140,pos={x:1020+Math.cos(angulo)*raio,y:390+Math.sin(angulo)*raio};
  ctx.strokeStyle='#8cbaa1';ctx.beginPath();ctx.arc(1020,390,raio,0,Math.PI*2);ctx.stroke();
  desenhar(pos,{x:-Math.sin(angulo),y:Math.cos(angulo)},true);requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
