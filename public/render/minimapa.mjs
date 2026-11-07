export const MINIMAPA = Object.freeze({ vista: 2400, tamanhoMinimo: 1, tamanhoMaximo: 2, passoTamanho: 0.25, zoomMinimo: 1, zoomMaximo: 4 });
export const tamanhoMinimapa = valor => Math.max(1, Math.min(2, Number.isFinite(valor) ? valor : 1));
export function zoomMinimapa(zoom, delta, modo = 0) {
  const pixels = delta * (modo === 1 ? 16 : modo === 2 ? 600 : 1);
  return Math.max(MINIMAPA.zoomMinimo, Math.min(MINIMAPA.zoomMaximo, zoom * Math.exp(-pixels * 0.0012)));
}
export function vistaMinimapa(mundo, area, jogador, largura, altura, zoom = 1) {
  const lim = area || { x: 0, y: 0, w: mundo.w, h: mundo.h };
  // Aplica zoom depois de limitar o recorte à área: não há faixa de zoom sem efeito.
  const baseW = Math.min(MINIMAPA.vista, lim.w), baseH = Math.min(baseW * altura / largura, lim.h);
  zoom = Math.max(MINIMAPA.zoomMinimo, Math.min(MINIMAPA.zoomMaximo, zoom));
  const w = baseW / zoom, h = baseH / zoom;
  const cx = jogador?.x ?? lim.x + lim.w / 2, cy = jogador?.y ?? lim.y + lim.h / 2;
  return { x: Math.max(lim.x, Math.min(lim.x + lim.w - w, cx - w / 2)),
    y: Math.max(lim.y, Math.min(lim.y + lim.h - h, cy - h / 2)), w, h };
}
export function arrastarMinimapa(vista, dx, dy, caixa, limite) {
  const x = Math.max(limite.x, Math.min(limite.x + limite.w - vista.w, vista.x - dx / caixa.width * vista.w));
  const y = Math.max(limite.y, Math.min(limite.y + limite.h - vista.h, vista.y - dy / caixa.height * vista.h));
  return { x: x + vista.w / 2, y: y + vista.h / 2 };
}
export function pontoDoMinimapa(clientX, clientY, caixa, vista) {
  if (!vista || caixa.width <= 0 || caixa.height <= 0) return null;
  const x = (clientX - caixa.left) / caixa.width, y = (clientY - caixa.top) / caixa.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x: vista.x + x * vista.w, y: vista.y + y * vista.h };
}
