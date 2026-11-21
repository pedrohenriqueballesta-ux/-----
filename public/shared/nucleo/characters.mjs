import {montariaValida} from '../sistemas/montarias.mjs';
import {restaurarBattlePass} from '../sistemas/battle-pass.mjs';
import {hotkeysConsumiveisValidas} from '../tecnicas/consumiveis-hotkeys.mjs';
import {barraPadrao,barraValida,atualizarBarraPadrao} from '../tecnicas/barra-tecnicas.mjs';
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
  const barraSalva=barraValida(saved?.barraTecnicas,hotkeys,saved?.seedSelected);
  if(vocacao.id==='vegeta') {
    const personalizada=saved?.barraPersonalizada===true || Array.isArray(saved?.barraTecnicas);
    const permitidos=new Set(['skill:heal','skill:ki','skill:galick','item:food','item:ki','item:seed15','item:seed30','item:seed50','item:seed100']);
    if(!personalizada) barraSalva.splice(0,8,...['skill:heal','skill:galick',null,null,null,'item:food','item:ki',null]);
    else for(let i=0;i<barraSalva.length;i++) if(barraSalva[i]&&barraSalva[i].startsWith('skill:')&&!permitidos.has(barraSalva[i])) barraSalva[i]=null;
  }
  // Saves anteriores não tinham este indicador: só uma barra diferente do padrão antigo revela edição manual.
  const barraPersonalizada=saved?.barraPersonalizada===true||(saved?.barraPersonalizada!==false&&Array.isArray(saved?.barraTecnicas)&&barraSalva.some((id,i)=>id!==barraPadrao(hotkeys,saved?.seedSelected,1,'base',vocacao)[i]));
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
    basicReady: 0, shotReady: 0, kameReady: 0, galickReady: 0, superKameReady: 0, ryukenReady: 0, dashReady: 0, dashUntil: 0, charge: null,
    healReady: Number.isFinite(saved?.healReady) ? Math.max(0, saved.healReady) : 0,
    autoHeal: saved?.autoHeal !== false,
    healThreshold: Number.isInteger(saved?.healThreshold) && saved.healThreshold >= 1 && saved.healThreshold <= 100 ? saved.healThreshold : CURA.limitePadrao,
    kiThreshold: Number.isInteger(saved?.kiThreshold) && saved.kiThreshold >= 1 && saved.kiThreshold <= 100 ? saved.kiThreshold : 25,
    seedThreshold: Number.isInteger(saved?.seedThreshold) && saved.seedThreshold >= 1 && saved.seedThreshold <= 100 ? saved.seedThreshold : 30,
    barrierReady: 0, barrierUntil: 0, genkiReady: 0,
    // Forma transitória única; o alias mantém os consumidores antigos de SSJ compatíveis.
    forma: 'base', formaAte: 0, get transformed() { return ['ssj', 'ssj2', 'ssj3', 'majin', 'ssj4', 'gogeta', 'vegito'].includes(this.forma); },
    set transformed(ativa) { this.forma = ativa ? 'ssj' : 'base'; },
    respawnAt: 0, connected: true, autoFood: saved?.autoFood !== false, autoKi: saved?.autoKi === true, autoSeed: saved?.autoSeed === true,
    // TODO (dev): jogador NOVO (sem preferências salvas) começa com a música DESLIGADA, só pra facilitar o teste.
    // Depois, restringir isso ao ambiente de desenvolvimento (voltar ao padrão com música ligada em produção). Ver memória "onde paramos".
    correioResgatadas:(Array.isArray(saved?.correioResgatadas)?saved.correioResgatadas:[]).filter(id=>typeof id==='string'&&id.length<=120),preferencias:preferenciasValidas(saved?.preferencias??{musicaAtiva:false}),missoes:restaurarMissoes(saved?.missoes),
    novidades: restaurarNovidades(saved?.novidades),
    lastBagNotice: 0, bossKills: Number(saved?.bossKills) || 0 };
  p.skin = ['base','natalino'].includes(saved?.skin) ? saved.skin : 'base';
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
    hotkeysConsumiveis:hotkeysConsumiveisValidas(p.hotkeysConsumiveis,p.seedSelected),barraPersonalizada:!!p.barraPersonalizada,barraKameManual:!!p.barraKameManual,barraTecnicas:barraValida(p.barraTecnicas),inventory: p.inventory, kills: p.kills, bossKills: p.bossKills,
    foodUntil: p.foodUntil, seedReady: p.seedReady, kiReady: p.kiReady,
    healReady: p.healReady, autoHeal: p.autoHeal, healThreshold: p.healThreshold,
    kiThreshold: p.kiThreshold, seedThreshold: p.seedThreshold, seedSelected: p.seedSelected,
    autoFood: p.autoFood, autoKi: p.autoKi, autoSeed: p.autoSeed };
}
