// Folhas PARADO (respiração em loop, pés parados), Pedro, 10/11/2026: sem elas o mob parado usava um quadro da
// caminhada e ficava no meio do passo. Recortadas por fatiar_caminhada.py (modo conectado, 210/150; Hatchiyack em
// fundo verde). Chave = o mesmo `kind` da caminhada (PASSO em atlas.mjs). drawWalk usa a folha daqui quando o mob
// não anda. Mob novo: recorte a folha PARADO e acrescente uma linha.
import { FOLHAS_NAMEK_NORTE } from './namek-norte.mjs';
import { GUERREIRO_PARADO } from './guerreiro-parado.mjs';
import { VETERANO_PARADO } from './veterano-parado.mjs';
import { SENTINELA_PARADO } from './sentinela-parado.mjs';
import { TSUFURU_GUERREIRO_PARADO } from './tsufuru-guerreiro-parado.mjs';
import { TSUFURU_GENERAL_PARADO } from './tsufuru-general-parado.mjs';
import { HATCHIYACK_PARADO } from './hatchiyack-parado.mjs';
import { DODORIA_PARADO } from './dodoria-parado.mjs';
import { ZARBON_PARADO } from './zarbon-parado.mjs';
import { NAPPA_PARADO } from './nappa-parado.mjs';
import { RADITZ_PARADO } from './raditz-parado.mjs';
import { BARDOCK_PARADO } from './bardock-parado.mjs';
import { OOZARU_PARADO } from './oozaru-parado.mjs';
import { OOZARU_GUERREIRO_PARADO } from './oozaru-guerreiro-parado.mjs';
import { OOZARU_DOURADO_PARADO } from './oozaru-dourado-parado.mjs';
import { REI_VEGETA_PARADO } from './rei-vegeta-parado.mjs';
import { BROLY_PARADO } from './broly-parado.mjs';
import { FREEZA_PE_PARADO } from './freeza-pe-parado.mjs';

export const PARADO = {
  guerreiro: [GUERREIRO_PARADO, 'guerreiroParado'],
  veterano: [VETERANO_PARADO, 'veteranoParado'],
  alien: [SENTINELA_PARADO, 'alienParado'],
  tsufuruGuerreiro: [TSUFURU_GUERREIRO_PARADO, 'tsufuruGuerreiroParado'],
  tsufuruGeneral: [TSUFURU_GENERAL_PARADO, 'tsufuruGeneralParado'],
  hatchiyack: [HATCHIYACK_PARADO, 'hatchiyackParado'],
  dodoria: [DODORIA_PARADO, 'dodoriaParado'],
  zarbon: [ZARBON_PARADO, 'zarbonParado'],
  nappa: [NAPPA_PARADO, 'nappaParado'],
  raditz: [RADITZ_PARADO, 'raditzParado'],
  bardock: [BARDOCK_PARADO, 'bardockParado'],
  oozaru: [OOZARU_PARADO, 'oozaruParado'],
  oozaruGuerreiro: [OOZARU_GUERREIRO_PARADO, 'oozaruGuerreiroParado'],
  oozaruDourado: [OOZARU_DOURADO_PARADO, 'oozaruDouradoParado'],
  reiVegeta: [REI_VEGETA_PARADO, 'reiVegetaParado'],
  broly: [BROLY_PARADO, 'brolyParado'],
  freezaPe: [FREEZA_PE_PARADO, 'freezaPeParado'],
  ...Object.fromEntries(Object.entries(FOLHAS_NAMEK_NORTE).filter(([, f]) => f.parado).map(([tipo, f]) => [tipo, f.parado]))
};
