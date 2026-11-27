import { restaurarAbatesBestiario } from '../sistemas/progresso-bestiario.mjs';
import { FORMAS_BOO } from '../tecnicas/formas.mjs';
import { DURACAO_EXTENSOR, ITENS_PREMIUM } from '../sistemas/itens-premium.mjs';
import { restaurarBonusPremium } from '../sistemas/bonus-premium.mjs';
import { CONSUMIVEIS_LOOT } from '../tecnicas/consumiveis-loot.mjs';
import { NOVOS_ITENS, SET_INICIAL } from '../sistemas/catalogo-itens.mjs';
import {montariaValida} from '../sistemas/montarias.mjs';
import {restaurarBattlePass} from '../sistemas/battle-pass.mjs';
import {hotkeysConsumiveisValidas} from '../tecnicas/consumiveis-hotkeys.mjs';
import { validarCombo } from '../tecnicas/combo-auto-hunt.mjs';
import {barraPadrao,barraValida,atualizarBarraPadrao,tecnicaDaVocacao} from '../tecnicas/barra-tecnicas.mjs';
import {vocacaoDoPersonagem} from '../sistemas/vocacoes.mjs';
import {preferenciasValidas} from '../sistemas/preferencias.mjs';
import {restaurarMissoes} from '../sistemas/missoes.mjs';
import {restaurarSagaCell} from '../sistemas/saga-cell.mjs';
import {restaurarSagaAndroides} from '../sistemas/saga-androides.mjs';
// Personagem jogável (Goku) e sua progressão. Novos personagens jogáveis
// podem ser descritos aqui no futuro, sem mexer na lógica de combate.
import { clamp } from './math.mjs';
import { CONFIG, PLANETS, GODMODE } from './config.mjs';
import { restaurarNovidades } from '../sistemas/novidades.mjs';
import { CURA } from '../tecnicas/cura.mjs';
import { xpForLevel } from '../sistemas/progressao.mjs';
export { xpForLevel } from '../sistemas/progressao.mjs';

export function statsFor(level, vocacao = 'goku', equipamentos, bonusCapacidade = 0) {
  const stats = vocacaoDoPersonagem(vocacao).atributos(level);
  if (bonusCapacidade) stats.capacity *= 1 + bonusCapacidade / 100;
  for (const id of Object.values(equipamentos ?? {})) {
    const item = NOVOS_ITENS[id];
    if (!item || item.nivel > level) continue;
    stats.defense += item.defesa;
    stats.attack += item.ataque;
    stats.kiEquipamento = (stats.kiEquipamento ?? 0) + item.kiPorSegundo;
  }
  return stats;
}

export function atualizarAtributosEquipamento(p) {
  const { attack, defense, kiEquipamento = 0 } = statsFor(p.level, p.vocacao, p.equipamentos);
  Object.assign(p.stats, { attack, defense, kiEquipamento });
}


export function bonusDoExtensor(p) {
  return ITENS_PREMIUM[p.equipamentos.mochila]?.bonusCapacidade ?? 0;
}

export function atualizarCapacidade(p) {
  const base = statsFor(p.level, p.vocacao, null, bonusDoExtensor(p)).capacity;
  const bonus = p.bonusPremium;
  if (bonus.capacidadeRetida) {
    const retida = Math.min(bonus.capacidadeRetida, bagWeight(p.inventory));
    const baseReal = p.levelReal == null ? base : statsFor(p.levelReal, p.vocacao, null, bonusDoExtensor(p)).capacity;
    bonus.capacidadeRetida = retida > baseReal ? retida : 0;
  }
  p.stats.capacity = p.godmode && p.godmodeOptions.capacityInfinite
    ? GODMODE_CAPACITY : Math.max(base, bonus.capacidadeRetida);
}

export function reterCapacidadeDoExtensor(p) {
  const capacidade = statsFor(p.levelReal ?? p.level, p.vocacao, null, bonusDoExtensor(p)).capacity;
  p.bonusPremium.capacidadeRetida = Math.max(p.bonusPremium.capacidadeRetida, capacidade);
}

