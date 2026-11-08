import {montariaValida} from './montarias.mjs';
import {restaurarBattlePass} from './battle-pass.mjs';
import {hotkeysConsumiveisValidas} from './consumiveis-hotkeys.mjs';
import {vocacaoDoPersonagem} from './vocacoes.mjs';
import {preferenciasValidas} from './preferencias.mjs';
import {restaurarMissoes} from './missoes.mjs';
// Personagem jogável (Goku) e sua progressão. Novos personagens jogáveis
// podem ser descritos aqui no futuro, sem mexer na lógica de combate.
import { clamp } from './math.mjs';
import { CONFIG, PLANETS, GODMODE } from './config.mjs';
import { restaurarNovidades } from './novidades.mjs';
import { CURA } from './cura.mjs';

export function statsFor(level) {
  const n = Math.max(0, level - 1);
  return { hp: 120 + n * 22, ki: 80 + n * 10, attack: 12 + n * 2.8,
    defense: 2 + n * 0.65, healing: 1 + n * 0.08, capacity: 20 + n * 1.3,
    lootChance: Math.min(0.8, 0.35 + n * 0.008), mobility: 175 + Math.min(60, n * 2) };
}

// Valores "praticamente infinitos" usados pelo god mode de teste.
export const GODMODE_ZENI = 999999999;
export const GODMODE_CAPACITY = 999999999999;

// Liga/desliga o god mode de um jogador: nível 100, HP/Ki sempre cheios (invencível),
// peso máximo e Zeni praticamente infinitos. Ao ligar guarda nível, Zeni, HP e Ki REAIS;
// ao desligar restaura tudo ao que estava antes (o inventário não é tocado pelo god mode).
export function aplicarGodmode(p, on) {
  if (on) {
    if (p.levelReal == null) p.levelReal = p.level;
    if (p.zeniReal == null) p.zeniReal = p.zeni;
    if (p.hpReal == null) p.hpReal = p.hp;
    if (p.kiReal == null) p.kiReal = p.ki;
    p.godmode = true; p.level = 100;
    p.stats = statsFor(100); p.stats.capacity = GODMODE_CAPACITY;
    p.hp = p.stats.hp; p.ki = p.stats.ki; p.zeni = GODMODE_ZENI;
  } else {
    p.godmode = false;
    if (p.levelReal != null) p.level = p.levelReal;
    if (p.zeniReal != null) p.zeni = p.zeniReal;
    p.stats = statsFor(p.level);
    p.hp = Math.min(p.hpReal != null ? p.hpReal : p.hp, p.stats.hp);
    p.ki = Math.min(p.kiReal != null ? p.kiReal : p.ki, p.stats.ki);
    p.levelReal = null; p.zeniReal = null; p.hpReal = null; p.kiReal = null;
  }
}
export const xpForLevel = level => Math.round(30 * Math.pow(level, 1.35));
export function bagWeight(inv) {
  return Object.entries(CONFIG.itemWeights).reduce((sum, pair) => sum + (inv[pair[0]] || 0) * pair[1], 0);
}

// Inventário inicial que o personagem recebe ao entrar.
const STARTING_INVENTORY = { food: 5, ki: 4, seed15: 2, seed30: 1, seed50: 1, seed100: 1, scrap: 0, crystal: 0 };

