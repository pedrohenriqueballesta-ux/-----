// Apenas apresentação da folha 6; tempos do combate continuam em shared/genki.mjs.
export const POSE_GENKI = Object.freeze({ erguendo: .25, preparando: .15, arremesso: .35, alturaCanalizacao: 58 });
export function colunaGenki(jogador, tempo) {
  if (jogador.dead || jogador.connected === false) return null;
  if (jogador.genkiCarga && tempo >= jogador.genkiCarga.started)
    return tempo - jogador.genkiCarga.started < POSE_GENKI.erguendo ? 0 : 1;
  const idade = tempo - jogador.genkiLancado;
  if (Number.isFinite(jogador.genkiLancado) && idade >= 0 && idade < POSE_GENKI.arremesso)
    return idade < POSE_GENKI.preparando ? 2 : 3;
  return null;
}
export function apresentarGenkiJogador(jogador, cargas, tempo) {
  const carga = !jogador.dead && jogador.connected !== false ? cargas.find(g => g.owner === jogador.id) : null;
  const p = { ...jogador, genkiCarga: carga || null };
  if (colunaGenki(p, tempo) !== null && !p.transformed) p.facing = carga?.direction || p.genkiDirecao || p.facing;
  return p;
}