export function encerrarExtensor(p) {
  const id = p.equipamentos.mochila;
  if (id) {
    reterCapacidadeDoExtensor(p);
    delete p.equipamentos.mochila;
    delete p.bonusPremium.extensores[id];
  }
  atualizarCapacidade(p);
}

// Valores "praticamente infinitos" usados pelo god mode de teste.
export const GODMODE_ZENI = 999999999;
export const GODMODE_CAPACITY = 999999999999;
export const GODMODE_PADRAO = Object.freeze({ level: CONFIG.progression.nivelMaximo, hpInfinite: true, kiInfinite: true, zeniInfinite: true, capacityInfinite: true, cooldownNormal: false, velocidadeMaxima: false });

export function opcoesGodmodeValidas(valor = {}) {
  const limite = CONFIG.progression.nivelMaximo;
  const level = Number(valor.level);
  return {
    level: Number.isSafeInteger(level) ? clamp(level, 1, limite) : GODMODE_PADRAO.level,
    hpInfinite: valor.hpInfinite !== false,
    kiInfinite: valor.kiInfinite !== false,
    zeniInfinite: valor.zeniInfinite !== false,
    capacityInfinite: valor.capacityInfinite !== false,
    cooldownNormal: valor.cooldownNormal === true,
    velocidadeMaxima: valor.velocidadeMaxima === true
  };
}

// God Mode de teste permite escolher o nível e ativar recursos infinitos separadamente.
// Ao ligar, guarda os valores reais e os restaura ao desligar; itens de teste permanecem na mochila.
export function aplicarGodmode(p, on, opcoes = p.godmodeOptions) {
  if (on) {
    if (p.levelReal == null) p.levelReal = p.level;
    if (p.xpReal == null) p.xpReal = p.xp;
    if (p.zeniReal == null) p.zeniReal = p.zeni;
    if (p.hpReal == null) p.hpReal = p.hp;
    if (p.kiReal == null) p.kiReal = p.ki;
    p.godmodeOptions = opcoesGodmodeValidas(opcoes);
    p.godmode = true; p.level = p.godmodeOptions.level; p.xp = 0;
    p.stats = statsFor(p.level, p.vocacao, p.equipamentos);
    atualizarCapacidade(p);
    atualizarBarraPadrao(p);
    aplicarOpcoesGodmode(p);
  } else {
    p.godmode = false;
    if (p.levelReal != null) p.level = p.levelReal;
    if (p.xpReal != null) p.xp = p.xpReal;
    if (p.zeniReal != null) p.zeni = p.zeniReal;
    p.stats = statsFor(p.level, p.vocacao, p.equipamentos);
    atualizarCapacidade(p);
    atualizarBarraPadrao(p);
    p.hp = Math.min(p.hpReal != null ? p.hpReal : p.hp, p.stats.hp);
    p.ki = Math.min(p.kiReal != null ? p.kiReal : p.ki, p.stats.ki);
    p.levelReal = null; p.xpReal = null; p.zeniReal = null; p.hpReal = null; p.kiReal = null;
  }
}

export function configurarGodmode(p, opcoes) {
  p.godmodeOptions = opcoesGodmodeValidas(opcoes);
  if (!p.godmode) return;
  const hpRatio = p.stats.hp > 0 ? p.hp / p.stats.hp : 1;
  const kiRatio = p.stats.ki > 0 ? p.ki / p.stats.ki : 1;
  p.level = p.godmodeOptions.level; p.xp = 0;
  p.stats = statsFor(p.level, p.vocacao, p.equipamentos);
  atualizarCapacidade(p);
  atualizarBarraPadrao(p);
  p.hp = p.godmodeOptions.hpInfinite ? p.stats.hp : Math.min(p.stats.hp, Math.round(p.stats.hp * hpRatio));
  p.ki = p.godmodeOptions.kiInfinite ? p.stats.ki : Math.min(p.stats.ki, Math.round(p.stats.ki * kiRatio));
  if (p.godmodeOptions.capacityInfinite) p.stats.capacity = GODMODE_CAPACITY;
  p.zeni = p.godmodeOptions.zeniInfinite ? GODMODE_ZENI : (p.zeniReal ?? p.zeni);
}

