// Seis folhas originais do Pedro (11/11/2026): Goku Super Saiyajin com as mesmas poses da base (folhas base como
// molde), cabelo de Super Saiyajin e quimono inteiro. Fundo magenta removido pelas ferramentas do projeto.
import { GOKU_SSJ_PARADO } from './goku-ssj-parado.mjs';
import { GOKU_SSJ_ANDAR } from './goku-ssj-andar.mjs';
import { GOKU_SSJ_SOCO } from './goku-ssj-soco.mjs';
import { GOKU_SSJ_RAJADA } from './goku-ssj-rajada.mjs';
import { GOKU_SSJ_KAMEHAMEHA } from './goku-ssj-kamehameha.mjs';
import { GOKU_SSJ_GENKI } from './goku-ssj-genki.mjs';
export const FOLHAS_GOKU_SSJ = Object.freeze({
  parado: [GOKU_SSJ_PARADO, 'gokuSsjParado'],
  andar: [GOKU_SSJ_ANDAR, 'gokuSsjAndar'],
  soco: [GOKU_SSJ_SOCO, 'gokuSsjSoco'],
  rajada: [GOKU_SSJ_RAJADA, 'gokuSsjRajada'],
  kamehameha: [GOKU_SSJ_KAMEHAMEHA, 'gokuSsjKamehameha'],
  genki: [GOKU_SSJ_GENKI, 'gokuSsjGenki']
});
