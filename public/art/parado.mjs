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
import { TIRANOSSAURO_PARADO } from './personagens/dinossauros/tiranossauro-parado.mjs';
import { TRICERATOPS_PARADO } from './personagens/dinossauros/triceratops-parado.mjs';
import { ESTEGOSSAURO_PARADO } from './personagens/dinossauros/estegossauro-parado.mjs';
import { ESPINOSSAURO_PARADO } from './personagens/dinossauros/espinossauro-parado.mjs';
import { ROBO_PILAF_PARADO } from './personagens/robos-pilaf/robo-pilaf-parado.mjs';
import { ROBO_SHU_PARADO } from './personagens/robos-pilaf/robo-shu-parado.mjs';
import { ROBO_MAI_PARADO } from './personagens/robos-pilaf/robo-mai-parado.mjs';
import { MAQUINA_PILAF_PARADO } from './personagens/robos-pilaf/maquina-pilaf-parado.mjs';
import { YAMCHA_PARADO } from './personagens/yamcha/yamcha-parado.mjs';
import { ANDROIDE_18_PARADO } from './personagens/androides/androide-18-parado.mjs';
import { ANDROIDE_17_PARADO } from './personagens/androides/androide-17-parado.mjs';
import { ANDROIDE_16_PARADO } from './personagens/androides/androide-16-parado.mjs';
import { CELL_JR_PARADO } from './personagens/cell/cell-jr-parado.mjs';
import { CELL_IMPERFEITO_PARADO } from './personagens/cell/cell-imperfeito-parado.mjs';
import { C20_PARADO } from './personagens/cell/c20-parado.mjs';
import { CELL_SEMIPERFEITO_PARADO } from './personagens/cell/cell-semiperfeito-parado.mjs';
import { CELL_PERFEITO_PARADO } from './personagens/cell/cell-perfeito-parado.mjs';
import { ANDROIDE_17_POS_PARADO } from './personagens/androides/androide-17-pos-parado.mjs';
import { C17_INFERNAL_PARADO } from './personagens/androides/c17-infernal-parado.mjs';
import { SUPER_C17_PARADO } from './personagens/androides/super-c17-parado.mjs';
import { ANDROIDE_18_POS_PARADO } from './personagens/androides/androide-18-pos-parado.mjs';

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
  tiranossauro: [TIRANOSSAURO_PARADO, 'tiranossauroParado'],
  triceratops: [TRICERATOPS_PARADO, 'triceratopsParado'],
  estegossauro: [ESTEGOSSAURO_PARADO, 'estegossauroParado'],
  espinossauro: [ESPINOSSAURO_PARADO, 'espinossauroParado'],
  roboPilaf: [ROBO_PILAF_PARADO, 'roboPilafParado'],
  roboShu: [ROBO_SHU_PARADO, 'roboShuParado'],
  roboMai: [ROBO_MAI_PARADO, 'roboMaiParado'],
  maquinaPilaf: [MAQUINA_PILAF_PARADO, 'maquinaPilafParado'],
  yamcha: [YAMCHA_PARADO, 'yamchaParado'],
  androide18: [ANDROIDE_18_PARADO, 'androide18Parado'],
  androide17: [ANDROIDE_17_PARADO, 'androide17Parado'],
  androide16: [ANDROIDE_16_PARADO, 'androide16Parado'],
  cellJr: [CELL_JR_PARADO, 'cellJrParado'],
  cellImperfeito: [CELL_IMPERFEITO_PARADO, 'cellImperfeitoParado'],
  c20: [C20_PARADO, 'c20Parado'],
  cellSemiperfeito: [CELL_SEMIPERFEITO_PARADO, 'cellSemiperfeitoParado'],
  cellPerfeito: [CELL_PERFEITO_PARADO, 'cellPerfeitoParado'],
  androide17Pos: [ANDROIDE_17_POS_PARADO, 'androide17PosParado'],
  c17Infernal: [C17_INFERNAL_PARADO, 'c17InfernalParado'],
  superC17: [SUPER_C17_PARADO, 'superC17Parado'],
  androide18Pos: [ANDROIDE_18_POS_PARADO, 'androide18PosParado'],
  ...Object.fromEntries(Object.entries(FOLHAS_NAMEK_NORTE).filter(([, f]) => f.parado).map(([tipo, f]) => [tipo, f.parado]))
};
