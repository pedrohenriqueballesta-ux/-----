import { TIPOS_CHEFE } from '../nucleo/enemies.mjs';
import { CHEFES_DA_SAGA } from './saga-cell.mjs';
import { CHEFE_INFERNAL, SUPER_C17 } from './saga-androides.mjs';

export const chaveBestiario = mob => mob.area + ':' + mob.type;

const chefesUnicos = [...Object.values(CHEFES_DA_SAGA), CHEFE_INFERNAL];
export const CHEFES_PESSOAIS_BESTIARIO = [...chefesUnicos, SUPER_C17];

export function metaDrops(mob) {
  return mob.raro || TIPOS_CHEFE.has(mob.type) ? 1 : 50;
}

export function restaurarAbatesBestiario(salvo) {
  return Object.fromEntries(Object.entries(salvo ?? {}).filter(([chave, abates]) =>
    /^[\w-]+:[\w-]+$/.test(chave) && Number.isSafeInteger(abates) && abates > 0));
}

export function registrarAbateBestiario(p, mob) {
  if (!mob.area || mob.teste || p.godmode) return;
  const chave = chaveBestiario(mob);
  const abates = p.bestiarioAbates[chave] ?? 0;
  if (abates >= metaDrops(mob)) return;
  p.bestiarioAbates[chave] = abates + 1;
  p.bestiarioRevisao++;
}

export function abatesDeChefeUnico(p, chave) {
  const { etapa, venceu } = p.sagaCell ?? {};
  if (chave === chaveBestiario(CHEFES_DA_SAGA.semiDeserto)) return Number(etapa >= 3 || (etapa === 2 && venceu === true));
  if (chave === chaveBestiario(CHEFES_DA_SAGA.semiIlha)) return Number(etapa >= 4 || (etapa === 3 && venceu === true));
  if (chave === chaveBestiario(CHEFES_DA_SAGA.perfeito)) return Number(etapa >= 5 || (etapa === 4 && venceu === true));
  if (chave === chaveBestiario(CHEFE_INFERNAL)) return Number(p.sagaAndroides?.venceuInfernal === true);
  return 0;
}
