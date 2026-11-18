// Desenho do Goku (base, Kaioken e Super Saiyajin): caminhada e soco desenhados
// quadro a quadro (folhas passo/golpe), com recortes de 16 quadros como reserva.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack, drawSheet, GOLPE, SHEET_VIEWS } from './atlas.mjs';
import { spriteFacing, walkStep } from '../render/camera.mjs';
import { FOLHAS_GOKU_KAIOKEN } from './goku-kaioken.mjs';
import { FOLHAS_GOKU_SSJ } from './goku-ssj.mjs';
import { FOLHAS_GOKU_SSJ2 } from './goku-ssj2.mjs';
import { FOLHAS_GOKU_SSJ3 } from './goku-ssj3.mjs';
import { GOKU_SSJ3_RYUKEN } from './goku-ssj3-ryuken.mjs';
import { RYUKEN } from '../shared/ryuken.mjs';
import { FOLHAS_GOKU_SSJ4 } from './goku-ssj4.mjs';
import { FOLHAS_GOKU_BASE } from './goku-base.mjs';
import { FOLHAS_GOKU_NATALINO } from './goku-natalino.mjs';
import { colunaGenki } from '../render/genki-personagem.mjs';
import { KAME } from '../shared/kamehameha.mjs';
import { strikeColumn } from '../render/camera.mjs';

const natalinoCache = new Map();
function imagemNatalina(image) {
  if (!image || !image.complete || !image.naturalWidth) return null;
  if (natalinoCache.has(image)) return natalinoCache.get(image);
  const c=document.createElement('canvas'); c.width=image.naturalWidth; c.height=image.naturalHeight;
  const x=c.getContext('2d'); x.drawImage(image,0,0); const p=x.getImageData(0,0,c.width,c.height),d=p.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(g>145&&g>r*1.22&&g>b*1.15)d[i+3]=0;} x.putImageData(p,0,0); natalinoCache.set(image,c); return c;
}
function drawNatalino(ctx,sheet,image,pos,height,facing,column){const clean=imagemNatalina(image);if(!clean)return false;const view=SHEET_VIEWS[spriteFacing(facing)],[sx,sy,sw,sh,ax,ay]=sheet.frames[view.row][column],scale=height/sheet.referenceHeight;ctx.save();ctx.translate(Math.round(pos.x),Math.round(pos.y));if(view.flip)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(clean,sx,sy,sw,sh,(sx-ax)*scale,(sy-ay)*scale+6,sw*scale,sh*scale);ctx.restore();return true;}

