import { drawVegeta } from '../art/personagens/vegeta/vegeta.mjs';
import { KAME, estagioKame } from '../shared/tecnicas/kamehameha.mjs';
import { desenharGalickComProfundidade, estagioVisualGalick, origemVisualGalick } from './vfx/galick-gun.mjs';

const $ = id => document.getElementById(id);
const canvas = $('previa'), ctx = canvas.getContext('2d');
const direcoes = { S:[0,1], SE:[1,1], E:[1,0], NE:[1,-1], N:[0,-1], NW:[-1,-1], W:[-1,0], SW:[-1,1] };
function marcador(p, cor) {
  ctx.fillStyle=cor;ctx.beginPath();ctx.arc(p.x,p.y,4,0,2*Math.PI);ctx.fill();
}
function desenhar() {
  const nivel=Number($('nivel').value), estagio=estagioVisualGalick(nivel);
  const [dx,dy]=direcoes[$('direcao').value], norma=Math.hypot(dx,dy), direcao={x:dx/norma,y:dy/norma};
  const fase=$('fase').value, distancia=Number($('distancia').value);
  const jogador={x:500,y:500}, alvo={x:jogador.x+direcao.x*distancia,y:jogador.y+direcao.y*distancia};
  const origem=origemVisualGalick(jogador,direcao,fase==='charge');
  const delta={x:alvo.x-origem.x,y:alvo.y-origem.y}, comprimento=Math.hypot(delta.x,delta.y);
  const visualDirection={x:delta.x/comprimento,y:delta.y/comprimento};
  const agora=performance.now()/1000;
  ctx.fillStyle=$('claro').checked?'#6fa54a':'#19243a';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#bd5268';ctx.beginPath();ctx.arc(alvo.x,alvo.y,16,0,2*Math.PI);ctx.fill();
  const player={dead:false,forma:null,moving:false,facing:direcao,
    galickPhase:fase==='charge'?'charge':'beam',charge:{until:agora+.18,galick:true}};
  drawVegeta(ctx,player,jogador,agora);
  const efeito={...origem,direction:direcao,visualDirection,nivel,
    alvoDistancia:comprimento,alcanceVisualExtra:Math.max(0,KAME.mao-(origem.x-jogador.x)*direcao.x-(origem.y-jogador.y)*direcao.y),
    started:agora-KAME.quadro*8};
  if(fase==='charge'){efeito.started=agora-.14;efeito.until=agora+.18;}
  if(fase==='impact')efeito.impacto={started:agora-.24,contatoX:alvo.x,contatoY:alvo.y,distancia:comprimento};
  desenharGalickComProfundidade(ctx,efeito,agora,()=>drawVegeta(ctx,player,jogador,agora));
  if($('marcadores').checked){marcador(jogador,'#fff');marcador(origem,'#4cf1a1');marcador(alvo,'#ff745c');}
  $('valor').textContent=String(distancia);
  $('dados').textContent=`V${estagio.numero} · origem das mãos (${origem.x.toFixed(1)}, ${origem.y.toFixed(1)}) · alvo/contato (${alvo.x.toFixed(1)}, ${alvo.y.toFixed(1)}) · direção (${visualDirection.x.toFixed(3)}, ${visualDirection.y.toFixed(3)}) · comprimento ${comprimento.toFixed(1)} · alcance ${estagioKame(nivel).alcance} · escala ${estagio.escala.toFixed(3)}`;
  requestAnimationFrame(desenhar);
}
requestAnimationFrame(desenhar);
