// Seis folhas do Goku base fornecidas pelo Pedro em 09/11/2026.
// Recortes gerados pelas ferramentas existentes; todas usam SHEET_VIEWS via drawSheet.
import { GOKU_PARADO } from './goku-parado.mjs';
import { GOKU_PASSO } from './goku-passo.mjs';
import { GOKU_GOLPE } from './goku-golpe.mjs';
import { GOKU_KI } from './goku-ki.mjs';
import { GOKU_GENKI } from './goku-genki.mjs';
import { GOKU_KAME } from './goku-kame.mjs';
export const FOLHAS_GOKU_BASE = Object.freeze({
  parado: [GOKU_PARADO, 'gokuParado'], andar: [GOKU_PASSO, 'gokuPasso'],
  soco: [GOKU_GOLPE, 'gokuGolpe'], rajada: [GOKU_KI, 'gokuKi'], kamehameha: [GOKU_KAME, 'gokuKame'], genki: [GOKU_GENKI, 'gokuGenki']
});