function aplicarOpcoesGodmode(p) {
  const opcoes = p.godmodeOptions;
  p.hp = opcoes.hpInfinite ? p.stats.hp : Math.min(p.hp, p.stats.hp);
  p.ki = opcoes.kiInfinite ? p.stats.ki : Math.min(p.ki, p.stats.ki);
  if (opcoes.capacityInfinite) p.stats.capacity = GODMODE_CAPACITY;
  p.zeni = opcoes.zeniInfinite ? GODMODE_ZENI : (p.zeniReal ?? p.zeni);
}
export function bagWeight(inv) {
  return Object.entries(inv).reduce((sum, [id, qtd]) => sum + (Object.hasOwn(CONFIG.itemWeights, id) ? qtd * CONFIG.itemWeights[id] : 0), 0);
}

// Layout dos espaços da mochila. O inventário por TIPO (p.inventory) continua a fonte de verdade de tudo
// (peso, loja, loot, venda, missões...); os slots só distribuem esses totais pelos espaços visíveis, para
// permitir reorganizar, dividir e descartar pilhas. Cada slot é null ou { item, qty }. Invariante: a soma de
// qty de cada tipo nos slots é igual ao total do inventário daquele tipo.
export function slotsPadrao(inventory, n = CONFIG.mochilaSlots) {
  const slots = Array.from({ length: n }, () => null);
  let i = 0;
  for (const item of Object.keys(inventory)) {
    if (!Object.hasOwn(CONFIG.itemWeights, item)) continue;
    const qtd = Math.floor(inventory[item] || 0);
    if (qtd > 0 && i < n) slots[i++] = { item, qty: qtd };
  }
  return slots;
}
// Mantém os slots coerentes com os totais quando o estoque muda (loot, uso, compra, venda, descarte...).
// Preserva ao máximo o arranjo do jogador: só acrescenta o que faltou (no primeiro slot do tipo, senão num
// vazio) e tira o que sobrou (dos últimos para os primeiros). Entradas inválidas viram vazio.
export function reconciliarSlots(p, n = CONFIG.mochilaSlots) {
  const slots = (Array.isArray(p.slots) ? p.slots : []).slice(0, n)
    .map(s => s && Object.hasOwn(CONFIG.itemWeights, s.item) && p.inventory[s.item] > 0 && Math.floor(s.qty) > 0
      ? { item: s.item, qty: Math.floor(s.qty) } : null);
  while (slots.length < n) slots.push(null);
  for (const [item, quantidade] of Object.entries(p.inventory)) {
    const total = Math.floor(quantidade);
    if (!(total > 0) || !Object.hasOwn(CONFIG.itemWeights, item)) continue;
    const soma = slots.reduce((t, s) => t + (s && s.item === item ? s.qty : 0), 0);
    if (soma === total) continue;
    if (soma < total) {
      let i = slots.findIndex(s => s?.item === item);
      if (i < 0) i = slots.findIndex(s => !s);
      if (i < 0) continue;
      slots[i] = { item, qty: (slots[i]?.qty || 0) + (total - soma) };
    } else {
      let excesso = soma - total;
      for (let i = n - 1; i >= 0 && excesso > 0; i--) {
        if (slots[i]?.item !== item) continue;
        const tira = Math.min(excesso, slots[i].qty); slots[i].qty -= tira; excesso -= tira;
        if (slots[i].qty <= 0) slots[i] = null;
      }
    }
  }
  p.slots = slots;
  return slots;
}
// Confere entradas e trocas antes de efetuar a operação sobre o inventário real.
export function mochilaComporta(p, entradas, retiradas = {}) {
  const inventory = { ...p.inventory };
  for (const [id, qtd] of Object.entries(retiradas)) inventory[id] -= qtd;
  for (const [id, qtd] of Object.entries(entradas)) {
    inventory[id] = (inventory[id] || 0) + qtd;
    if (inventory[id] > 99999) return false;
  }
  if (bagWeight(inventory) > p.stats.capacity + 0.0001) return false;
  const slots = reconciliarSlots({ inventory, slots: reconciliarSlots({ inventory: p.inventory, slots: p.slots }) });
  return Object.keys(entradas).every(id => slots.some(s => s?.item === id));
}

