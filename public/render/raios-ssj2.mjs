// Raios do Super Saiyajin 2: efeito separado do corpo, em loop contínuo enquanto a forma SSJ2 está ativa, em qualquer
// pose e direção (nas folhas do SSJ2 ficariam congelados em cada pose). Apresentação apenas; o servidor decide a forma.
// Arte da equipe (12/11/2026, `ssj2_raios_azuis`): arcos de energia azul que passam pela frente do corpo e em volta,
// 16 quadros de 315×311 a 90 ms. O arquivo veio com a transparência invertida (fundo azul opaco, miolo apagado):
// recuperado por código — fundo transparente e miolo branco — sem redesenhar.
// `camadas`: `atras` (opcional) vai antes do corpo e `frente` depois; hoje só existe a da frente.
export const RAIOS_SSJ2 = Object.freeze({
  camadas: Object.freeze({ frente: '/assets/skills/raios-ssj2-corpo/frente.png' }),
  largura: 315, altura: 311, colunas: 4, quadros: 16, segundosPorFrame: 0.09,
  // Encaixe medido sobre o Goku SSJ2: no quadro da arte, o Goku teria 263 px (com o cabelo) e os pés em (157, 294).
  alturaNoMolde: 263, pesX: 157, pesY: 294,
  brilho: 0.35   // segunda passada em modo "lighter": os arcos se destacam também em chão claro
});

export const quadroRaios = tempo => Math.floor(Math.max(0, tempo) / RAIOS_SSJ2.segundosPorFrame) % RAIOS_SSJ2.quadros;

const imagens = {};
export function carregarRaiosSsj2(camada = 'frente') {
  const url = RAIOS_SSJ2.camadas[camada]; if (!url) return null;
  if (!imagens[camada]) { imagens[camada] = new Image(); imagens[camada].src = url; }
  return imagens[camada];
}

// `altura` = altura do personagem desenhado (Goku SSJ2 com o cabelo), nos pés `pos`.
export function desenharRaiosSsj2(ctx, jogador, pos, tempo, altura, camada = 'frente') {
  if (!jogador || jogador.dead || jogador.forma !== 'ssj2') return false;
  const folha = carregarRaiosSsj2(camada); if (!folha?.complete || !folha.naturalWidth) return false;
  const r = RAIOS_SSJ2, e = altura / r.alturaNoMolde, q = quadroRaios(tempo);
  const args = [folha, q % r.colunas * r.largura, Math.floor(q / r.colunas) * r.altura, r.largura, r.altura,
    pos.x - r.pesX * e, pos.y - r.pesY * e, r.largura * e, r.altura * e];
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(...args);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= r.brilho; ctx.drawImage(...args);
  ctx.restore();
  return true;
}
