// Candidato de origem V1. Usado somente na prévia; o feixe do jogo permanece inalterado.
export const ORIGEM_V1 = Object.freeze({
  url: '/assets/skills/galick-gun/origem-v1/spritesheet.png',
  largura: 768, altura: 256, ancoraX: 170, ancoraY: 128, escala: 0.20,
});

export function desenharOrigemGalickV1(ctx, imagem, mao, direcao, frame, escala = ORIGEM_V1.escala) {
  if (!imagem?.complete || !imagem.naturalWidth) return false;
  if (!Number.isInteger(frame) || frame < 0 || frame > 15) return false;
  const angulo = Math.atan2(direcao.y, direcao.x);
  ctx.save();
  ctx.translate(mao.x, mao.y);
  ctx.rotate(angulo);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(imagem,
    frame % 4 * ORIGEM_V1.largura, Math.floor(frame / 4) * ORIGEM_V1.altura,
    ORIGEM_V1.largura, ORIGEM_V1.altura,
    -ORIGEM_V1.ancoraX * escala, -ORIGEM_V1.ancoraY * escala,
    ORIGEM_V1.largura * escala, ORIGEM_V1.altura * escala);
  ctx.restore();
  return true;
}
