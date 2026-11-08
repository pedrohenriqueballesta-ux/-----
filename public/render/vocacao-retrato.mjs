import {vocacaoDoPersonagem} from '../shared/vocacoes.mjs';
import {el} from './hud-elementos.mjs';
const desenhistas={goku:()=>import('../art/goku.mjs').then(m=>m.drawGoku)};
export function retratoVocacao(valor){
 const v=vocacaoDoPersonagem(valor?.id||valor),canvas=el('canvas',null,'ranking-vocacao-sprite');canvas.width=96;canvas.height=128;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Sprite da vocação '+v.nome);
 desenhistas[v.sprite]().then(desenhar=>{const c=canvas.getContext('2d');let tentativas=0;const quadro=()=>{if(!canvas.isConnected)return;c.clearRect(0,0,96,128);c.imageSmoothingEnabled=false;c.save();c.translate(48,118);c.scale(1.5,1.5);const pronto=desenhar(c,{facing:{x:0,y:1},moving:false,transformed:false},{x:0,y:0},0);c.restore();if(!pronto&&tentativas++<90)requestAnimationFrame(quadro);};quadro();}).catch(()=>{canvas.setAttribute('aria-label','Vocação '+v.nome+' (sprite indisponível)');});
 return canvas;
}