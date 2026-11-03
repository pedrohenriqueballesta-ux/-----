// Ponto de entrada das regras compartilhadas (importado pelo servidor e pelo navegador).
export { CONFIG, ZONES, MERCHANT, OBSTACLES, PLANETS, HOUSES, PORTAIS, RAIO_PORTAL, zoneAt, areaPorId, lugar } from './config.mjs';
export { clamp, distance } from './math.mjs';
export { statsFor, xpForLevel, bagWeight } from './characters.mjs';
export { Game } from './game.mjs';
