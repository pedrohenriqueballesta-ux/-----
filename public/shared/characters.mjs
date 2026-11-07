// Personagem jogável (Goku) e sua progressão. Novos personagens jogáveis
// podem ser descritos aqui no futuro, sem mexer na lógica de combate.
import { clamp } from './math.mjs';
import { CONFIG, PLANETS } from './config.mjs';
import { CURA } from './cura.mjs';

export function statsFor(level) {
  const n = Math.max(0, level - 1);
  return { hp: 120 + n * 22, ki: 80 + n * 10, attack: 12 + n * 2.8,
    defense: 2 + n * 0.65, healing: 1 + n * 0.08, capacity: 20 + n * 1.3,
    lootChance: Math.min(0.8, 0.35 + n * 0.008), mobility: 175 + Math.min(60, n * 2) };
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
  return { id, name: String(name).trim().slice(0, 18) || 'Guerreiro', character: 'Goku', level,
    xp: clamp(Number(saved?.xp) || 0, 0, xpForLevel(level) - 1), stats,
    x: PLANETS.terra.spawn.x, y: PLANETS.terra.spawn.y, planet: 'terra', area: null, seguroAte: 0,
    hp: clamp(saved?.hp == null ? stats.hp : Number(saved.hp), 1, stats.hp),
    ki: clamp(saved?.ki == null ? stats.ki : Number(saved.ki), 0, stats.ki),
    zeni: clamp(Number(saved?.zeni ?? 200), 0, 9999999), inventory, kills: Number(saved?.kills) || 0,
    input: { x: 0, y: 0 }, facing: { x: 1, y: 0 }, aim: null, inputAt: now,
    autoAttack: false, autoSkills: false, autoHunt: false, targetId: null,
    moving: false, moveTo: null, seedSelected: 15, foodUntil: Number(saved?.foodUntil) || 0,
    seedReady: Number(saved?.seedReady) || 0, kiReady: Number(saved?.kiReady) || 0,
    basicReady: 0, shotReady: 0, kameReady: 0, dashReady: 0, dashUntil: 0, charge: null,
    healReady: Number.isFinite(saved?.healReady) ? Math.max(0, saved.healReady) : 0,
    autoHeal: saved?.autoHeal !== false,
    healThreshold: Number.isInteger(saved?.healThreshold) && saved.healThreshold >= 1 && saved.healThreshold <= 100 ? saved.healThreshold : CURA.limitePadrao,
    kaiokenReady: 0, kaiokenUntil: 0, barrierReady: 0, barrierUntil: 0, genkiReady: 0, transformReady: 0,
    transformed: false, respawnAt: 0, connected: true, autoFood: true, autoKi: false, autoSeed: false,
    lastBagNotice: 0, bossKills: Number(saved?.bossKills) || 0 };
}

// Campos persistidos no save do servidor.
export function exportPlayer(p) {
  return { name: p.name, level: p.level, xp: p.xp, x: p.x, y: p.y, hp: p.hp, ki: p.ki,
    zeni: p.zeni, inventory: p.inventory, kills: p.kills, bossKills: p.bossKills,
    foodUntil: p.foodUntil, seedReady: p.seedReady, kiReady: p.kiReady,
    healReady: p.healReady, autoHeal: p.autoHeal, healThreshold: p.healThreshold };
}
