// Tempos das três folhas fornecidas. Custo, dano e recarga permanecem no sistema de skills.
export const GENKI = Object.freeze({ carga: 16 * 0.12, quadroCarga: 0.12,
  quadroVoo: 0.1, quadroExplosao: 0.11, explosao: 16 * 0.11,
  velocidade: 265, colisao: 38, area: 72, alturaOrigem: 95, alturaAlvo: 22 });

export function quadroGenki(fase, idade) {
  if (idade < 0 || !Number.isFinite(idade)) return -1;
  const passo = fase === 'carga' ? GENKI.quadroCarga : fase === 'voo' ? GENKI.quadroVoo : GENKI.quadroExplosao;
  const quadro = Math.floor((idade + 1e-9) / passo);
  return fase === 'voo' ? quadro % 16 : quadro < 16 ? quadro : -1;
}
