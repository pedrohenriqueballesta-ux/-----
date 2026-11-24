import { multiplicadorDaForma, nomeDaForma } from '../tecnicas/formas.mjs';
import {statsFor,xpForLevel} from '../nucleo/characters.mjs';
import {efeitoComida} from '../tecnicas/consumiveis-hotkeys.mjs';
import {ITENS_NEGOCIAVEIS} from './itens-negociaveis.mjs';
import {CONFIG} from '../nucleo/config.mjs';
export function poderCombate(s){return Math.round(s.hp/10+s.ki/10+s.attack*5+s.defense*3);}
export function perfilPersonagem(p,tempo=0){
 const base=statsFor(p.level,p.vocacao),kaioken=p.forma==='kaioken',multiplicador=multiplicadorDaForma(p.forma,'soco');
 const comida = tempo < p.foodUntil ? efeitoComida(p) : null;
 const recuperacao = comida && [
   ...(comida.hpPorSegundo ? [comida.hpPorSegundo.toFixed(2) + ' HP/s'] : []),
   ...(comida.kiPorSegundo ? [comida.kiPorSegundo.toFixed(2) + ' Ki/s'] : [])
 ].join(' + ');
 const noTeto=p.level>=CONFIG.progression.nivelMaximo;
 return{nome:p.name,personagem:p.character||'Goku',nivel:p.level,forma:p.forma==='base'?'Base':nomeDaForma(p.forma),xp:noTeto?0:p.xp,xpNext:noTeto?0:xpForLevel(p.level),hp:p.hp,ki:p.ki,
 base,stats:{...p.stats},ataqueAtual:p.stats.attack*multiplicador,bonusAtaque:p.stats.attack*(multiplicador-1),poder:poderCombate(p.stats),
 buffs:[...(p.transformed?[nomeDaForma(p.forma)+': ataque físico ×'+String(multiplicadorDaForma(p.forma,'soco')).replace('.',',')+'; disparo de Ki ×'+String(multiplicadorDaForma(p.forma,'rajada')).replace('.',',')+' (base ×1,4).']:[]),...(kaioken?['Kaioken: ataque físico e disparo de Ki ×1,4.']:[]),...(tempo<p.barrierUntil?['Barreira: dano recebido ×0,28 antes da defesa.']:[]),...(comida?[(ITENS_NEGOCIAVEIS[p.foodId]?.nome ?? 'Presunto')+': '+recuperacao+'.']:[])],
 regeneracao:comida?.hpPorSegundo ?? 0,kills:p.kills,bossKills:p.bossKills,godmode:p.godmode===true};
}