// Move/junta/troca pilhas entre dois espaços (arrastar). É aplicado sobre os slots ATUAIS do servidor (depois
// de reconciliar), então não sofre corrida com loot/uso que mudam os totais enquanto o jogador arrasta. Não
// altera os totais do inventário, só a distribuição: vazio recebe, mesmo item empilha, item diferente troca.
export function moverSlotMochila(p, de, para, n = CONFIG.mochilaSlots) {
  if (!Number.isInteger(de) || !Number.isInteger(para) || de < 0 || para < 0 || de >= n || para >= n || de === para) return false;
  reconciliarSlots(p);
  const slots = p.slots, o = slots[de]; if (!o) return false;
  const alvo = slots[para];
  if (!alvo) { slots[para] = o; slots[de] = null; }
  else if (alvo.item === o.item) { alvo.qty += o.qty; slots[de] = null; }
  else { slots[de] = alvo; slots[para] = o; }
  return true;
}
// Divide uma pilha: tira `qtd` do slot `de` e põe num espaço vazio (pilha nova do mesmo item). Só layout,
// os totais não mudam. Falha se qtd for inválida (precisa sobrar pelo menos 1 no original) ou não houver vazio.
export function dividirSlotMochila(p, de, qtd, n = CONFIG.mochilaSlots) {
  if (!Number.isInteger(de) || de < 0 || de >= n) return false;
  reconciliarSlots(p);
  const slots = p.slots, o = slots[de]; if (!o) return false;
  const mover = Math.floor(Number(qtd));
  if (!Number.isFinite(mover) || mover < 1 || mover >= o.qty) return false;
  const vazio = slots.findIndex(s => !s); if (vazio < 0) return false;
  slots[vazio] = { item: o.item, qty: mover }; o.qty -= mover;
  return true;
}
// Descarta a pilha de UM espaço específico: reduz o total do inventário pela qty daquele slot e esvazia o
// espaço. Mira o slot (não o tipo), então divide/descarta funcionam com o mesmo item em dois quadrados.
export function descartarSlotMochila(p, de, n = CONFIG.mochilaSlots) {
  if (!Number.isInteger(de) || de < 0 || de >= n) return false;
  reconciliarSlots(p);
  const slots = p.slots, o = slots[de]; if (!o) return false;
  p.inventory[o.item] = Math.max(0, Math.floor(p.inventory[o.item] || 0) - o.qty);
  slots[de] = null;
  reconciliarSlots(p);
  return true;
}

// Inventário inicial que o personagem recebe ao entrar.
const STARTING_INVENTORY = { food: 5, ki: 4, seed15: 2, seed30: 1, seed50: 1, seed100: 1 };
// Versão da shape do save do personagem. Suba quando mudar a estrutura e adicione a migração em
// migrarSave, para não quebrar personagens já salvos (item 4 do backlog de arquitetura).
export const SAVE_SCHEMA = 1;
// Migra um save antigo para a shape atual. Cada bloco sobe UMA versão, em ordem. Saves sem `schema`
// são a versão 0 (o formato atual já é a 1, então por ora só carimba). Muta e devolve o próprio objeto.
export function migrarSave(saved) {
  if (!saved || typeof saved !== 'object') return saved;
  let versao = Number.isInteger(saved.schema) ? saved.schema : 0;
  // Exemplo para o futuro:  if (versao < 2) { /* transforma v1 → v2 */ versao = 2; }
  saved.schema = Math.max(versao, SAVE_SCHEMA);
  return saved;
}

