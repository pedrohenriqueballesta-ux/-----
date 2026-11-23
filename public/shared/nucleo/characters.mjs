import {montariaValida} from '../sistemas/montarias.mjs';
import {restaurarBattlePass} from '../sistemas/battle-pass.mjs';
import {hotkeysConsumiveisValidas} from '../tecnicas/consumiveis-hotkeys.mjs';
import {barraPadrao,barraValida,atualizarBarraPadrao,tecnicaDaVocacao} from '../tecnicas/barra-tecnicas.mjs';
import {vocacaoDoPersonagem} from '../sistemas/vocacoes.mjs';
import {preferenciasValidas} from '../sistemas/preferencias.mjs';
import {restaurarMissoes} from '../sistemas/missoes.mjs';
// Personagem jogável (Goku) e sua progressão. Novos personagens jogáveis
// podem ser descritos aqui no futuro, sem mexer na lógica de combate.
import { clamp } from './math.mjs';
import { CONFIG, PLANETS, GODMODE } from './config.mjs';
import { restaurarNovidades } from '../sistemas/novidades.mjs';
import { CURA } from '../tecnicas/cura.mjs';
import { xpForLevel } from '../sistemas/progressao.mjs';
export { xpForLevel } from '../sistemas/progressao.mjs';

export function statsFor(level, vocacao = 'goku') {
  return vocacaoDoPersonagem(vocacao).atributos(level);
}

// Valores "praticamente infinitos" usados pelo god mode de teste.
export const GODMODE_ZENI = 999999999;
export const GODMODE_CAPACITY = 999999999999;
export const GODMODE_PADRAO = Object.freeze({ level: CONFIG.progression.nivelMaximo, hpInfinite: true, kiInfinite: true, zeniInfinite: true, capacityInfinite: true });

