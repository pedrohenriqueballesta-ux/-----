import { areaPorId } from '../nucleo/config.mjs';
import { DURACAO_EXTENSOR, ITENS_PREMIUM } from './itens-premium.mjs';

export const DURACAO_POCAO_XP = 8 * 3600;
export const XP_VIP_PERCENTUAL = 30;

export function restaurarBonusPremium(valor) {
  const xp = valor?.xp;
  const segundos = Number.isFinite(xp?.segundos) ? Math.min(DURACAO_POCAO_XP, xp.segundos) : 0;
  return {
    xp: [10, 15, 20].includes(xp?.percentual) && segundos > 0 ? { percentual: xp.percentual, segundos } : null,
    extensores: Object.fromEntries(Object.values(ITENS_PREMIUM)
      .filter(item => item.bonusCapacidade && Number.isFinite(valor?.extensores?.[item.id]) && valor.extensores[item.id] > 0)
      .map(item => [item.id, Math.min(DURACAO_EXTENSOR, valor.extensores[item.id])])),
    capacidadeRetida: Number.isFinite(valor?.capacidadeRetida) && valor.capacidadeRetida > 0 ? valor.capacidadeRetida : 0,
    restoXp: Number.isInteger(valor?.restoXp) && valor.restoXp >= 0 && valor.restoXp < 100 ? valor.restoXp : 0
  };
}

export function pocaoXpEmUso(p) {
  const area = areaPorId(p.area);
  return Boolean(p.connected && p.hp > 0 && !p.godmode && area?.nivel && !area.segura);
}

export function bonusXpPremium(p, agora) {
  const vip = (p.vipAte ?? 0) > agora ? XP_VIP_PERCENTUAL : 0;
  const pocao = p.bonusPremium?.xp;
  return vip + (pocao && pocao.segundos > 0 && pocaoXpEmUso(p) ? pocao.percentual : 0);
}

export function avancarPocaoXp(p, dt) {
  const pocao = p.bonusPremium.xp;
  if (!pocao || !pocaoXpEmUso(p)) return;
  pocao.segundos = Math.max(0, pocao.segundos - dt);
  if (pocao.segundos === 0) p.bonusPremium.xp = null;
}
