let feixeCanvas;
export function desenharFeixeSegmentado(ctx, imagem, q, escala, distancia, altura) {
  if (q.largura < 3) {
    ctx.drawImage(imagem, q.x, q.y, q.largura, q.altura, 0, -altura / 2, distancia, altura);
    return;
  }
  // Compõe os três recortes em pixels inteiros antes de girar, para o Canvas não suavizar cada emenda.
  feixeCanvas ??= document.createElement('canvas');
  const largura = Math.max(3, Math.ceil(distancia / escala));
  if (feixeCanvas.width !== largura) feixeCanvas.width = largura;
  if (feixeCanvas.height !== q.altura) feixeCanvas.height = q.altura;
  const painter = feixeCanvas.getContext('2d');
  painter.clearRect(0, 0, largura, q.altura);
  const extremo = Math.max(1, Math.floor(q.largura / 5));
  const ponta = Math.min(extremo, Math.floor((largura - 1) / 2));
  const corpo = largura - 2 * ponta;
  painter.drawImage(imagem, q.x, q.y, extremo, q.altura, 0, 0, ponta, q.altura);
  painter.drawImage(imagem, q.x + extremo, q.y, q.largura - 2 * extremo, q.altura, ponta, 0, corpo, q.altura);
  painter.drawImage(imagem, q.x + q.largura - extremo, q.y, extremo, q.altura, ponta + corpo, 0, ponta, q.altura);
  ctx.drawImage(feixeCanvas, 0, -altura / 2, distancia, altura);
}
