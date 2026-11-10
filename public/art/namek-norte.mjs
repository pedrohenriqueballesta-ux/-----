// Folhas originais do Pedro, recortadas em modo conectado para preservar roxo e rosa.
import { NAIL_ANDAR } from './nail-andar.mjs';
import { NAIL_ATAQUE } from './nail-ataque.mjs';
import { NAIL_RAJADA } from './nail-rajada.mjs';
import { PICCOLO_DAIMAOH_ANDAR } from './piccolo-daimaoh-andar.mjs';
import { PICCOLO_DAIMAOH_ATAQUE } from './piccolo-daimaoh-ataque.mjs';
import { PICCOLO_DAIMAOH_RAJADA } from './piccolo-daimaoh-rajada.mjs';
import { NEVA_ANDAR } from './neva-andar.mjs';
import { NEVA_ATAQUE } from './neva-ataque.mjs';
import { NEVA_RAJADA } from './neva-rajada.mjs';
export const FOLHAS_NAMEK_NORTE = Object.freeze({
  nail: { andar: [NAIL_ANDAR, 'nailAndar'], ataque: [NAIL_ATAQUE, 'nailAtaque'], rajada: [NAIL_RAJADA, 'nailRajada'] },
  piccoloDaimaoh: { andar: [PICCOLO_DAIMAOH_ANDAR, 'piccoloDaimaohAndar'], ataque: [PICCOLO_DAIMAOH_ATAQUE, 'piccoloDaimaohAtaque'], rajada: [PICCOLO_DAIMAOH_RAJADA, 'piccoloDaimaohRajada'] },
  neva: { andar: [NEVA_ANDAR, 'nevaAndar'], ataque: [NEVA_ATAQUE, 'nevaAtaque'], rajada: [NEVA_RAJADA, 'nevaRajada'] }
});
