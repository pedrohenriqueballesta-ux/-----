// Apresentação apenas: o servidor continua decidindo proteção, custo e duração.
export const BARREIRA_KI = Object.freeze({
  imagem: '/assets/skills/barreira-ki/spritesheet.png',
  largura: 384, altura: 256, colunas: 4, segundosPorFrame: 0.12,
  escala: 0.42, centroAcimaDosPes: 34
});

export function quadroBarreira(efeito, tempo) {
  if (!efeito || !Number.isFinite(efeito.started) || !Number.isFinite(efeito.until) || tempo < efeito.started) return -1;
  const passo = BARREIRA_KI.segundosPorFrame;
  if (tempo >= efeito.until) {
    const quadro = Math.floor((tempo - efeito.until + 1e-9) / passo);
    return quadro < 6 ? 10 + quadro : -1;
  }
  const quadro = Math.floor((tempo - efeito.started + 1e-9) / passo);
  return quadro < 4 ? quadro : 4 + (quadro - 4) % 6;
}

// O PNG já tem alfa, mas alguns pixels da cor-chave azul ainda vieram opacos.
// Remove só essa cor, preservando os azuis saturados do escudo e o alfa das bordas.
export function removerFundoAzul(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (Math.abs(pixels[i] - 146) <= 3 && Math.abs(pixels[i + 1] - 242) <= 3 && Math.abs(pixels[i + 2] - 253) <= 3) pixels[i + 3] = 0;
  }
}

let imagem, folhaTransparente;
export function carregarBarreira() {
  if (!imagem) { imagem = new Image(); imagem.src = BARREIRA_KI.imagem; }
  return imagem;
}

export function desenharBarreira(ctx, jogador, pos, tempo) {
  if (jogador.dead) return false;
  const quadro = quadroBarreira(jogador.barrier, tempo);
  if (quadro < 0) return false;
  const folha = carregarBarreira();
  if (!folha.complete || !folha.naturalWidth) return false;
  if (!folhaTransparente) {
    const canvas = document.createElement('canvas');
    canvas.width = folha.naturalWidth; canvas.height = folha.naturalHeight;
    const pintura = canvas.getContext('2d');
    pintura.drawImage(folha, 0, 0);
    const dados = pintura.getImageData(0, 0, canvas.width, canvas.height);
    removerFundoAzul(dados.data);
    pintura.putImageData(dados, 0, 0);
    folhaTransparente = canvas;
  }
  const b = BARREIRA_KI, w = b.largura * b.escala, h = b.altura * b.escala;
  // Usa os mesmos pés interpolados do avatar, sem espelhar nem depender da pose do ataque.
  ctx.save();
  ctx.drawImage(folhaTransparente, quadro % b.colunas * b.largura, Math.floor(quadro / b.colunas) * b.altura,
    b.largura, b.altura, pos.x - w / 2, pos.y - b.centroAcimaDosPes - h / 2, w, h);
  ctx.restore();
  return true;
}
