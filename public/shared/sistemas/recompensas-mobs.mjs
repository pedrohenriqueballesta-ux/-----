// Valores usados tanto na entrega das recompensas quanto na consulta do bestiário.
export const RECOMPENSAS_MOBS = Object.freeze({ zeniMinimo:5, zeniVariacao:5, fracaoCristal:.16, chanceSemente15:.008 });

// Frações do sorteio de materiais, calibradas pelo valor de venda com 80% de chance de loot.
const fracaoCristalPorMob = new Map([
  ['ranged', .36], ['subboss', .65], ['nail', .44], ['porunga', .38],
  ['oozaru', .28], ['oozaruGuerreiro', .36], ['reiVegeta', .38], ['broly', .42]
]);
export const fracaoCristalAzul = tipo => fracaoCristalPorMob.get(tipo) ?? RECOMPENSAS_MOBS.fracaoCristal;

// A renda direta cresce nas hunts avançadas, onde cada abate ocupa mais tempo.
export function faixaZeniMob(nivel, raro = false) {
  if (raro) {
    const recompensa = Math.max(100, nivel * 5);
    return [recompensa, recompensa];
  }
  // A progressão de renda vem de Zeni e da venda de materiais, mesmo nos níveis altos.
  const bonus = nivel >= 30 ? 8 + Math.floor((nivel - 25) * 0.33) : 0;
  const minimo = RECOMPENSAS_MOBS.zeniMinimo + bonus;
  return [minimo, minimo + RECOMPENSAS_MOBS.zeniVariacao - 1];
}