// Cria o estado completo de um jogador, aplicando o progresso salvo quando houver.
export function createPlayer(id, name = 'Guerreiro', saved = null, now = 0) {
  const level = clamp(Math.floor(Number(saved?.level) || 1), 1, 100);
  const stats = statsFor(level);
  const inventory = { ...STARTING_INVENTORY };
  if (saved?.inventory) for (const key of Object.keys(inventory)) inventory[key] = clamp(Math.floor(Number(saved.inventory[key]) || 0), 0, 99999);
  const p = { montaria:montariaValida(saved?.montaria), battlePass:restaurarBattlePass(saved?.battlePass), id, mercadoId: typeof saved?.mercadoId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(saved.mercadoId) ? saved.mercadoId : id, name: String(name).trim().slice(0, 18) || 'Guerreiro', character:vocacaoDoPersonagem(saved).personagem,vocacao:vocacaoDoPersonagem(saved).id, level,
    levelReal: null, zeniReal: null, hpReal: null, kiReal: null, godmode: false,
    xp: clamp(Number(saved?.xp) || 0, 0, xpForLevel(level) - 1), stats,
    x: PLANETS.terra.spawn.x, y: PLANETS.terra.spawn.y, planet: 'terra', area: null, seguroAte: 0,
    hp: clamp(saved?.hp == null ? stats.hp : Number(saved.hp), 1, stats.hp),
    ki: clamp(saved?.ki == null ? stats.ki : Number(saved.ki), 0, stats.ki),
    zeni: clamp(Number(saved?.zeni ?? 200), 0, 9999999), inventory, kills: Number(saved?.kills) || 0,
    input: { x: 0, y: 0 }, facing: { x: 1, y: 0 }, aim: null, inputAt: now,
    autoAttack: false, autoSkills: false, autoHunt: false, targetId: null,
    hotkeysConsumiveis:hotkeysConsumiveisValidas(saved?.hotkeysConsumiveis,saved?.seedSelected),
    moving: false, moveTo: null, seedSelected: CONFIG.seedPotencies.includes(saved?.seedSelected) ? saved.seedSelected : 15, foodUntil: Number(saved?.foodUntil) || 0,
    seedReady: Number(saved?.seedReady) || 0, kiReady: Number(saved?.kiReady) || 0,
    basicReady: 0, shotReady: 0, kameReady: 0, dashReady: 0, dashUntil: 0, charge: null,
    healReady: Number.isFinite(saved?.healReady) ? Math.max(0, saved.healReady) : 0,
    autoHeal: saved?.autoHeal !== false,
    healThreshold: Number.isInteger(saved?.healThreshold) && saved.healThreshold >= 1 && saved.healThreshold <= 100 ? saved.healThreshold : CURA.limitePadrao,
    kiThreshold: Number.isInteger(saved?.kiThreshold) && saved.kiThreshold >= 1 && saved.kiThreshold <= 100 ? saved.kiThreshold : 25,
    seedThreshold: Number.isInteger(saved?.seedThreshold) && saved.seedThreshold >= 1 && saved.seedThreshold <= 100 ? saved.seedThreshold : 30,
    kaiokenReady: 0, kaiokenUntil: 0, barrierReady: 0, barrierUntil: 0, genkiReady: 0, transformReady: 0,
    transformed: false, respawnAt: 0, connected: true, autoFood: saved?.autoFood !== false, autoKi: saved?.autoKi === true, autoSeed: saved?.autoSeed === true,
    correioResgatadas:(Array.isArray(saved?.correioResgatadas)?saved.correioResgatadas:[]).filter(id=>typeof id==='string'&&id.length<=120),preferencias:preferenciasValidas(saved?.preferencias),missoes:restaurarMissoes(saved?.missoes),
    novidades: restaurarNovidades(saved?.novidades),
    lastBagNotice: 0, bossKills: Number(saved?.bossKills) || 0 };
  if (saved?.godmode != null ? !!saved.godmode : GODMODE) aplicarGodmode(p, true);
  return p;
}

// Campos persistidos no save do servidor.
export function exportPlayer(p) {
  return { montaria:montariaValida(p.montaria), battlePass:restaurarBattlePass(p.battlePass), mercadoId:p.mercadoId,character:p.character,vocacao:p.vocacao, name: p.name, level: p.godmode && p.levelReal != null ? p.levelReal : p.level, xp: p.xp, x: p.x, y: p.y,
    hp: p.godmode && p.hpReal != null ? p.hpReal : p.hp, ki: p.godmode && p.kiReal != null ? p.kiReal : p.ki,
    zeni: p.godmode && p.zeniReal != null ? p.zeniReal : p.zeni, godmode: p.godmode,
    correioResgatadas:[...p.correioResgatadas],preferencias:preferenciasValidas(p.preferencias),missoes:structuredClone(p.missoes),
    novidades: restaurarNovidades(p.novidades),
    hotkeysConsumiveis:hotkeysConsumiveisValidas(p.hotkeysConsumiveis,p.seedSelected),inventory: p.inventory, kills: p.kills, bossKills: p.bossKills,
    foodUntil: p.foodUntil, seedReady: p.seedReady, kiReady: p.kiReady,
    healReady: p.healReady, autoHeal: p.autoHeal, healThreshold: p.healThreshold,
    kiThreshold: p.kiThreshold, seedThreshold: p.seedThreshold, seedSelected: p.seedSelected,
    autoFood: p.autoFood, autoKi: p.autoKi, autoSeed: p.autoSeed };
}
