// Folhas PARADO (respiração em loop, pés parados), Pedro, 10/11/2026: sem elas o mob parado usava um quadro da
// caminhada e ficava no meio do passo. Recortadas por fatiar_caminhada.py (modo conectado, 210/150; Hatchiyack em
// fundo verde). Chave = o mesmo `kind` da caminhada (PASSO em atlas.mjs). drawWalk usa a folha daqui quando o mob
// não anda. Mob novo: recorte a folha PARADO e acrescente uma linha.
import { FOLHAS_NAMEK_NORTE } from './cenario/namek-norte.mjs';
import { GUERREIRO_PARADO } from './guerreiro-parado.mjs';
import { VETERANO_PARADO } from './personagens/veterano/veterano-parado.mjs';
import { SENTINELA_PARADO } from './personagens/sentinela/sentinela-parado.mjs';
import { TSUFURU_GUERREIRO_PARADO } from './personagens/tsufuru/tsufuru-guerreiro-parado.mjs';
import { TSUFURU_GENERAL_PARADO } from './personagens/tsufuru/tsufuru-general-parado.mjs';
import { HATCHIYACK_PARADO } from './personagens/hatchiyack/hatchiyack-parado.mjs';
import { DODORIA_PARADO } from './personagens/dodoria/dodoria-parado.mjs';
import { ZARBON_PARADO } from './personagens/zarbon/zarbon-parado.mjs';
import { NAPPA_PARADO } from './personagens/nappa/nappa-parado.mjs';
import { RADITZ_PARADO } from './personagens/raditz/raditz-parado.mjs';
import { BARDOCK_PARADO } from './personagens/bardock/bardock-parado.mjs';
import { OOZARU_PARADO } from './personagens/oozaru/oozaru-parado.mjs';
import { OOZARU_GUERREIRO_PARADO } from './personagens/oozaru/oozaru-guerreiro-parado.mjs';
import { OOZARU_DOURADO_PARADO } from './personagens/oozaru/oozaru-dourado-parado.mjs';
import { REI_VEGETA_PARADO } from './personagens/rei-vegeta/rei-vegeta-parado.mjs';
import { BROLY_PARADO } from './personagens/broly/broly-parado.mjs';
import { FREEZA_PE_PARADO } from './personagens/freeza/freeza-pe-parado.mjs';

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
