import {CONFIG} from './config.mjs';
export const MAX_ZENI_NORMAL = 9999999;
export const ITENS_NEGOCIAVEIS = Object.freeze(Object.fromEntries([
 ['food','Presunto','comida'],['ki','Poção de Ki','pocao_ki'],
 ...CONFIG.seedPotencies.map(n=>['seed'+n,'Semente '+n+'%','semente_dos_deuses']),
 ['scrap','Sucata','sucata'],['crystal','Cristal','cristal']
].map(([id,nome,icone])=>[id,Object.freeze({id,nome,icone:'/assets/inventario/'+icone+'.png',peso:CONFIG.itemWeights[id],precoNpc:CONFIG.prices[id]?Math.floor(CONFIG.prices[id]*.5):id==='scrap'?8:15,negociavel:true})])));
export const saldoReal = p => p.godmode && p.zeniReal != null ? p.zeniReal : p.zeni;
export function creditarZeni(p,valor) {
 const saldo=saldoReal(p);if(!Number.isSafeInteger(valor)||valor<0||saldo+valor>MAX_ZENI_NORMAL)return false;
 if(p.godmode&&p.zeniReal!=null)p.zeniReal+=valor;else p.zeni+=valor;
 return true;
}
