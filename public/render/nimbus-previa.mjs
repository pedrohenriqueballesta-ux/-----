import {carregarNimbus,desenharNimbus} from './nimbus.mjs';
import {drawGoku} from '../art/goku.mjs';
import {NIMBUS,DIRECOES_NIMBUS,APOIOS_NIMBUS,quadroNimbus} from '../shared/montarias.mjs';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);let tocar=true,t=0,anterior=performance.now();
$('pausar').onclick=()=>{tocar=!tocar;$('pausar').textContent=tocar?'Pausar':'Reproduzir';};
$('frame').oninput=()=>{tocar=false;t=Number($('frame').value)*NIMBUS.frameMs/1000+.001;$('pausar').textContent='Reproduzir';};
$('restaurar').onclick=()=>{$('escala').value=NIMBUS.escala;$('offsetX').value=0;$('offsetY').value=-6;$('flutuar').checked=true;};
try{await carregarNimbus();$('status').textContent='40 PNGs carregados · cinco frames por direção · 130 ms/frame';}catch(e){$('status').textContent=e.message;}
function render(agora){
 t+=tocar?Math.min(.05,(agora-anterior)/1000):0;anterior=agora;if(tocar)$('frame').value=quadroNimbus(t);
 ctx.clearRect(0,0,canvas.width,canvas.height);for(let y=0;y<canvas.height;y+=20)for(let x=0;x<canvas.width;x+=20){ctx.fillStyle=(x/20+y/20)%2?'#355334':'#3d5c3b';ctx.fillRect(x,y,20,20);}
 const opcoes={escala:Math.max(.2,Math.min(1.2,Number($('escala').value)||.65)),x:Math.max(-50,Math.min(50,Number($('offsetX').value)||0)),y:Math.max(-50,Math.min(50,Number($('offsetY').value)||0)),flutuar:$('flutuar').checked};
 DIRECOES_NIMBUS.forEach((d,i)=>{
  const a=(i-2)*Math.PI/4,pos={x:130+(i%4)*260+($('mover').checked?Math.sin(t*1.4)*22:0),y:156+Math.floor(i/4)*220},p={montaria:'nimbus',vocacao:'goku',facing:{x:Math.cos(a),y:Math.sin(a)},transformed:$('ssj').checked,dead:false,moving:false};
  ctx.fillStyle='#07151b66';ctx.beginPath();ctx.ellipse(pos.x,pos.y+10,27,9,0,0,Math.PI*2);ctx.fill();const g=desenharNimbus(ctx,p,pos,t,opcoes);drawGoku(ctx,p,g?.personagem||pos,t,$('ataque').checked?(t%.36)/.36:null);
  ctx.fillStyle='#ffedb5';ctx.textAlign='center';ctx.font='bold 14px system-ui';ctx.fillText(d.toUpperCase()+' · frame '+(quadroNimbus(t)+1),130+(i%4)*260,212+Math.floor(i/4)*220);
 });
 $('config').textContent=JSON.stringify({escala:opcoes.escala,offsets:{x:opcoes.x,y:opcoes.y},apoiosPorDirecao:Object.fromEntries(DIRECOES_NIMBUS.map(d=>[d,APOIOS_NIMBUS[d][quadroNimbus(t)]])),frameMs:130,flutuar:opcoes.flutuar},null,2);requestAnimationFrame(render);
}
requestAnimationFrame(render);
