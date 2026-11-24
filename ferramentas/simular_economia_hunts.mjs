// Uso: node ferramentas/simular_economia_hunts.mjs [goku|vegeta] [segundos] [semente] [area|namek|vegeta]
// Executa o Game em memória com nível fixo. Cada linha JSON é uma rodada e suas projeções.
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG, ZONES, lugar } from '../public/shared/nucleo/config.mjs';
import { bagWeight } from '../public/shared/nucleo/characters.mjs';
import { NOVOS_ITENS, SET_INICIAL, dropsEspecificos } from '../public/shared/sistemas/catalogo-itens.mjs';
import { ITENS_NEGOCIAVEIS } from '../public/shared/sistemas/itens-negociaveis.mjs';
import { RECOMPENSAS_MOBS, fracaoCristalAzul } from '../public/shared/sistemas/recompensas-mobs.mjs';
import { resumo } from '../public/shared/sistemas/hunt-analyzer.mjs';

function sorteador(semente) {
  return () => (semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function equipamentoDeReferencia(level) {
  const candidatos = Object.values(NOVOS_ITENS).filter(item => item.slot && item.nivel <= level &&
    (item.origem.recompensa === 'patrulha-inicial' || (item.origem.drops && ['comum', 'incomum', 'raro'].includes(item.raridade))));
  const equipamentos = { ...SET_INICIAL };
  for (const item of candidatos.sort((a,b) => a.nivel - b.nivel || a.defesa - b.defesa)) equipamentos[item.slot] = item.id;
  return equipamentos;
}

const valorNpc = itens => itens.reduce((total, { id, quantidade }) => total + ITENS_NEGOCIAVEIS[id].precoNpc * quantidade, 0);
const quantidades = itens => Object.fromEntries(itens.map(({ id, quantidade }) => [id, quantidade]));
const material = ({ id }) => !ITENS_NEGOCIAVEIS[id].slot;
const totalItens = itens => itens.reduce((total, item) => total + item.quantidade, 0);

function projetar(r, p, segundos, pesoInicial, horas) {
  const fator = horas * 3600 / segundos;
  const recolha = totalItens(r.loot.filter(material)) / totalItens(r.drops.filter(material)) || 0;
  const esperados = {};
  const adicionar = (id, qtd) => { esperados[id] = (esperados[id] ?? 0) + qtd * fator * recolha; };
  for (const { tipo, quantidade } of r.abates) {
    const fracaoCristal = fracaoCristalAzul(tipo);
    adicionar('scrap', quantidade * p.stats.lootChance * (1 - fracaoCristal));
    adicionar('cristal-azul', quantidade * p.stats.lootChance * fracaoCristal);
    adicionar('seed15', quantidade * RECOMPENSAS_MOBS.chanceSemente15);
    for (const { item, chance } of dropsEspecificos(tipo)) {
      if (!NOVOS_ITENS[item].slot) adicionar(item, quantidade * chance);
    }
  }
  const pesoLoot = bagWeight(esperados);
  const espaco = Math.max(0, p.stats.capacity - pesoInicial);
  const fracaoNoLimite = pesoLoot > 0 ? Math.min(1, espaco / pesoLoot) : 1;
  const totalMateriais = Object.entries(esperados).reduce((total,[id,qtd]) => total + ITENS_NEGOCIAVEIS[id].precoNpc * qtd, 0);
  const suprimentos = quantidades(r.supplies);
  // A comida dura cinco minutos. Uma ativação numa amostra curta não multiplica o gasto para além disso.
  const comida = Math.min(Math.ceil(horas * 3600 / CONFIG.foodDuration), Math.ceil((suprimentos.food ?? 0) * fator));
  const custo = CONFIG.prices.food * comida + (r.gastos - CONFIG.prices.food * (suprimentos.food ?? 0)) * fator;
  return {
    horas, custoReposicao: Math.round(custo),
    lucroSemLimiteDeCarga: Math.round(r.zeni * fator + totalMateriais - custo),
    lucroComLimiteDePeso: Math.round(r.zeni * fator + totalMateriais * fracaoNoLimite - custo),
    pesoSeRecolherTudo: Math.round(pesoLoot * 10) / 10,
    minutosAteLimiteDePeso: pesoLoot > 0 ? Math.round(horas * 60 * espaco / pesoLoot) : null
  };
}

const [vocacao = 'goku', duracao = '90', semente = '12345', filtro] = process.argv.slice(2);
const segundos = Number(duracao);
const zonas = ZONES.filter(z => z.nivel && (!filtro || z.id === filtro || z.planet === filtro));
if (!['goku', 'vegeta'].includes(vocacao) || !Number.isInteger(segundos) || segundos < 1 || !Number.isSafeInteger(Number(semente)) || !zonas.length) {
  throw Error('Informe vocação, duração em segundos, semente numérica e, opcionalmente, uma hunt ou planeta.');
}
for (const zona of zonas) {
  for (const perfil of ['equipado', 'sem-equipamento', 'abaixo']) {
    if (perfil === 'abaixo' && zona.nivel[0] === 1) continue;
    const nivel = perfil === 'abaixo' ? Math.max(1, Math.floor(zona.nivel[0] * .78)) : Math.round((zona.nivel[0] + zona.nivel[1]) / 2);
    const game = new Game({ now: 1000, random: sorteador(Number(semente)), randomCombat: sorteador(Number(semente) + 10) });
    for (const [id,mob] of game.mobs) if (mob.area !== zona.id) game.mobs.delete(id);
    game.awardXp = () => {}; // O nível permanece igual nos três perfis e em todas as repetições.
    const equipamentos = perfil === 'equipado' ? equipamentoDeReferencia(nivel) : {};
    const inventory = { food: Math.ceil(segundos / CONFIG.foodDuration) + 2, ki: 22, seed15: 6 };
    const p = game.addPlayer('p', 'Simulação', { level: nivel, vocacao, equipamentos, inventory, autoFood: true, autoKi: true, autoSeed: true });
    game.levar(p, lugar(zona.id));
    game.action(p.id, { type: 'hunt', enabled: true });
    let menorHp = 1, segundosSemEspaco = 0;
    const pesoInicial = bagWeight(p.inventory);
    for (let passo = 0; passo < segundos * 10; passo++) {
      game.tick(.1);
      menorHp = Math.min(menorHp, p.hp / p.stats.hp);
      if (bagWeight(p.inventory) >= p.stats.capacity - .03) segundosSemEspaco += .1;
      if (p.hp <= 0) break; // A morte para a caça real. Não reiniciamos o personagem.
    }
    const r = resumo(p);
    const tempo = Math.round(game.time - 1000);
    console.log(JSON.stringify({
      zona: zona.id, perfil, vocacao, nivel, semente: Number(semente), tempo,
      defesa: p.stats.defense, kiPorSegundo: p.stats.kiEquipamento ?? 0, dano: r.danoRecebido, menorHp: Math.round(menorHp * 100),
      abates: r.totalAbates, porMob: Object.fromEntries(r.abates.map(m => [m.tipo,m.quantidade])), mortes: r.totalMortes,
      zeni: r.zeni, suprimentos: quantidades(r.supplies), valorLoot: r.valorLoot, valorMateriais: valorNpc(r.loot.filter(material)),
      gastos: r.gastos, saldo: r.saldo, pesoFinal: Math.round(bagWeight(p.inventory)*100)/100, segundosSemEspaco: Math.round(segundosSemEspaco),
      projecoes: r.totalMortes || !r.totalAbates || segundosSemEspaco > 0 ? [] : [1,4,8].map(horas => projetar(r,p,tempo,pesoInicial,horas))
    }));
  }
}
