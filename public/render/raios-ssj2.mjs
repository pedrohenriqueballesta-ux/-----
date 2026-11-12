// Raios do Super Saiyajin 2 (GIF do Pedro, 11/11/2026): efeito separado do corpo, em loop contínuo enquanto a forma
// SSJ2 está ativa, por cima do personagem em qualquer pose e direção (as folhas do SSJ2 não têm raios: neles,
// ficariam congelados em cada pose). Apresentação apenas; quem decide a forma é o servidor.
export const RAIOS_SSJ2 = Object.freeze({
  imagem: '/assets/skills/raios-ssj2/spritesheet.png',
  largura: 256, altura: 384, colunas: 4, quadros: 12, segundosPorFrame: 0.07,
  // No molde, o Goku SSJ (com o cabelo) tem 250 px de altura e os pés em (128, 344).
  alturaNoMolde: 250, pesX: 128, pesY: 344,
  brilho: 0.45   // segunda passada em modo "lighter": os raios se destacam também em chão claro
});

export const quadroRaios = tempo => Math.floor(Math.max(0, tempo) / RAIOS_SSJ2.segundosPorFrame) % RAIOS_SSJ2.quadros;

let imagem;
export function carregarRaiosSsj2() {
  if (!imagem) { imagem = new Image(); imagem.src = RAIOS_SSJ2.imagem; }
  return imagem;
}

// `altura` = altura do personagem desenhado (Goku SSJ com o cabelo), nos pés `pos`.
export function desenharRaiosSsj2(ctx, jogador, pos, tempo, altura) {
  if (!jogador || jogador.dead || jogador.forma !== 'ssj2') return false;
  const folha = carregarRaiosSsj2(); if (!folha.complete || !folha.naturalWidth) return false;
  const r = RAIOS_SSJ2, e = altura / r.alturaNoMolde, q = quadroRaios(tempo);
  const args = [folha, q % r.colunas * r.largura, Math.floor(q / r.colunas) * r.altura, r.largura, r.altura,
    pos.x - r.pesX * e, pos.y - r.pesY * e, r.largura * e, r.altura * e];
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(...args);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= r.brilho; ctx.drawImage(...args);
  ctx.restore();
  return true;
}
