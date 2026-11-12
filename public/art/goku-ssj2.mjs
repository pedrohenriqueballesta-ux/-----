// Seis folhas originais do Pedro (11/11/2026): Goku Super Saiyajin 2 feito sobre as folhas do SSJ (mesmas poses,
// corpo idêntico), cabelo mais cheio. Os raios são um efeito à parte, animado (render/raios-ssj2.mjs).
import { GOKU_SSJ2_PARADO } from './goku-ssj2-parado.mjs';
import { GOKU_SSJ2_ANDAR } from './goku-ssj2-andar.mjs';
import { GOKU_SSJ2_SOCO } from './goku-ssj2-soco.mjs';
import { GOKU_SSJ2_RAJADA } from './goku-ssj2-rajada.mjs';
import { GOKU_SSJ2_KAMEHAMEHA } from './goku-ssj2-kamehameha.mjs';
import { GOKU_SSJ2_GENKI } from './goku-ssj2-genki.mjs';
export const FOLHAS_GOKU_SSJ2 = Object.freeze({
  parado: [GOKU_SSJ2_PARADO, 'gokuSsj2Parado'],
  andar: [GOKU_SSJ2_ANDAR, 'gokuSsj2Andar'],
  soco: [GOKU_SSJ2_SOCO, 'gokuSsj2Soco'],
  rajada: [GOKU_SSJ2_RAJADA, 'gokuSsj2Rajada'],
  kamehameha: [GOKU_SSJ2_KAMEHAMEHA, 'gokuSsj2Kamehameha'],
  genki: [GOKU_SSJ2_GENKI, 'gokuSsj2Genki']
});
