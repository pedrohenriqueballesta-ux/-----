import {CONFIG} from '../nucleo/config.mjs';
import {ITENS_PREMIUM} from '../sistemas/itens-premium.mjs';
import {CONSUMIVEIS_LOOT} from './consumiveis-loot.mjs';
export const efeitoComida = p => p.foodId && p.foodId !== 'food'
  ? CONSUMIVEIS_LOOT[p.foodId] : { hpPorSegundo: CONFIG.foodHealPerSecond * p.stats.healing, kiPorSegundo: 0 };
// Se só um recurso estiver baixo, preserve as carnes que recuperam os dois.
const COMIDAS_VIDA = ['food', 'carne-dinossauro'];
const COMIDAS_KI = ['fruta-namek'];
const COMIDAS_MISTAS = {
  hp: ['carne-porunga', 'carne-oozaru'],
  ki: ['carne-oozaru', 'carne-porunga']
};

export function escolherComidaAutomatica(p) {
  const hp = p.hp / p.stats.hp, ki = p.ki / p.stats.ki;
  const faltaHp = hp <= CONFIG.autoFoodLimiteHp, faltaKi = ki <= CONFIG.autoFoodLimiteKi;
  if (!faltaHp && !faltaKi) return null;

  const priorizarHp = faltaHp && (!faltaKi || hp <= ki);
  const principal = priorizarHp ? COMIDAS_VIDA : COMIDAS_KI;
  const secundaria = priorizarHp ? COMIDAS_KI : COMIDAS_VIDA;
  const mistas = COMIDAS_MISTAS[priorizarHp ? 'hp' : 'ki'];
  const ordem = faltaHp && faltaKi ? [...mistas, ...principal, ...secundaria] : [...principal, ...mistas];
  return ordem.find(id => p.inventory[id] > 0) ?? null;
}
export const consumivelValido=id=>Object.hasOwn(CONSUMIVEIS_LOOT,id)||Object.hasOwn(ITENS_PREMIUM,id)&&Boolean(ITENS_PREMIUM[id].bonusXp)||['food','ki',...CONFIG.seedPotencies.map(n=>'seed'+n)].includes(id);
export function hotkeysConsumiveisValidas(valor,semente=15){return Object.fromEntries([7,8].map(n=>[n,valor?.[n]===null?null:consumivelValido(valor?.[n])?valor[n]:n===7?'seed'+(CONFIG.seedPotencies.includes(semente)?semente:15):'ki']));}
export function acaoConsumivel(id){return id==='food'?{type:'food'}:id==='ki'?{type:'potion'}:(Object.hasOwn(CONSUMIVEIS_LOOT,id)||Object.hasOwn(ITENS_PREMIUM,id)&&Boolean(ITENS_PREMIUM[id].bonusXp))?{type:'usarConsumivel',item:id}:consumivelValido(id)?{type:'seed',potency:Number(id.slice(4))}:null;}
