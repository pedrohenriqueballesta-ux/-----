// Ponto de entrada das regras compartilhadas (importado pelo servidor e pelo navegador).
export { CONFIG, ZONES, MERCHANT, MERCADORES, OBSTACLES, PLANETS, PLANETAS_DE_HUNT, HOUSES, PORTAIS, RAIO_PORTAL, DECORACAO, DECORACAO_ESCALA, zoneAt, zonasDe, areaPorId, lugar } from './nucleo/config.mjs';
export { clamp, distance } from './nucleo/math.mjs';
export { statsFor, xpForLevel, bagWeight } from './nucleo/characters.mjs';
export { fatorXPPorDiferencaNivel, xpAjustadoPorNivel } from './sistemas/progressao.mjs';
export { Game } from './nucleo/game.mjs';
