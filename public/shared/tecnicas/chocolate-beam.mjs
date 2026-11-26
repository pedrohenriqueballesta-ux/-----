import { CONFIG } from '../nucleo/config.mjs';

export const CHOCOLATE_BEAM = Object.freeze({
  id: 'chocolateBeam', nome: 'Raio de Chocolate', nivel: 30,
  custo: CONFIG.skillCosts.ki, alcance: 470 * 0.95, recarga: 6.4,
  carga: 0.4, velocidade: 740,
  icone: '/assets/skills/majin-boo/majin_boo_chocolate_beam.png'
});
