import { colunaPoseGalick } from '../../../shared/tecnicas/galick-gun.mjs';
import {art,loaded} from '../../assets.mjs';
import {drawSheet,SHEET_VIEWS} from '../../atlas.mjs';
import {spriteFacing,walkStep,strikeColumn} from '../../../render/mapa/camera.mjs';
import {FOLHAS_VEGETA_BASE,FOLHAS_VEGETA_SSJ1,VEGETA_SSJ2,FOLHAS_VEGETA_MAJIN,FOLHAS_VEGETA_SSJ4,FOLHAS_VEGETA_GOD,FOLHAS_VEGETA_BLUE,FOLHAS_VEGETA_ULTRA_EGO} from './vegeta-folhas.mjs';
const cache=new Map();
function clean(image){if(!image||!image.complete||!image.naturalWidth)return null;if(cache.has(image))return cache.get(image);const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(g>145&&g>r*1.22&&g>b*1.15||r>180&&b>180&&g<130)d[i+3]=0;}x.putImageData(p,0,0);cache.set(image,c);return c;}
function draw(ctx,[sheet,key],pos,height,facing,column){const image=clean(art[key]);if(!image)return false;const view=SHEET_VIEWS[spriteFacing(facing)],[sx,sy,sw,sh,ax,ay]=sheet.frames[view.row][column];const scale=height/sheet.referenceHeight;ctx.save();ctx.translate(Math.round(pos.x),Math.round(pos.y));if(view.flip)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.drawImage(image,sx,sy,sw,sh,-ax*scale,(sy-ay)*scale+6,sw*scale,sh*scale);ctx.restore();return true;}
export function drawVegeta(ctx,player,pos,time,strikeProgress=null){
  if(player.dead)return false;
  const ssj=player.forma==='ssj'||player.transformed;
  const folhas=player.forma==='ultraEgo'?FOLHAS_VEGETA_ULTRA_EGO
    :player.forma==='ssjBlue'?FOLHAS_VEGETA_BLUE
    :player.forma==='ssjGod'?FOLHAS_VEGETA_GOD:player.forma==='ssj4'?FOLHAS_VEGETA_SSJ4:player.forma==='majin'?FOLHAS_VEGETA_MAJIN:player.forma==='ssj2'?VEGETA_SSJ2:ssj?FOLHAS_VEGETA_SSJ1:FOLHAS_VEGETA_BASE;
  const moving=player.moving;
  let coluna=moving?Math.floor(walkStep(pos.travelled||time*96,96)/4)%4:0;
  let acao=moving?'andar':'parado';
  if(strikeProgress!==null)acao='soco',coluna=strikeColumn(strikeProgress);
  if(player.rajadaStarted&&time-player.rajadaStarted<.36)acao='rajada',coluna=strikeColumn(Math.max(0,time-player.rajadaStarted)/.36);
  const poseGalick = colunaPoseGalick(player.galick, time);
  if (poseGalick !== null) {
    acao = 'galick';
    coluna = poseGalick;
  }
  if(player.finalFlash)acao='finalFlash',coluna=Math.min(3,Math.floor((time-player.finalFlash.started)*8));
  if(player.bigBang)acao='bigBang',coluna=Math.min(3,Math.floor((time-player.bigBang.started)*8));
  if(acao==='parado')coluna=Math.floor(time*5)%4;
  // Uma folha de ataque pode ainda não existir em alguma forma; nunca deixe o personagem invisível.
  const folhaAcao = folhas[acao] || folhas.parado;
  if (folhas === FOLHAS_VEGETA_MAJIN || folhas === FOLHAS_VEGETA_GOD || folhas === FOLHAS_VEGETA_BLUE || folhas === FOLHAS_VEGETA_ULTRA_EGO) {
    const [dados, chave] = folhaAcao;
    // Estas folhas já têm alfa. Pular o chroma em tempo real preserva os contornos coloridos.
    return drawSheet(ctx, dados, art[chave], pos, 70, player.facing, coluna)
      || draw(ctx, FOLHAS_VEGETA_BASE[acao] || FOLHAS_VEGETA_BASE.parado, pos, 70, player.facing, coluna);
  }
  return draw(ctx,folhaAcao,pos,70,player.facing,coluna);
}