// Cria o estado completo de um jogador, aplicando o progresso salvo quando houver.
export function createPlayer(id, name = 'Guerreiro', saved = null, now = 0) {
  if (saved) saved = migrarSave(saved); // sobe saves antigos para a shape atual antes de usar
  const level = clamp(Math.floor(Number(saved?.level) || 1), 1, CONFIG.progression.nivelMaximo);
  const vocacao = vocacaoDoPersonagem(saved);
  const equipamentos = Object.fromEntries(Object.entries(saved?.equipamentos ?? {}).filter(([slot, id]) =>
    (NOVOS_ITENS[id]?.slot ?? ITENS_PREMIUM[id]?.slot) === slot));
  const inventory = { ...STARTING_INVENTORY };
  if (saved?.inventory) {
    for (const key of Object.keys(inventory)) inventory[key] = clamp(Math.floor(Number(saved.inventory[key]) || 0), 0, 99999);
    for (const key of Object.keys({ ...NOVOS_ITENS, ...ITENS_PREMIUM })) {
      // Cristais de dois estoques legados podem superar o limite de uma pilha de inventário.
      const limite = key === 'cristal-azul' ? 199998 : 99999;
      const qtd = clamp(Math.floor(Number(saved.inventory[key]) || 0), 0, limite);
      if (qtd > 0) inventory[key] = qtd;
    }
    const cristaisLegados = clamp(Math.floor(Number(saved.inventory.crystal) || 0), 0, 99999);
    if (cristaisLegados > 0) {
      inventory['cristal-azul'] = (inventory['cristal-azul'] ?? 0) + cristaisLegados;
    }
  }
  for (const [slotAntigo, id] of [['cinto', 'saia-freeza'], ['braco', 'faixa-treino']]) {
    if (saved?.equipamentos?.[slotAntigo] !== id) continue;
    const { slot } = NOVOS_ITENS[id];
    if (equipamentos[slot]) inventory[id] = (inventory[id] || 0) + 1;
    else equipamentos[slot] = id;
  }
  const entregasPremium = Object.fromEntries(Object.keys(ITENS_PREMIUM)
    .map(id => [id, saved?.entregasPremium?.[id]])
    .filter(([, quantidade]) => Number.isSafeInteger(quantidade) && quantidade > 0 && quantidade <= 99999));
  const personagemNovo = level === 1 && saved?.equipamentos == null && !saved?.inventory;
  const personagemExistente = Boolean(saved?.inventory && typeof saved.mercadoId === 'string');
  const jaPossuiPecaInicial = Object.values(SET_INICIAL).some(id => inventory[id] > 0 || Object.values(equipamentos).includes(id));
  if (!saved?.setInicialProcessado && !jaPossuiPecaInicial && (personagemNovo || personagemExistente)) {
    // A entrega preenche os encaixes livres, inclusive quando o inventário já excede seu peso.
    for (const [slot, id] of Object.entries(SET_INICIAL)) equipamentos[slot] ??= id;
  }
  const bonusPremium = restaurarBonusPremium(saved?.bonusPremium);
  if ([10, 20].includes(saved?.bonusPremium?.capacidade) && !equipamentos.mochila) {
    equipamentos.mochila = 'extensor-mochila-' + saved.bonusPremium.capacidade;
  }
  if (equipamentos.mochila) bonusPremium.extensores[equipamentos.mochila] ??= DURACAO_EXTENSOR;
  for (const id of Object.keys(bonusPremium.extensores)) {
    if (equipamentos.mochila !== id && !inventory[id]) delete bonusPremium.extensores[id];
  }
  const stats = statsFor(level, vocacao.id, equipamentos);
  const hotkeys=hotkeysConsumiveisValidas(saved?.hotkeysConsumiveis,saved?.seedSelected);
  const padrao = barraPadrao(hotkeys, saved?.seedSelected, level, 'base', vocacao.id);
  const possuiBarra = Array.isArray(saved?.barraTecnicas) && saved.barraTecnicas.length === 8;
  const barraSalva = possuiBarra ? barraValida(saved.barraTecnicas) : [...padrao];
  if (possuiBarra && vocacao.id === 'boo' && saved.barraPersonalizada !== true) {
    const anterior = ['skill:heal', 'skill:chocolateBeam', null, null, null, null, 'item:food', 'item:ki'];
    if (barraSalva.every((id, i) => id === anterior[i])) barraSalva.splice(0, 8, ...padrao);
  }
  if (possuiBarra && vocacao.id !== 'boo' && saved.barraPersonalizada !== true) {
    // Migra a ordem anterior apenas quando ela corresponde à barra padrão da vocação.
    const vegeta = vocacao.id === 'vegeta';
    const anterior = vegeta
      ? ['skill:heal', 'skill:galick', 'form:auto', null, 'skill:finalFlash', 'item:food', 'item:ki', null]
      : ['skill:heal', 'skill:kame', 'form:auto', 'skill:barrier', 'skill:genki', padrao[6], padrao[7], 'skill:ryuken'];
    const eraPadrao = barraSalva.every((id, i) => id === anterior[i]
      || (vegeta && i === 2 && (id === null || id === 'form:ssj'))
      || (vegeta && i === 4 && id === null)
      || (!vegeta && i === 1 && id === 'skill:superKamehameha'));
    const eraPadraoSemBigBang = vegeta && barraSalva.every((id, i) => id === (i === 2 ? null : padrao[i]));
    if (eraPadraoSemBigBang || (eraPadrao && (vegeta || saved.barraKameManual !== true))) barraSalva.splice(0, 8, ...padrao);
  }
  if (vocacao.id === 'vegeta') {
    const permitidas = new Set(['skill:heal', 'skill:galick', 'skill:finalFlash', 'skill:bigBangAttack']);
    for (let i = 0; i < barraSalva.length; i++) {
      const id = barraSalva[i];
      if (id?.startsWith('skill:') && !permitidas.has(id)) barraSalva[i] = null;
    }
  }
  for (let i = 0; i < barraSalva.length; i++) {
    const id = barraSalva[i];
    if (id && !tecnicaDaVocacao(id, vocacao.id)) barraSalva[i] = null;
    if ((id?.startsWith('form:') || ['skill:finalFlash', 'skill:bigBangAttack'].includes(id)) && !tecnicaDaVocacao(id, vocacao.id)) barraSalva[i] = null;
  }
  if (vocacao.id === 'vegeta' && barraSalva[2] === null && !barraSalva.some(id => id?.startsWith('form:'))) {
    // Barras antigas personalizadas usavam a tecla 3 como atalho de transformação.
    barraSalva[2] = 'form:auto';
  }
  // Saves anteriores não tinham este indicador: só uma barra diferente do padrão antigo revela edição manual.
  const barraPersonalizada=saved?.barraPersonalizada===true||(saved?.barraPersonalizada!==false&&Array.isArray(saved?.barraTecnicas)&&barraSalva.some((id,i)=>id!==padrao[i]));
  const barraKameManual=saved?.barraKameManual===true||(saved?.barraKameManual!==false&&Array.isArray(saved?.barraTecnicas)&&!['skill:kame','skill:superKamehameha'].includes(barraSalva[1]));
  const p = { montaria:montariaValida(saved?.montaria), montariaPreferida:montariaValida(saved?.montariaPreferida)||montariaValida(saved?.montaria)||'nimbus', battlePass:restaurarBattlePass(saved?.battlePass), id, mercadoId: typeof saved?.mercadoId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(saved.mercadoId) ? saved.mercadoId : id, name: String(name).trim().slice(0, 18) || 'Guerreiro', character:vocacao.personagem,vocacao:vocacao.id, level,
    bonusPremium, entregasPremium, vipAte: 0,
    levelReal: null, xpReal: null, zeniReal: null, hpReal: null, kiReal: null, godmode: false,
    // Preserve XP saved at the old level cap: it may exceed the former per-level threshold.
    xp: Number.isFinite(Number(saved?.xp)) ? clamp(Number(saved.xp), 0, Number.MAX_SAFE_INTEGER) : 0, stats,
    godmodeOptions: opcoesGodmodeValidas(saved?.godmodeOptions),
    x: PLANETS.terra.spawn.x, y: PLANETS.terra.spawn.y, planet: 'terra', area: null, seguroAte: 0,
    hp: clamp(saved?.hp == null ? stats.hp : Number(saved.hp), 1, stats.hp),
    ki: clamp(saved?.ki == null ? stats.ki : Number(saved.ki), 0, stats.ki),
    zeni: clamp(Number(saved?.zeni ?? 200), 0, 9999999), inventory, equipamentos, kills: Number(saved?.kills) || 0,
    input: { x: 0, y: 0 }, facing: { x: 1, y: 0 }, aim: null, inputAt: now,
    bestiarioAbates: restaurarAbatesBestiario(saved?.bestiarioAbates), bestiarioRevisao: 0,
    autoAttack: false, autoSkills: false, autoHunt: false, targetId: null,
    comboAutoHunt: validarCombo(saved?.comboAutoHunt, vocacao.id),
    hotkeysConsumiveis:hotkeys,barraPersonalizada,barraKameManual,barraTecnicas:barraSalva,
    moving: false, moveTo: null, seedSelected: CONFIG.seedPotencies.includes(saved?.seedSelected) ? saved.seedSelected : 15, foodUntil: Number(saved?.foodUntil) || 0, foodId: CONSUMIVEIS_LOOT[saved?.foodId]?.tipo === 'comida' ? saved.foodId : 'food',
    seedReady: Number(saved?.seedReady) || 0, kiReady: Number(saved?.kiReady) || 0,
    basicReady: 0, shotReady: 0, kameReady: 0, galickReady: 0, chocolateBeamReady: 0, finalFlashReady: 0, bigBangAttackReady: 0, superKameReady: 0, ryukenReady: 0, dashReady: 0, dashUntil: 0, charge: null,
    healReady: Number.isFinite(saved?.healReady) ? Math.max(0, saved.healReady) : 0,
    autoHeal: saved?.autoHeal !== false,
    healThreshold: Number.isInteger(saved?.healThreshold) && saved.healThreshold >= 1 && saved.healThreshold <= 100 ? saved.healThreshold : CURA.limitePadrao,
    kiThreshold: Number.isInteger(saved?.kiThreshold) && saved.kiThreshold >= 1 && saved.kiThreshold <= 100 ? saved.kiThreshold : 25,
    energyPotionThreshold: Number.isInteger(saved?.energyPotionThreshold) && saved.energyPotionThreshold >= 1 && saved.energyPotionThreshold <= 100 ? saved.energyPotionThreshold : 50,
    seedThreshold: Number.isInteger(saved?.seedThreshold) && saved.seedThreshold >= 1 && saved.seedThreshold <= 100 ? saved.seedThreshold : 30,
    barrierReady: 0, barrierUntil: 0, genkiReady: 0,
    // Forma transitória única; o alias mantém os consumidores antigos de SSJ compatíveis.
    forma: 'base', formaAte: 0, get transformed() { return ['ssj', 'ssj2', 'ssj3', 'majin', 'ssj4', 'ssjGod', 'ssjBlue', 'ultraEgo', 'gogeta', 'vegito'].includes(this.forma) || (this.vocacao === 'boo' && FORMAS_BOO.some(f => f.forma === this.forma)); },
    set transformed(ativa) { this.forma = ativa ? 'ssj' : 'base'; },
    respawnAt: 0, connected: true, autoFood: saved?.autoFood !== false, autoKi: saved?.autoKi === true, autoEnergyPotion: saved?.autoEnergyPotion === true, autoSeed: saved?.autoSeed === true,
    // TODO (dev): jogador NOVO (sem preferências salvas) começa com a música DESLIGADA, só pra facilitar o teste.
    // Depois, restringir isso ao ambiente de desenvolvimento (voltar ao padrão com música ligada em produção). Ver memória "onde paramos".
    correioResgatadas:(Array.isArray(saved?.correioResgatadas)?saved.correioResgatadas:[]).filter(id=>typeof id==='string'&&id.length<=120),preferencias:preferenciasValidas(saved?.preferencias??{musicaAtiva:false}),sagaCell:restaurarSagaCell(saved?.sagaCell),sagaAndroides:restaurarSagaAndroides(saved?.sagaAndroides),missoes:restaurarMissoes(saved?.missoes),
    novidades: restaurarNovidades(saved?.novidades),
    lastBagNotice: 0, bossKills: Number(saved?.bossKills) || 0 };
  // Layout dos espaços da mochila: restaura o do save (sanitizado em reconciliarSlots) ou gera o padrão.
  p.slots = Array.isArray(saved?.slots)
    ? saved.slots.map(slot => slot?.item === 'crystal' ? { ...slot, item: 'cristal-azul' } : slot)
    : slotsPadrao(inventory);
  reconciliarSlots(p);
  atualizarCapacidade(p);
  p.skin = vocacao.id === 'goku' && saved?.skin === 'natalino' ? 'natalino' : 'base';
  if (saved?.godmode != null ? !!saved.godmode : GODMODE) aplicarGodmode(p, true);
  atualizarBarraPadrao(p);
  return p;
}