export function drawGoku(ctx, player, pos, time, strikeProgress = null) {
  // `skin` é apenas visual; a forma real continua controlando regras, custos e atributos no servidor.
  const skinVisual = player.forma && player.forma !== 'base' ? player.forma : (player.skin || 'base');
  if (skinVisual) player = { ...player, forma: skinVisual, transformed: !['base', 'kaioken'].includes(skinVisual) };
  // Base, Kaioken e Super Saiyajin usam as mesmas poses (folhas da base como molde), na escala da base.
  if (!player.dead) {
    const ssj4 = player.forma === 'ssj4', ssj3 = player.forma === 'ssj3', ssj2 = player.forma === 'ssj2',
      ssj = !ssj2 && !ssj3 && !ssj4 && (player.transformed || ['ssj', 'gogeta', 'vegito'].includes(player.forma));
    const natalino = player.forma === 'natalino';
    const folhas = natalino ? FOLHAS_GOKU_NATALINO : ssj4 ? FOLHAS_GOKU_SSJ4 : ssj3 ? FOLHAS_GOKU_SSJ3 : ssj2 ? FOLHAS_GOKU_SSJ2 : ssj ? FOLHAS_GOKU_SSJ : player.forma === 'kaioken' ? FOLHAS_GOKU_KAIOKEN : FOLHAS_GOKU_BASE;
    const desenhar = (folha,chave,coluna,altura=70) => natalino ? drawNatalino(ctx,folha,art[chave],pos,altura,player.facing,coluna) : drawSheet(ctx,folha,art[chave],pos,altura,player.facing,coluna);
    // O deslocamento acumulado pertence à pose renderizada (`pos`), não ao
    // snapshot autoritativo do jogador. Usá-lo mantém a cadência da caminhada
    // sincronizada com o movimento real, inclusive para skins alternativas.
    const distanciaPercorrida = Number.isFinite(pos.travelled) ? pos.travelled : (player.travelled || 0);
    // Durante o primeiro frame de uma transição, a pose interpolada ainda pode
    // estar com distância zero. O relógio mantém a caminhada viva nesse curto
    // intervalo; depois a distância real volta a conduzir o passo.
    const passo = player.moving && natalino ? (time * 96) : distanciaPercorrida;
    let estado = player.moving ? 'andar' : 'parado', coluna = player.moving ? Math.floor(walkStep(passo, 96) * 4) % 4 : 0;
    const genki = colunaGenki(player,time);
    // Ryuken (SSJ3 e SSJ4): postura e carga durante o lançamento; soco e sustentação enquanto o dragão sai.
    const lancado = Number.isFinite(player.ryukenLancado) ? time - player.ryukenLancado : Infinity;
    if ((ssj3 || ssj4) && (player.ryuken || player.ryukenVoando || lancado < RYUKEN.sustentacao)) {
      const coluna = player.ryuken ? (time - player.ryuken.started < RYUKEN.lancamento * .5 ? 0 : time - player.ryuken.started < RYUKEN.lancamento * .85 ? 1 : 2) : lancado < .2 ? 2 : 3;
      // SSJ4 ainda sem folha própria do Ryuken: usa a folha de soco dele (preparação, avanço, impacto segurado).
      const [folha, imagem] = ssj4 ? [FOLHAS_GOKU_SSJ4.soco[0], art[FOLHAS_GOKU_SSJ4.soco[1]]] : [GOKU_SSJ3_RYUKEN, art.gokuSsj3Ryuken];
      const altura = 70 * folha.referenceHeight / FOLHAS_GOKU_BASE.andar[0].referenceHeight;
      if (drawSheet(ctx, folha, imagem, pos, altura, player.ryuken?.direction || player.facing, ssj4 ? Math.min(coluna, 2) : coluna)) return true;
    }
    if (genki !== null) { estado = 'genki';coluna = genki; }
    else if (player.charge) {
      estado = 'kamehameha';
      const inicio = player.charge.until - KAME.carga;
      coluna = time - inicio < KAME.carga / 2 ? 0 : 1;
    } else if (Number.isFinite(player.kameStarted)) {
      estado = 'kamehameha';coluna = time - player.kameStarted < .5 ? 2 : 3;
    } else if (Number.isFinite(player.rajadaStarted) && time - player.rajadaStarted < .36) {
      estado = 'rajada';coluna = strikeColumn(Math.max(0,time-player.rajadaStarted)/.36);
    } else if (strikeProgress !== null) { estado = 'soco';coluna = strikeColumn(strikeProgress); }
    if (natalino && player.montaria === 'rena_natalina' && (estado === 'parado' || estado === 'andar')) { estado = 'montado'; coluna = 0; }
    if (estado === 'andar') {
      const altura = natalino ? 70 : 70 * folhas.andar[0].referenceHeight / FOLHAS_GOKU_BASE.andar[0].referenceHeight;
      if (natalino ? desenhar(folhas.andar[0],folhas.andar[1],coluna,altura) : drawWalk(ctx,ssj4 ? 'gokuSsj4' : ssj3 ? 'gokuSsj3' : ssj2 ? 'gokuSsj2' : ssj ? 'gokuSsj' : player.forma === 'kaioken' ? 'kaioken' : 'goku',pos,altura,player.facing,true)) return true;
    } else {
      const [folha,chave] = folhas[estado];
      // Escala única entre poses: mudar de ação não muda o tamanho do corpo.
      const altura = natalino ? 70 : 70 * folha.referenceHeight / FOLHAS_GOKU_BASE.andar[0].referenceHeight;
      if (desenhar(folha,chave,coluna,altura)) return true;
    }
  }
  // Soco e carga do Kamehameha vêm da folha de golpe desenhada da forma atual (carga = pose de preparação).
  if (!player.dead) {
    const [sheet, key] = GOLPE[player.transformed ? 'ssj' : 'goku'];
    if (strikeProgress !== null && !player.charge &&
        drawSheet(ctx, sheet, art[key], pos, 70, player.facing, strikeColumn(strikeProgress))) return true;
    if (player.charge && drawSheet(ctx, sheet, art[key], pos, 70, player.facing, 0)) return true;
  }
  if (strikeProgress !== null && !player.dead && !player.charge &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, strikeProgress)) return true;
  if (player.charge && !player.dead &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, 3 / 16)) return true;
  if (!player.dead && drawWalk(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, player.moving)) return true;
  if (!loaded(art.goku)) return false;
  const f = player.facing || { x: 0, y: 1 };
  const horizontal = Math.abs(f.x) > Math.abs(f.y) * 1.15;
  const back = !horizontal && f.y < 0;
  const column = horizontal ? 2 : back ? 4 : 0;
  let row = player.transformed ? 9 : (player.charge ? 8 : strikeProgress !== null ? 4 : (player.moving && !back ? 1 : 0));
  if (player.dead) row = 7;
  const rowY = [55, 179, 304, 425, 545, 660, 783, 894, 966, 1088];
  const sourceX = 180 + column * 114;
  const bob = player.moving ? Math.sin(time * 13) * 1.3 : 0;
  ctx.save();
  ctx.translate(Math.round(pos.x), Math.round(pos.y + bob));
  if (horizontal && f.x < 0) ctx.scale(-1, 1);
  ctx.drawImage(art.goku, sourceX, rowY[row], 100, 110, -32, -63, 64, 70);
  ctx.restore();
  return true;
}
