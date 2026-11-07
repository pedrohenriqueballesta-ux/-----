import { KAME, estagioKame, geometriaKame } from '../shared/kamehameha.mjs';

const imagens = new Map(), quadros = new Map();
// Sul e diagonais para baixo ficam à frente do corpo; norte e laterais ficam atrás.
export const kameSobrePersonagem = direcao => (direcao?.y || 0) > .0001;
export function desenharKameComProfundidade(ctx, efeito, tempo, redesenharLancador = null) {
  const desenhou = desenharKame(ctx, efeito, tempo);
  // Recompõe só os pixels do sprite original, sem máscara retangular nem buraco no feixe.
  if (desenhou && !kameSobrePersonagem(efeito.direction)) redesenharLancador?.();
  return desenhou;
}
export function carregarKame(nivel) {
  const e = estagioKame(nivel);
  if (!imagens.has(e.nivel)) { const imagem = new Image(); imagem.src = e.imagem; imagens.set(e.nivel, imagem); }
  return imagens.get(e.nivel);
}
export function desenharKame(ctx, efeito, tempo) {
  const g = geometriaKame(efeito.nivel, tempo - efeito.started);
  if (!g) return false;
  const imagem = carregarKame(g.estagio.nivel);
  if (!imagem.complete || !imagem.naturalWidth) return false;
  const chave = g.estagio.nivel + ':' + g.frame;
  if (!quadros.has(chave)) {
    // Origem e ponta ficam na proporção original, com metade do volume. O corpo se repete
    // entre elas para conservar o alcance sem esticar a arte ou deixar dano invisível.
    const c = document.createElement('canvas'), escala = g.estagio.escala * KAME.escalaVisual;
    const largura = g.frame < 4 ? g.q.ponta - g.q.esquerda + 1 : g.alcance / escala;
    c.width = Math.ceil(largura) + 4; c.height = 225;
    const painter = c.getContext('2d');
    const sx = g.frame % 4 * 443, sy = Math.floor(g.frame / 4) * 221;
    const copiar = (x, w, destino) => painter.drawImage(imagem, sx + x, sy, w, 221, destino + 2, 2, w, 221);
    const copiarSuave = (x, w, destino, transicao) => {
      for (let i = 0; i < Math.min(w, transicao); i++) {
        painter.globalAlpha = (i + 1) / transicao; copiar(x + i, 1, destino + i);
      }
      painter.globalAlpha = 1;
      if (w > transicao) copiar(x + transicao, w - transicao, destino + transicao);
    };
    if (g.frame < 4) copiar(g.q.esquerda, largura, 0);
    else {
      const frente = g.q.ponta - g.q.origemX;
      const inicioCorpo = Math.round(g.q.origemX + frente * .25), fimCorpo = Math.round(g.q.origemX + frente * .65);
      const ponta = g.q.ponta + 1 - fimCorpo, transicao = 24, inicioPonta = largura - ponta;
      copiar(g.q.esquerda, fimCorpo - g.q.esquerda, 0);
      // Sobreposição com fade esconde as emendas, sem deformar os recortes originais.
      for (let fim = fimCorpo - g.q.esquerda; fim < inicioPonta;) {
        const x = fim - transicao, w = Math.min(fimCorpo - inicioCorpo, inicioPonta + transicao - x);
        copiarSuave(inicioCorpo, w, x, transicao); fim = x + w;
      }
      copiarSuave(fimCorpo - transicao, ponta + transicao, inicioPonta - transicao, transicao);
    }
    if (g.q.ponta === 442) {
      // Alguns originais terminam na borda da célula. Atenua só os últimos pixels para evitar ponta reta.
      painter.globalCompositeOperation = 'destination-in';
      const mascara = painter.createLinearGradient(0, 0, largura + 2, 0);
      mascara.addColorStop(0, '#fff'); mascara.addColorStop(Math.max(0, (largura - 10) / (largura + 2)), '#fff'); mascara.addColorStop(1, '#fff0');
      painter.fillStyle = mascara; painter.fillRect(0, 0, c.width, c.height);
    }
    quadros.set(chave, c);
  }
  ctx.save(); ctx.translate(efeito.x, efeito.y - KAME.alturaMao);
  ctx.rotate(Math.atan2(efeito.direction.y, efeito.direction.x));
  ctx.scale(g.estagio.escala * KAME.escalaVisual, g.estagio.escala * KAME.escalaVisual);
  ctx.imageSmoothingEnabled = true;
  // A margem transparente é a única coisa atrás das mãos, em qualquer direção/frame.
  ctx.drawImage(quadros.get(chave), -2, -g.q.origemY - 2);
  ctx.restore(); return true;
}
