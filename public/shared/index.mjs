// Ponto de entrada das regras compartilhadas (importado pelo servidor e pelo navegador).
export { CONFIG, ZONES, MERCHANT, MERCADORES, OBSTACLES, PLANETS, PLANETAS_DE_HUNT, HOUSES, PORTAIS, RAIO_PORTAL, DECORACAO, DECORACAO_ESCALA, zoneAt, zonasDe, areaPorId, lugar } from './config.mjs';
export { clamp, distance } from './math.mjs';
export { statsFor, xpForLevel, bagWeight } from './characters.mjs';
export { Game } from './game.mjs';
