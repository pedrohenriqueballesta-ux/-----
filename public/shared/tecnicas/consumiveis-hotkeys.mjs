import {CONFIG} from '../nucleo/config.mjs';
import {CONSUMIVEIS_LOOT} from './consumiveis-loot.mjs';
export const efeitoComida = p => p.foodId && p.foodId !== 'food'
  ? CONSUMIVEIS_LOOT[p.foodId] : { hpPorSegundo: CONFIG.foodHealPerSecond * p.stats.healing, kiPorSegundo: 0 };
export const consumivelValido=id=>Object.hasOwn(CONSUMIVEIS_LOOT,id)||['food','ki',...CONFIG.seedPotencies.map(n=>'seed'+n)].includes(id);
export function hotkeysConsumiveisValidas(valor,semente=15){return Object.fromEntries([7,8].map(n=>[n,valor?.[n]===null?null:consumivelValido(valor?.[n])?valor[n]:n===7?'seed'+(CONFIG.seedPotencies.includes(semente)?semente:15):'ki']));}
export function acaoConsumivel(id){return id==='food'?{type:'food'}:id==='ki'?{type:'potion'}:Object.hasOwn(CONSUMIVEIS_LOOT,id)?{type:'usarConsumivel',item:id}:consumivelValido(id)?{type:'seed',potency:Number(id.slice(4))}:null;}
