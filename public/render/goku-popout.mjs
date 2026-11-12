import { FOLHAS_GOKU_BASE } from '../art/goku-base.mjs';
import { FOLHAS_GOKU_KAIOKEN } from '../art/goku-kaioken.mjs';
import { FOLHAS_GOKU_SSJ } from '../art/goku-ssj.mjs';
import { SHEET_VIEWS } from '../art/sheet-views.mjs';
import { spriteFacing, walkStep, strikeColumn } from './camera.mjs';

const CACHE = new Map(), DURACAO_GOLPE = .36;
const formaFolhas = sprite => sprite.transformed || sprite.forma === 'ssj' ? FOLHAS_GOKU_SSJ
  : sprite.forma === 'kaioken' ? FOLHAS_GOKU_KAIOKEN : FOLHAS_GOKU_BASE;

export function poseGokuPopout(sprite, time, travelled = 0) {
  const folhas = formaFolhas(sprite), idade = inicio => Number.isFinite(inicio) ? time - inicio : Infinity;
  const idadeGenkiCarga = idade(sprite.genkiCarga?.started);
  const idadeGenki = idade(sprite.genkiLancado);
  if (idadeGenkiCarga >= 0 && idadeGenkiCarga < .4) return [folhas.genki[0], idadeGenkiCarga < .25 ? 0 : 1];
  if (idadeGenki >= 0 && idadeGenki < .35) return [folhas.genki[0], idadeGenki < .15 ? 2 : 3];
  if (sprite.charge) return [folhas.kamehameha[0], time - (sprite.charge.until - .65) < .325 ? 0 : 1];
  const idadeKame = idade(sprite.kameStarted);
  if (idadeKame >= 0 && idadeKame < 1.28) return [folhas.kamehameha[0], idadeKame < .5 ? 2 : 3];
  const idadeRajada = idade(sprite.rajadaStarted);
  if (idadeRajada >= 0 && idadeRajada < DURACAO_GOLPE) return [folhas.rajada[0], strikeColumn(idadeRajada / DURACAO_GOLPE)];
  const idadeSoco = idade(sprite.socoStarted);
  if (idadeSoco >= 0 && idadeSoco < DURACAO_GOLPE) return [folhas.soco[0], strikeColumn(idadeSoco / DURACAO_GOLPE)];
  if (sprite.moving) {
    const sheet = folhas.andar[0], passo = walkStep(travelled, 96);
    return [sheet, Math.floor(passo * sheet.columns / 16)];
  }
  const sheet = folhas.parado[0];
  return [sheet, Math.floor(time * 3) % sheet.columns];
}

function imagem(file) {
  if (typeof Image === 'undefined') return null;
  if (!CACHE.has(file)) { const img = new Image(); img.src = file; CACHE.set(file, img); }
  return CACHE.get(file);
}

function desenharFolha(ctx, sprite, time, travelled, deslocamento = 0) {
  const [sheet, coluna] = poseGokuPopout(sprite, time, travelled), img = imagem(sheet.file);
  if (!img?.complete || !img.naturalWidth) return false;
  const view = SHEET_VIEWS[spriteFacing(sprite.facing)], [sx, sy, sw, sh, ax, ay] = sheet.frames[view.row][coluna];
  const escala = 76 / sheet.referenceHeight;
  ctx.save(); ctx.translate(60 + deslocamento, 108);
  if (view.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, (sx - ax) * escala, (sy - ay) * escala + 6, sw * escala, sh * escala);
  ctx.restore(); return true;
}

function desenharMorto(ctx, sprite) {
  const img = imagem('/assets/goku-sheet.png');
  if (!img?.complete || !img.naturalWidth) return false;
  const f = sprite.facing || { x: 0, y: 1 }, horizontal = Math.abs(f.x) > Math.abs(f.y) * 1.15;
  const coluna = horizontal ? 2 : f.y < 0 ? 4 : 0, sx = 180 + coluna * 114, sy = 894;
  ctx.drawImage(img, sx, sy, 100, 110, 28, 43, 64, 70); return true;
}

export function desenharGokuPopout(ctx, sprite, time, travelled = 0) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!sprite) return false;
  if (sprite.dead) return desenharMorto(ctx, sprite);
  if (sprite.dashing) { ctx.globalAlpha = .25; desenharFolha(ctx, sprite, time, travelled, -sprite.facing.x * 8); ctx.globalAlpha = 1; }
  return desenharFolha(ctx, sprite, time, travelled);
}
