import {art,loaded} from '../../assets.mjs';
import {drawSheet,SHEET_VIEWS} from '../../atlas.mjs';
import {spriteFacing,walkStep,strikeColumn} from '../../../render/mapa/camera.mjs';
import {FOLHAS_VEGETA_BASE,FOLHAS_VEGETA_SSJ1,VEGETA_SSJ2,FOLHAS_VEGETA_MAJIN,FOLHAS_VEGETA_SSJ4} from './vegeta-folhas.mjs';
import {KAME} from '../../../shared/tecnicas/kamehameha.mjs';
const cache=new Map();
function clean(image){if(!image||!image.complete||!image.naturalWidth)return null;if(cache.has(image))return cache.get(image);const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(g>145&&g>r*1.22&&g>b*1.15||r>180&&b>180&&g<130)d[i+3]=0;}x.putImageData(p,0,0);cache.set(image,c);return c;}
function draw(ctx,[sheet,key],pos,height,facing,column){const image=clean(art[key]);if(!image)return false;const view=SHEET_VIEWS[spriteFacing(facing)],[sx,sy,sw,sh,ax,ay]=sheet.frames[view.row][column];const scale=height/sheet.referenceHeight;ctx.save();ctx.translate(Math.round(pos.x),Math.round(pos.y));if(view.flip)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.drawImage(image,sx,sy,sw,sh,-ax*scale,(sy-ay)*scale+6,sw*scale,sh*scale);ctx.restore();return true;}
export function drawVegeta(ctx,player,pos,time,strikeProgress=null){
  if(player.dead)return false;
  const ssj=player.forma==='ssj'||player.transformed;
  const folhas=player.forma==='ssj4'?FOLHAS_VEGETA_SSJ4:player.forma==='majin'?FOLHAS_VEGETA_MAJIN:player.forma==='ssj2'?VEGETA_SSJ2:ssj?FOLHAS_VEGETA_SSJ1:FOLHAS_VEGETA_BASE;
  const moving=player.moving;
  let coluna=moving?Math.floor(walkStep(pos.travelled||time*96,96)/4)%4:0;
  let acao=moving?'andar':'parado';
  if(strikeProgress!==null)acao='soco',coluna=strikeColumn(strikeProgress);
  if(player.rajadaStarted&&time-player.rajadaStarted<.36)acao='rajada',coluna=strikeColumn(Math.max(0,time-player.rajadaStarted)/.36);
  if(player.galickPhase==='charge'){
    const progresso=Math.max(0,Math.min(1,(time-(player.charge.until-KAME.carga))/KAME.carga));
    acao='galick';coluna=progresso<.35?1:2;
  }else if(player.galickPhase==='beam'){
    acao='galick';coluna=3;
  }
  if(player.finalFlash)acao='finalFlash',coluna=Math.min(3,Math.floor((time-player.finalFlash.started)*8));
  if(player.bigBang)acao='bigBang',coluna=Math.min(3,Math.floor((time-player.bigBang.started)*8));
  if(acao==='parado')coluna=Math.floor(time*5)%4;
  return draw(ctx,folhas[acao]||folhas.parado,pos,70,player.facing,coluna);
}
