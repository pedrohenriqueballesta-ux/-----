import {CONFIG} from './config.mjs';
export const consumivelValido=id=>['food','ki',...CONFIG.seedPotencies.map(n=>'seed'+n)].includes(id);
export function hotkeysConsumiveisValidas(valor,semente=15){return Object.fromEntries([7,8].map(n=>[n,valor?.[n]===null?null:consumivelValido(valor?.[n])?valor[n]:n===7?'seed'+(CONFIG.seedPotencies.includes(semente)?semente:15):'ki']));}
export function acaoConsumivel(id){return id==='food'?{type:'food'}:id==='ki'?{type:'potion'}:consumivelValido(id)?{type:'seed',potency:Number(id.slice(4))}:null;}