export function opcoesGodmodeValidas(valor = {}) {
  const limite = CONFIG.progression.nivelMaximo;
  const level = Number(valor.level);
  return {
    level: Number.isSafeInteger(level) ? clamp(level, 1, limite) : GODMODE_PADRAO.level,
    hpInfinite: valor.hpInfinite !== false,
    kiInfinite: valor.kiInfinite !== false,
    zeniInfinite: valor.zeniInfinite !== false,
    capacityInfinite: valor.capacityInfinite !== false
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
    p.stats = statsFor(p.level, p.vocacao);
    atualizarBarraPadrao(p);
    aplicarOpcoesGodmode(p);
  } else {
    p.godmode = false;
    if (p.levelReal != null) p.level = p.levelReal;
    if (p.xpReal != null) p.xp = p.xpReal;
    if (p.zeniReal != null) p.zeni = p.zeniReal;
    p.stats = statsFor(p.level, p.vocacao);
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
  p.stats = statsFor(p.level, p.vocacao);
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
  return Object.entries(CONFIG.itemWeights).reduce((sum, pair) => sum + (inv[pair[0]] || 0) * pair[1], 0);
}

// Layout dos espaços da mochila. O inventário por TIPO (p.inventory) continua a fonte de verdade de tudo
// (peso, loja, loot, venda, missões...); os slots só distribuem esses totais pelos espaços visíveis, para
// permitir reorganizar, dividir e descartar pilhas. Cada slot é null ou { item, qty }. Invariante: a soma de
// qty de cada tipo nos slots é igual ao total do inventário daquele tipo.
export function slotsPadrao(inventory, n = CONFIG.mochilaSlots) {
  const slots = Array.from({ length: n }, () => null);
  let i = 0;
  for (const item of Object.keys(CONFIG.itemWeights)) {
    const qtd = Math.floor(inventory[item] || 0);
    if (qtd > 0 && i < n) slots[i++] = { item, qty: qtd };
  }
  return slots;
}
// Mantém os slots coerentes com os totais quando o estoque muda (loot, uso, compra, venda, descarte...).
// Preserva ao máximo o arranjo do jogador: só acrescenta o que faltou (no primeiro slot do tipo, senão num
// vazio) e tira o que sobrou (dos últimos para os primeiros). Entradas inválidas viram vazio.
export function reconciliarSlots(p, n = CONFIG.mochilaSlots) {
  let slots = (Array.isArray(p.slots) ? p.slots : []).slice(0, n)
    .map(s => s && Object.hasOwn(CONFIG.itemWeights, s.item) && Math.floor(s.qty) > 0 ? { item: s.item, qty: Math.floor(s.qty) } : null);
  while (slots.length < n) slots.push(null);
  for (const item of Object.keys(CONFIG.itemWeights)) {
    const total = Math.floor(p.inventory[item] || 0);
    const soma = slots.reduce((t, s) => t + (s && s.item === item ? s.qty : 0), 0);
    if (soma === total) continue;
    if (total <= 0) { for (let i = 0; i < n; i++) if (slots[i]?.item === item) slots[i] = null; continue; }
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
const STARTING_INVENTORY = { food: 5, ki: 4, seed15: 2, seed30: 1, seed50: 1, seed100: 1, scrap: 0, crystal: 0 };

// Cria o estado completo de um jogador, aplicando o progresso salvo quando houver.
export function createPlayer(id, name = 'Guerreiro', saved = null, now = 0) {
  const level = clamp(Math.floor(Number(saved?.level) || 1), 1, CONFIG.progression.nivelMaximo);
  const vocacao = vocacaoDoPersonagem(saved);
  const stats = statsFor(level, vocacao.id);
  const inventory = { ...STARTING_INVENTORY };
  if (saved?.inventory) for (const key of Object.keys(inventory)) inventory[key] = clamp(Math.floor(Number(saved.inventory[key]) || 0), 0, 99999);
  const hotkeys=hotkeysConsumiveisValidas(saved?.hotkeysConsumiveis,saved?.seedSelected);
  const padrao = barraPadrao(hotkeys, saved?.seedSelected, level, 'base', vocacao.id);
  const possuiBarra = Array.isArray(saved?.barraTecnicas) && saved.barraTecnicas.length === 8;
  const barraSalva = possuiBarra ? barraValida(saved.barraTecnicas) : [...padrao];
  if (possuiBarra && saved.barraPersonalizada !== true) {
    // Migra a ordem anterior apenas quando ela corresponde à barra padrão da vocação.
    const vegeta = vocacao.id === 'vegeta';
    const anterior = vegeta
      ? ['skill:heal', 'skill:galick', 'form:auto', null, 'skill:finalFlash', 'item:food', 'item:ki', null]
      : ['skill:heal', 'skill:kame', 'form:auto', 'skill:barrier', 'skill:genki', padrao[6], padrao[7], 'skill:ryuken'];
    const eraPadrao = barraSalva.every((id, i) => id === anterior[i]
      || (vegeta && i === 2 && (id === null || id === 'form:ssj'))
      || (vegeta && i === 4 && id === null)
      || (!vegeta && i === 1 && id === 'skill:superKamehameha'));
    if (eraPadrao && (vegeta || saved.barraKameManual !== true)) barraSalva.splice(0, 8, ...padrao);
  }
  if (vocacao.id === 'vegeta') {
    const permitidas = new Set(['skill:heal', 'skill:galick', 'skill:finalFlash']);
    for (let i = 0; i < barraSalva.length; i++) {
      const id = barraSalva[i];
      if (id?.startsWith('skill:') && !permitidas.has(id)) barraSalva[i] = null;
    }
  }
  for (let i = 0; i < barraSalva.length; i++) {
    const id = barraSalva[i];
    if ((id?.startsWith('form:') || id === 'skill:finalFlash') && !tecnicaDaVocacao(id, vocacao.id)) barraSalva[i] = null;
  }
  if (vocacao.id === 'vegeta' && barraSalva[2] === null && !barraSalva.some(id => id?.startsWith('form:'))) {
    // Barras antigas personalizadas usavam a tecla 3 como atalho de transformação.
    barraSalva[2] = 'form:auto';
  }
  // Saves anteriores não tinham este indicador: só uma barra diferente do padrão antigo revela edição manual.
  const barraPersonalizada=saved?.barraPersonalizada===true||(saved?.barraPersonalizada!==false&&Array.isArray(saved?.barraTecnicas)&&barraSalva.some((id,i)=>id!==padrao[i]));
  const barraKameManual=saved?.barraKameManual===true||(saved?.barraKameManual!==false&&Array.isArray(saved?.barraTecnicas)&&!['skill:kame','skill:superKamehameha'].includes(barraSalva[1]));
  const p = { montaria:montariaValida(saved?.montaria), montariaPreferida:montariaValida(saved?.montariaPreferida)||montariaValida(saved?.montaria)||'nimbus', battlePass:restaurarBattlePass(saved?.battlePass), id, mercadoId: typeof saved?.mercadoId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(saved.mercadoId) ? saved.mercadoId : id, name: String(name).trim().slice(0, 18) || 'Guerreiro', character:vocacao.personagem,vocacao:vocacao.id, level,
    levelReal: null, xpReal: null, zeniReal: null, hpReal: null, kiReal: null, godmode: false,
    // Preserve XP saved at the old level cap: it may exceed the former per-level threshold.
    xp: Number.isFinite(Number(saved?.xp)) ? clamp(Number(saved.xp), 0, Number.MAX_SAFE_INTEGER) : 0, stats,
    godmodeOptions: opcoesGodmodeValidas(saved?.godmodeOptions),
    x: PLANETS.terra.spawn.x, y: PLANETS.terra.spawn.y, planet: 'terra', area: null, seguroAte: 0,
    hp: clamp(saved?.hp == null ? stats.hp : Number(saved.hp), 1, stats.hp),
    ki: clamp(saved?.ki == null ? stats.ki : Number(saved.ki), 0, stats.ki),
    zeni: clamp(Number(saved?.zeni ?? 200), 0, 9999999), inventory, kills: Number(saved?.kills) || 0,
    input: { x: 0, y: 0 }, facing: { x: 1, y: 0 }, aim: null, inputAt: now,
    autoAttack: false, autoSkills: false, autoHunt: false, targetId: null,
    hotkeysConsumiveis:hotkeys,barraPersonalizada,barraKameManual,barraTecnicas:barraSalva,
    moving: false, moveTo: null, seedSelected: CONFIG.seedPotencies.includes(saved?.seedSelected) ? saved.seedSelected : 15, foodUntil: Number(saved?.foodUntil) || 0,
    seedReady: Number(saved?.seedReady) || 0, kiReady: Number(saved?.kiReady) || 0,
    basicReady: 0, shotReady: 0, kameReady: 0, galickReady: 0, finalFlashReady: 0, superKameReady: 0, ryukenReady: 0, dashReady: 0, dashUntil: 0, charge: null,
    healReady: Number.isFinite(saved?.healReady) ? Math.max(0, saved.healReady) : 0,
    autoHeal: saved?.autoHeal !== false,
    healThreshold: Number.isInteger(saved?.healThreshold) && saved.healThreshold >= 1 && saved.healThreshold <= 100 ? saved.healThreshold : CURA.limitePadrao,
    kiThreshold: Number.isInteger(saved?.kiThreshold) && saved.kiThreshold >= 1 && saved.kiThreshold <= 100 ? saved.kiThreshold : 25,
    seedThreshold: Number.isInteger(saved?.seedThreshold) && saved.seedThreshold >= 1 && saved.seedThreshold <= 100 ? saved.seedThreshold : 30,
    barrierReady: 0, barrierUntil: 0, genkiReady: 0,
    // Forma transitória única; o alias mantém os consumidores antigos de SSJ compatíveis.
    forma: 'base', formaAte: 0, get transformed() { return ['ssj', 'ssj2', 'ssj3', 'majin', 'ssj4', 'ssjGod', 'ssjBlue', 'ultraEgo', 'gogeta', 'vegito'].includes(this.forma); },
    set transformed(ativa) { this.forma = ativa ? 'ssj' : 'base'; },
    respawnAt: 0, connected: true, autoFood: saved?.autoFood !== false, autoKi: saved?.autoKi === true, autoSeed: saved?.autoSeed === true,
    // TODO (dev): jogador NOVO (sem preferências salvas) começa com a música DESLIGADA, só pra facilitar o teste.
    // Depois, restringir isso ao ambiente de desenvolvimento (voltar ao padrão com música ligada em produção). Ver memória "onde paramos".
    correioResgatadas:(Array.isArray(saved?.correioResgatadas)?saved.correioResgatadas:[]).filter(id=>typeof id==='string'&&id.length<=120),preferencias:preferenciasValidas(saved?.preferencias??{musicaAtiva:false}),missoes:restaurarMissoes(saved?.missoes),
    novidades: restaurarNovidades(saved?.novidades),
    lastBagNotice: 0, bossKills: Number(saved?.bossKills) || 0 };
  // Layout dos espaços da mochila: restaura o do save (sanitizado em reconciliarSlots) ou gera o padrão.
  p.slots = Array.isArray(saved?.slots) ? saved.slots : slotsPadrao(inventory);
  reconciliarSlots(p);
  p.skin = vocacao.id !== 'vegeta' && saved?.skin === 'natalino' ? 'natalino' : 'base';
  if (saved?.godmode != null ? !!saved.godmode : GODMODE) aplicarGodmode(p, true);
  atualizarBarraPadrao(p);
  return p;
}

// Campos persistidos no save do servidor.
export function exportPlayer(p) {
  return { skin:p.skin, montaria:montariaValida(p.montaria), montariaPreferida:montariaValida(p.montariaPreferida)||'nimbus', battlePass:restaurarBattlePass(p.battlePass), mercadoId:p.mercadoId,character:p.character,vocacao:p.vocacao, name: p.name, level: p.godmode && p.levelReal != null ? p.levelReal : p.level, xp: p.godmode && p.xpReal != null ? p.xpReal : p.xp, x: p.x, y: p.y,
    hp: p.godmode && p.hpReal != null ? p.hpReal : p.hp, ki: p.godmode && p.kiReal != null ? p.kiReal : p.ki,
    zeni: p.godmode && p.zeniReal != null ? p.zeniReal : p.zeni, godmode: p.godmode, godmodeOptions:opcoesGodmodeValidas(p.godmodeOptions),
    correioResgatadas:[...p.correioResgatadas],preferencias:preferenciasValidas(p.preferencias),missoes:structuredClone(p.missoes),
    novidades: restaurarNovidades(p.novidades),
    hotkeysConsumiveis:hotkeysConsumiveisValidas(p.hotkeysConsumiveis,p.seedSelected),barraPersonalizada:!!p.barraPersonalizada,barraKameManual:!!p.barraKameManual,barraTecnicas:barraValida(p.barraTecnicas),inventory: p.inventory, slots: p.slots, kills: p.kills, bossKills: p.bossKills,
    foodUntil: p.foodUntil, seedReady: p.seedReady, kiReady: p.kiReady,
    healReady: p.healReady, autoHeal: p.autoHeal, healThreshold: p.healThreshold,
    kiThreshold: p.kiThreshold, seedThreshold: p.seedThreshold, seedSelected: p.seedSelected,
    autoFood: p.autoFood, autoKi: p.autoKi, autoSeed: p.autoSeed };
}