// Campos persistidos no save do servidor.
export function exportPlayer(p) {
  return { schema: SAVE_SCHEMA, skin:p.skin, montaria:montariaValida(p.montaria), montariaPreferida:montariaValida(p.montariaPreferida)||'nimbus', battlePass:restaurarBattlePass(p.battlePass), mercadoId:p.mercadoId,character:p.character,vocacao:p.vocacao, name: p.name, level: p.godmode && p.levelReal != null ? p.levelReal : p.level, xp: p.godmode && p.xpReal != null ? p.xpReal : p.xp, x: p.x, y: p.y,
    hp: p.godmode && p.hpReal != null ? p.hpReal : p.hp, ki: p.godmode && p.kiReal != null ? p.kiReal : p.ki,
    zeni: p.godmode && p.zeniReal != null ? p.zeniReal : p.zeni, godmode: p.godmode, godmodeOptions:opcoesGodmodeValidas(p.godmodeOptions),
    bestiarioAbates: { ...p.bestiarioAbates },
    correioResgatadas:[...p.correioResgatadas],preferencias:preferenciasValidas(p.preferencias),missoes:structuredClone(p.missoes),sagaCell:structuredClone(p.sagaCell),sagaAndroides:structuredClone(p.sagaAndroides),
    novidades: restaurarNovidades(p.novidades),
    bonusPremium: restaurarBonusPremium(p.bonusPremium), entregasPremium: { ...p.entregasPremium },
    hotkeysConsumiveis:hotkeysConsumiveisValidas(p.hotkeysConsumiveis,p.seedSelected),barraPersonalizada:!!p.barraPersonalizada,barraKameManual:!!p.barraKameManual,barraTecnicas:barraValida(p.barraTecnicas),inventory: p.inventory, equipamentos: { ...p.equipamentos }, setInicialProcessado: true, slots: p.slots, kills: p.kills, bossKills: p.bossKills,
    foodUntil: p.foodUntil, foodId: p.foodId, seedReady: p.seedReady, kiReady: p.kiReady,
    healReady: p.healReady, autoHeal: p.autoHeal, healThreshold: p.healThreshold,
    kiThreshold: p.kiThreshold, energyPotionThreshold: p.energyPotionThreshold, seedThreshold: p.seedThreshold, seedSelected: p.seedSelected,
    autoFood: p.autoFood, autoKi: p.autoKi, autoEnergyPotion: p.autoEnergyPotion, autoSeed: p.autoSeed, comboAutoHunt: p.comboAutoHunt };
}
