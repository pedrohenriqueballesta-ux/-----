import { carregarNimbus, desenharNimbus } from '../vfx/nimbus.mjs';
import { drawGoku } from '../../art/personagens/goku/goku.mjs';
import { ASSENTOS_MONTARIAS } from '../../shared/sistemas/montarias.mjs';
import { FOLHAS_GOKU_NATALINO } from '../../art/personagens/goku/goku-natalino.mjs';
import { SHEET_VIEWS } from '../../art/sheet-views.mjs';
import { spriteFacing } from '../mapa/camera.mjs';
const $=id=>document.getElementById(id), canvas=$('preview'), ctx=canvas.getContext('2d');
const dirs={s:{x:0,y:1},se:{x:1,y:1},e:{x:1,y:0},ne:{x:1,y:-1},n:{x:0,y:-1},nw:{x:-1,y:-1},w:{x:-1,y:0},sw:{x:-1,y:1}};
// Coordenadas anatômicas experimentais medidas na folha 07_MONTADO (pixels do frame).
// Mantidas separadas por direção para não impor uma âncora geométrica única.
const QUADRIL={s:[122,198],se:[122,204],e:[122,201],ne:[122,204],n:[122,198],nw:[122,204],w:[122,201],sw:[122,204]};
const AJUSTE={s:{x:0,y:-5,escala:.84},se:{x:0,y:-5,escala:.86},e:{x:2,y:-10,escala:.84},ne:{x:0,y:-5,escala:.86},n:{x:0,y:-2,escala:.84},nw:{x:0,y:-5,escala:.86},w:{x:-2,y:-10,escala:.84},sw:{x:0,y:-5,escala:.86}};
let pronto=false; await carregarNimbus().then(()=>pronto=true).catch(e=>$('dados').textContent=e.message);
function render(){
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#557b45';ctx.fillRect(0,0,canvas.width,canvas.height);
 const d=$('direcao').value, facing=dirs[d], pos={x:500,y:380}, p={dead:false,moving:false,facing,forma:'natalino',skin:'natalino',montaria:'rena_natalina',renaCamadas:$('modo').value==='camadas'};
 const zoom=Math.max(.5,Math.min(2.5,Number($('zoom').value)||1)); ctx.save();ctx.translate(pos.x,pos.y);ctx.scale(zoom,zoom);ctx.translate(-pos.x,-pos.y);
 let g=null; if(pronto&&$('montaria').checked)g=desenharNimbus(ctx,{...p,renaCamada:$('modo').value==='camadas'?'back':undefined},pos,0,{flutuar:false});
 const rendererAnchor=g?.personagem||pos, scale=Math.max(.5,Math.min(1.5,Number($('escala').value)||1)), ox=Number($('ox').value)||0, oy=Number($('oy').value)||0;
 // Coordenadas locais medidas nas células reais (não o limite inferior): o
 // centro da sela fica no dorso vermelho; o quadril fica no apoio da folha 07.
 const renaRow={s:0,se:1,e:2,ne:3,n:4,nw:3,w:2,sw:1}[d], renaSh=[307,307,308,307,307][renaRow], renaSela={s:[128,190],se:[128,184],e:[128,184],ne:[128,184],n:[128,190],nw:[128,184],w:[128,184],sw:[128,184]}[d];
 const renaTop=pos.y-renaSh*.25+10, sela={x:pos.x+(renaSela[0]-128)*.25,y:renaTop+renaSela[1]*.25};
 const view=SHEET_VIEWS[spriteFacing(facing)], sheet=FOLHAS_GOKU_NATALINO.montado[0], frame=sheet.frames[view.row][0], ajuste=AJUSTE[d], gokuHipLocal={x:QUADRIL[d][0],y:QUADRIL[d][1]}, gokuScale=scale*ajuste.escala*70/sheet.referenceHeight;
 const hipDeltaY=6+(gokuHipLocal.y-frame[3])*gokuScale, hipDeltaX=(gokuHipLocal.x-frame[4])*gokuScale;
 const composed={x:sela.x-hipDeltaX+ox+ajuste.x,y:sela.y-hipDeltaY+oy+ajuste.y}, quadril={x:composed.x+hipDeltaX,y:composed.y+hipDeltaY};
 if($('personagem').checked){ctx.save();ctx.translate(composed.x,composed.y);drawGoku(ctx,p,{x:0,y:0,travelled:0},0);ctx.restore();}
 if($('modo').value==='camadas'&&$('montaria').checked)desenharNimbus(ctx,{...p,renaCamada:'front'},pos,0,{flutuar:false});
 if($('mundo').checked||$('sela').checked||$('ref').checked||$('composicao').checked||$('quadril').checked){ctx.save();ctx.lineWidth=2;const mark=(point,color)=>{ctx.strokeStyle=color;ctx.beginPath();ctx.arc(point.x,point.y,4,0,Math.PI*2);ctx.stroke();};if($('mundo').checked)mark(pos,'#52ff62');if($('sela').checked)mark(sela,'#28ff69');if($('ref').checked)mark(rendererAnchor,'#ffe331');if($('composicao').checked)mark(composed,'#ff8d2b');if($('quadril').checked)mark(quadril,'#ff5b31');ctx.restore();}
 ctx.restore();
 const assento=ASSENTOS_MONTARIAS.rena_natalina[d]; $('dados').textContent=JSON.stringify({direcao:d,folha:'/assets/goku/natalino/07_MONTADO.png',estado:'montado',frame:{row:view.row,column:0,width:frame[2],height:frame[3]},renderer:{renaScale:.25,gokuHeight:70,gokuScale,zoom},calibracao:{offset:ajuste,provisoria:true},pontos:{mundo:pos,sela,referenciaRenderer:rendererAnchor,composicao:composed,quadril,quadrilLocal:gokuHipLocal},assentoAtual:assento,camadas:$('modo').value==='camadas'?['mount_back','rider (07_MONTADO.png)','mount_front']:['rena completa','Goku montado'],camadasReaisDisponiveis:true,limitacao:'As camadas fornecidas correspondem apenas ao estado parado; andando e invocação permanecem na folha original.'},null,2);
 requestAnimationFrame(render);
}
$('reset').onclick=()=>{$('escala').value=1;$('ox').value=0;$('oy').value=0}; requestAnimationFrame(render);
