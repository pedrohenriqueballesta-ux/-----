// Valores compartilhados pela simulação, pelo Bestiário e pela projeção das hunts.
export const TIPOS_CHEFE = new Set([
  'neva', 'boss', 'subboss', 'oozaruSuper', 'oozaruDourado', 'freezaBoss',
  'maquinaPilaf', 'c20', 'cellSemiperfeito', 'cellPerfeito', 'c17Infernal', 'superC17'
]);

export const RECOMPENSAS_MOBS = Object.freeze({
  zeniMinimo: 3, zeniVariacao: 4, fracaoCristal: .16, chanceSemente15: .008
});

const fracaoCristalPorMob = new Map([
  ['ranged', .36], ['subboss', .65], ['nail', .44], ['porunga', .38],
  ['oozaru', .28], ['oozaruGuerreiro', .36], ['reiVegeta', .38], ['broly', .42]
]);
export const fracaoCristalAzul = tipo => fracaoCristalPorMob.get(tipo) ?? RECOMPENSAS_MOBS.fracaoCristal;

export function faixaZeniMob(nivel, raro = false) {
  if (raro) {
    const recompensa = Math.round(60 + nivel * 1.45);
    return [recompensa, recompensa];
  }
  const minimo = RECOMPENSAS_MOBS.zeniMinimo + Math.floor((nivel - 1) * .075);
  return [minimo, minimo + RECOMPENSAS_MOBS.zeniVariacao - 1];
}
