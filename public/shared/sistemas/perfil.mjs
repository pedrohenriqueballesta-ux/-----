import { bonusXpPremium, pocaoXpEmUso, XP_VIP_PERCENTUAL } from './bonus-premium.mjs';
import { multiplicadorDaForma, nomeDaForma } from '../tecnicas/formas.mjs';
import {bonusDoExtensor,statsFor,xpForLevel} from '../nucleo/characters.mjs';
import {taxasRegeneracao} from './regeneracao.mjs';
import {ITENS_NEGOCIAVEIS} from './itens-negociaveis.mjs';
import {CONFIG} from '../nucleo/config.mjs';
const dataVip = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' });
const numeroBonus = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function poderCombate(s){return Math.round(s.hp/10+s.ki/10+s.attack*5+s.defense*3);}
export function perfilPersonagem(p,tempo=0,agora=Date.now()){
 const base=statsFor(p.level,p.vocacao),kaioken=p.forma==='kaioken',multiplicador=multiplicadorDaForma(p.forma,'soco');
 const taxas = taxasRegeneracao(p, tempo);
 const nomeComida = ITENS_NEGOCIAVEIS[p.foodId]?.nome ?? 'Presunto';
 const regeneracao = {
   hp: {
     total: taxas.hpComida,
     ilimitada: p.hp > 0 && p.godmode && p.godmodeOptions?.hpInfinite !== false,
     fontes: taxas.hpComida ? [[nomeComida, taxas.hpComida]] : []
   },
   ki: {
     total: taxas.kiNatural + taxas.kiEquipamento + taxas.kiComida - taxas.drenoForma,
     ilimitada: p.hp > 0 && p.godmode && p.godmodeOptions?.kiInfinite !== false,
     fontes: [
       ['Recuperação natural', taxas.kiNatural],
       ['Equipamentos', taxas.kiEquipamento],
       [nomeComida, taxas.kiComida],
       [nomeDaForma(p.forma), -taxas.drenoForma]
     ].filter(([, taxa]) => taxa !== 0)
   }
 };
 const efeitos = [];
 if (p.vipAte > agora) efeitos.push('VIP: +' + XP_VIP_PERCENTUAL + '% de XP até ' + dataVip.format(p.vipAte) + '.');
 const pocao = p.bonusPremium?.xp;
 if (pocao) {
   const segundos = Math.ceil(pocao.segundos);
   const prazo = [Math.floor(segundos / 3600), Math.floor(segundos / 60) % 60, segundos % 60]
     .map(n => String(n).padStart(2, '0')).join(':');
   efeitos.push('Poção: +' + pocao.percentual + '% de XP · ' + prazo + (pocaoXpEmUso(p) ? ' restantes.' : ' restantes (pausada).'));
 }
 const extensor = bonusDoExtensor(p);
 if (extensor) efeitos.push('Extensor equipado: +' + extensor + '% na capacidade de peso.');
 const capacidadeRetida = p.bonusPremium?.capacidadeRetida || 0;
 if (capacidadeRetida) efeitos.push('Limite de peso retido: ' + numeroBonus.format(capacidadeRetida) + ' kg. Diminui conforme você libera peso.');
 const bonusDefesa = p.stats.defense - base.defense, bonusAtaque = p.stats.attack - base.attack;
 const ganhos = [bonusAtaque > 0 && '+' + numeroBonus.format(bonusAtaque) + ' ataque',
   bonusDefesa > 0 && '+' + numeroBonus.format(bonusDefesa) + ' defesa'].filter(Boolean);
 if (ganhos.length) efeitos.push('Equipamentos: ' + ganhos.join(' · ') + '.');
 const xpExtra = bonusXpPremium(p, agora);
 if (xpExtra) efeitos.unshift('XP extra atual: +' + xpExtra + '%.');
 const noTeto=p.level>=CONFIG.progression.nivelMaximo;
 return{nome:p.name,personagem:p.character||'Goku',nivel:p.level,forma:p.forma==='base'?'Base':nomeDaForma(p.forma),xp:noTeto?0:p.xp,xpNext:noTeto?0:xpForLevel(p.level),hp:p.hp,ki:p.ki,
 base,stats:{...p.stats},ataqueAtual:p.stats.attack*multiplicador,bonusAtaque:p.stats.attack*(multiplicador-1),poder:poderCombate(p.stats),
 buffs:[...efeitos,...(p.transformed?[nomeDaForma(p.forma)+': ataque físico ×'+String(multiplicadorDaForma(p.forma,'soco')).replace('.',',')+'; disparo de Ki ×'+String(multiplicadorDaForma(p.forma,'rajada')).replace('.',',')+' (base ×1,4).']:[]),...(kaioken?['Kaioken: ataque físico e disparo de Ki ×1,4.']:[]),...(tempo<p.barrierUntil?['Barreira: dano recebido ×0,28 antes da defesa.']:[])],
 regeneracao,kills:p.kills,bossKills:p.bossKills,godmode:p.godmode===true};
}
