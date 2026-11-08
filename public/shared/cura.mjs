// Habilidade universal: não depende da classe nem dos ataques do personagem.
export const CURA = Object.freeze({ cooldown: 0.7, limitePadrao: 70 });
export const ESTAGIOS_CURA = Object.freeze([
  { nivel: 1, marco: 1, percentual: 0.02, custo: 10 },
  { nivel: 2, marco: 20, percentual: 0.025, custo: 12 },
  { nivel: 3, marco: 50, percentual: 0.03, custo: 14 },
  { nivel: 4, marco: 100, percentual: 0.035, custo: 16 },
  { nivel: 5, marco: 150, percentual: 0.04, custo: 18 }
].map(Object.freeze));
export function curaPorNivel(nivel) {
  return ESTAGIOS_CURA.findLast(e => nivel >= e.marco) || ESTAGIOS_CURA[0];
}
