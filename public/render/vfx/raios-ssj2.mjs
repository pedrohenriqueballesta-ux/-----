// Raios do Super Saiyajin 2: efeito separado do corpo, em loop contínuo enquanto a forma SSJ2 está ativa, em qualquer
// pose e direção (nas folhas do SSJ2 ficariam congelados em cada pose). Apresentação apenas; o servidor decide a forma.
// Arte da equipe (12/11/2026, `ssj2_raios_azuis`): arcos de energia azul que passam pela frente do corpo e em volta,
// 16 quadros de 315×311. O arquivo veio com a transparência invertida (fundo azul opaco, miolo apagado):
// recuperado por código — fundo transparente e miolo branco — sem redesenhar.
// Só no Super Saiyajin 2: é a marca dele (o SSJ3 não tem raios, decisão do Pedro, 12/11/2026).
// `camadas`: `atras` (opcional) vai antes do corpo e `frente` depois; hoje só existe a da frente.
export const RAIOS_SSJ2 = Object.freeze({
  camadas: Object.freeze({ frente: '/assets/skills/raios-ssj2-corpo/frente.png' }),
  largura: 315, altura: 311, colunas: 4, quadros: 16,
  // Pedido do Pedro (12/11/2026): mais rápido e estalando, como o GIF anterior (70 ms), em vez de pulsar crescendo e
  // encolhendo. A arte vem em sequência; a ordem embaralhada faz os arcos saltarem de lugar a cada quadro.
  segundosPorFrame: 0.07, ordem: Object.freeze([0, 9, 4, 13, 2, 11, 6, 15, 1, 8, 5, 12, 3, 10, 7, 14]),
  estalo: Object.freeze([1, .75, 1, .85, .7, 1, .9, 1, .8, 1, .7, .95, 1, .8, 1, .9]),   // brilho por passo
  // Encaixe medido sobre o Goku SSJ2: no quadro da arte, o Goku teria 263 px (com o cabelo) e os pés em (157, 294).
  alturaNoMolde: 263, pesX: 157, pesY: 294,
  brilho: 0.35   // segunda passada em modo "lighter": os arcos se destacam também em chão claro
});

const passoRaios = tempo => Math.floor(Math.max(0, tempo) / RAIOS_SSJ2.segundosPorFrame) % RAIOS_SSJ2.quadros;
export const quadroRaios = tempo => RAIOS_SSJ2.ordem[passoRaios(tempo)];

export const FORMAS_COM_RAIOS = new Set(['ssj2']);
const imagens = {};
export function carregarRaiosSsj2(camada = 'frente') {
  const url = RAIOS_SSJ2.camadas[camada]; if (!url) return null;
  if (!imagens[camada]) { imagens[camada] = new Image(); imagens[camada].src = url; }
  return imagens[camada];
}

// `altura` = altura do personagem desenhado (Goku SSJ2 com o cabelo), nos pés `pos`.
export function desenharRaiosSsj2(ctx, jogador, pos, tempo, altura, camada = 'frente') {
  if (!jogador || jogador.dead || !FORMAS_COM_RAIOS.has(jogador.forma)) return false;
  const folha = carregarRaiosSsj2(camada); if (!folha?.complete || !folha.naturalWidth) return false;
  const r = RAIOS_SSJ2, e = altura / r.alturaNoMolde, q = quadroRaios(tempo);
  const args = [folha, q % r.colunas * r.largura, Math.floor(q / r.colunas) * r.altura, r.largura, r.altura,
    pos.x - r.pesX * e, pos.y - r.pesY * e, r.largura * e, r.altura * e];
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha *= r.estalo[passoRaios(tempo)];
  ctx.drawImage(...args);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= r.brilho; ctx.drawImage(...args);
  ctx.restore();
  return true;
}
