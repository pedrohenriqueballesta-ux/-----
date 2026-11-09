import {statsFor,xpForLevel} from './characters.mjs';
import {CONFIG} from './config.mjs';
export function poderCombate(s){return Math.round(s.hp/10+s.ki/10+s.attack*5+s.defense*3);}
export function perfilPersonagem(p,tempo=0){
 const base=statsFor(p.level),kaioken=p.forma==='kaioken',multiplicador=(p.transformed?1.5:1)*(kaioken?1.4:1);
 return{nome:p.name,personagem:p.character||'Goku',nivel:p.level,forma:p.transformed?'Super Saiyajin':kaioken?'Kaioken':'Base',xp:p.xp,xpNext:xpForLevel(p.level),hp:p.hp,ki:p.ki,
 base,stats:{...p.stats},ataqueAtual:p.stats.attack*multiplicador,bonusAtaque:p.stats.attack*(multiplicador-1),poder:poderCombate(p.stats),
 buffs:[...(p.transformed?['Super Saiyajin: ataque físico ×1,5; disparo de Ki ×2,1 (base ×1,4).']:[]),...(kaioken?['Kaioken: ataque físico e disparo de Ki ×1,4.']:[]),...(tempo<p.barrierUntil?['Barreira: dano recebido ×0,28 antes da defesa.']:[]),...(tempo<p.foodUntil?['Comida: '+(CONFIG.foodHealPerSecond*p.stats.healing).toFixed(2)+' HP/s.']:[])],
 regeneracao:tempo<p.foodUntil?CONFIG.foodHealPerSecond*p.stats.healing:0,kills:p.kills,bossKills:p.bossKills,godmode:p.godmode===true};
}