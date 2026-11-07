import { QUADROS_KAME } from './kamehameha-dados.mjs';

// Tiles dos pacotes = 32 unidades do mundo; a escala da imagem do mapa não altera técnicas.
export const KAME = Object.freeze({ tile: 32, quadro: .08, quadros: 16, carga: .65, primeiroFeixe: 4, mao: 20, alturaMao: 28, escalaVisual: .5 });
export const ESTAGIOS_KAME = [1, 20, 50, 100, 150].map((nivel, i) => {
  const quadros = QUADROS_KAME[nivel], alcance = (4 + i * 2) * KAME.tile;
  return Object.freeze({ nivel, alcance, quadros, escala: alcance / Math.max(...quadros.slice(4).map(q => q.ponta - q.origemX)),
    imagem: '/assets/skills/kamehameha/nivel-' + nivel + '/spritesheet.png' });
});
export const estagioKame = nivel => ESTAGIOS_KAME.findLast(e => Number(nivel) >= e.nivel) || ESTAGIOS_KAME[0];
export function quadroKame(idade) {
  return idade < 0 || idade >= KAME.quadros * KAME.quadro ? -1 : Math.min(15, Math.floor(idade / KAME.quadro + 1e-8));
}
export function geometriaKame(nivel, idade) {
  const estagio = estagioKame(nivel), frame = quadroKame(idade), q = estagio.quadros[frame];
  return q ? { estagio, frame, q, alcance: frame < 4 ? 0 : (q.ponta - q.origemX) * estagio.escala, raio: q.raio * estagio.escala * KAME.escalaVisual } : null;
}
export const origemKame = (p, direcao) => ({ x: p.x + direcao.x * KAME.mao, y: p.y + direcao.y * KAME.mao });
// Projeção no feixe: não atinge atrás da mão, além da ponta ou fora da largura afunilada.
export function atingidoPeloKame(alvo, origem, direcao, geometria) {
  if (!geometria?.alcance) return false;
  const dx = alvo.x - origem.x, dy = alvo.y - origem.y, aoLongo = dx * direcao.x + dy * direcao.y;
  const corpo = alvo.corpo || 0;
  if (aoLongo < -corpo || aoLongo > geometria.alcance + corpo) return false;
  const largura = geometria.raio * (1 - .7 * Math.max(0, aoLongo) / geometria.alcance);
  return Math.abs(dx * direcao.y - dy * direcao.x) <= largura + corpo;
}
