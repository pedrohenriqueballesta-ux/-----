import { multiplicadorDaForma, nomeDaForma } from './formas.mjs';
import {statsFor,xpForLevel} from './characters.mjs';
import {CONFIG} from './config.mjs';
export function poderCombate(s){return Math.round(s.hp/10+s.ki/10+s.attack*5+s.defense*3);}
export function perfilPersonagem(p,tempo=0){
 const base=statsFor(p.level,p.vocacao),kaioken=p.forma==='kaioken',multiplicador=multiplicadorDaForma(p.forma,'soco');
 return{nome:p.name,personagem:p.character||'Goku',nivel:p.level,forma:p.forma==='base'?'Base':nomeDaForma(p.forma),xp:p.xp,xpNext:xpForLevel(p.level),hp:p.hp,ki:p.ki,
 base,stats:{...p.stats},ataqueAtual:p.stats.attack*multiplicador,bonusAtaque:p.stats.attack*(multiplicador-1),poder:poderCombate(p.stats),
 buffs:[...(p.transformed?[nomeDaForma(p.forma)+': ataque físico ×'+String(multiplicadorDaForma(p.forma,'soco')).replace('.',',')+'; disparo de Ki ×'+String(multiplicadorDaForma(p.forma,'rajada')).replace('.',',')+' (base ×1,4).']:[]),...(kaioken?['Kaioken: ataque físico e disparo de Ki ×1,4.']:[]),...(tempo<p.barrierUntil?['Barreira: dano recebido ×0,28 antes da defesa.']:[]),...(tempo<p.foodUntil?['Comida: '+(CONFIG.foodHealPerSecond*p.stats.healing).toFixed(2)+' HP/s.']:[])],
 regeneracao:tempo<p.foodUntil?CONFIG.foodHealPerSecond*p.stats.healing:0,kills:p.kills,bossKills:p.bossKills,godmode:p.godmode===true};
}
