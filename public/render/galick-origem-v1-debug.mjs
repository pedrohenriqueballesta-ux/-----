import { drawVegeta } from '../art/personagens/vegeta/vegeta.mjs';
import { origemVisualGalick } from './vfx/galick-gun.mjs';
import { ORIGEM_V1, desenharOrigemGalickV1 } from './vfx/galick-origem-v1.mjs';

const $ = id => document.getElementById(id);
const canvas = $('previa'), ctx = canvas.getContext('2d');
const imagem = new Image(); imagem.src = ORIGEM_V1.url;
const direcoes = { S:[0,1], SE:[1,1], E:[1,0], NE:[1,-1], N:[0,-1], NW:[-1,-1], W:[-1,0], SW:[-1,1] };
let inicio = performance.now();
$('animar').addEventListener('change', () => { inicio = performance.now(); });

function cruz(p, cor) {
  ctx.strokeStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath();ctx.moveTo(p.x-7,p.y);ctx.lineTo(p.x+7,p.y);
  ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x,p.y+7);ctx.stroke();
}
function desenhar(agora) {
  const [dx,dy] = direcoes[$('direcao').value], norma = Math.hypot(dx,dy);
  const direcao = {x:dx/norma,y:dy/norma};
  const frame = $('animar').checked ? Math.floor((agora-inicio)/105)%16 : Number($('frame').value);
  const fase = frame < 4 ? 'charge' : frame < 12 ? 'beam' : 'beam';
  const pos = {x:500+($('mover').checked?Math.sin(agora/520)*35:0),y:340};
  // A origem é sempre a palma do Vegeta. A fase altera somente o quadro do
  // efeito, nunca o ponto inicial do disparo.
  const base = origemVisualGalick(pos,direcao);
  const mao = {x:base.x+Number($('ajusteX').value),y:base.y+Number($('ajusteY').value)};
  const distancia = Number($('distancia').value);
  const alvo = {x:pos.x+direcao.x*distancia,y:pos.y+direcao.y*distancia};
  ctx.fillStyle = $('claro').checked?'#6fa54a':'#19243a';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#b94d65';ctx.beginPath();ctx.arc(alvo.x,alvo.y,14,0,Math.PI*2);ctx.fill();
  const personagem={dead:false,forma:null,moving:false,facing:direcao,galickPhase:fase,
    charge:{galick:true,until:agora/1000+.18}};
  drawVegeta(ctx,personagem,pos,agora/1000);
  const pronto=desenharOrigemGalickV1(ctx,imagem,mao,direcao,frame);
  // Como no jogo, norte e laterais recompõem o personagem sobre o efeito.
  if(pronto && direcao.y<=0)drawVegeta(ctx,personagem,pos,agora/1000);
  if($('marcadores').checked){cruz(mao,'#37ec93');cruz(alvo,'#ff8666');}
  $('numero').value=String(frame);$('valorX').value=$('ajusteX').value;$('valorY').value=$('ajusteY').value;
  $('dados').textContent=pronto
    ? `Origem V1 · frame ${frame} · ${$('direcao').value} · mão candidata (${mao.x.toFixed(1)}, ${mao.y.toFixed(1)}) · alvo (${alvo.x.toFixed(1)}, ${alvo.y.toFixed(1)}) · célula 768×256 · âncora local (170,128) · escala ${ORIGEM_V1.escala} · distância ${distancia}. Os ajustes X/Y são apenas desta prévia.`
    : 'Aguardando a folha V1 ou imagem indisponível.';
  requestAnimationFrame(desenhar);
}
requestAnimationFrame(desenhar);
