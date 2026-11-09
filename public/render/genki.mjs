import { quadroGenki } from '../shared/genki.mjs';

export const GENKI_ARTE = Object.freeze({
  carga: { imagem: '/assets/skills/genki/01_canalizacao/spritesheet.png', escala: 0.4 },
  voo: { imagem: '/assets/skills/genki/02_voo_loop/spritesheet.png', escala: 0.42 },
  explosao: { imagem: '/assets/skills/genki/03_explosao/spritesheet.png', escala: 0.6 }
});
// Centros luminosos medidos: a cauda se alonga à esquerda sem deslocar a esfera.
const CENTROS_VOO = [[203,203],[219,206],[225,204],[236,201],[230,189],[229,190],[228,200],[242,201],
  [244,195],[243,200],[230,191],[241,207],[243,201],[239,203],[236,199],[241,200]];
const imagens = new Map();
export function carregarGenki() {
  for (const [fase, arte] of Object.entries(GENKI_ARTE)) if (!imagens.has(fase)) {
    const img = new Image(); img.src = arte.imagem; imagens.set(fase, img);
  }
}
export function geometriaGenki(fase, efeito, tempo, posicao = efeito) {
  const quadro = quadroGenki(fase, tempo - efeito.started);
  if (quadro < 0) return null;
  // A ponta inferior do V nasce na cabeça; os dois braços de energia crescem para cima.
  const ancora = fase === 'carga' ? [191,334] : fase === 'voo' ? CENTROS_VOO[quadro] : [192,192];
  return { quadro, x: posicao.x, y: posicao.y - (fase === 'carga' ? (posicao.alturaCanalizacao ?? 62) : 0),
    angulo: fase === 'voo' ? Math.atan2(efeito.dy, efeito.dx) : 0,
    ancora, escala: GENKI_ARTE[fase].escala };
}
export function desenharGenki(ctx, fase, efeito, tempo, posicao = efeito) {
  const g = geometriaGenki(fase, efeito, tempo, posicao);
  if (!g) return false;
  carregarGenki(); const img = imagens.get(fase);
  if (!img.complete || !img.naturalWidth) return false;
  // A célula inteira gira no mundo, sem canvas intermediário que corte a esfera.
  ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.angulo);
  ctx.drawImage(img, g.quadro % 4 * 384, Math.floor(g.quadro / 4) * 384, 384, 384,
    -g.ancora[0] * g.escala, -g.ancora[1] * g.escala, 384 * g.escala, 384 * g.escala);
  ctx.restore(); return true;
}
