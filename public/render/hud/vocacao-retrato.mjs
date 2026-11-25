import { vocacaoDoPersonagem } from '../../shared/sistemas/vocacoes.mjs';

const retratos = {
  goku: '/assets/hud/vocacoes/goku.png',
  vegeta: '/assets/hud/vocacoes/vegeta.png'
};

export function atualizarRetratoVocacao(imagem, valor) {
  const { id, nome } = vocacaoDoPersonagem(valor?.id || valor);
  const src = retratos[id] ?? retratos.goku;
  if (imagem.getAttribute('src') !== src) imagem.src = src;
  imagem.alt = nome;
}

export function retratoVocacao(valor) {
  const imagem = document.createElement('img');
  imagem.className = 'vocacao-retrato';
  atualizarRetratoVocacao(imagem, valor);
  return imagem;
}

const desenhistas = {
  goku: () => import('../../art/personagens/goku/goku.mjs').then(m => m.drawGoku),
  vegeta: () => import('../../art/personagens/vegeta/vegeta.mjs').then(m => m.drawVegeta)
};

export function spriteVocacao(valor) {
  const vocacao = vocacaoDoPersonagem(valor?.id || valor);
  const canvas = document.createElement('canvas');
  canvas.className = 'entrada-vocacao-sprite';
  canvas.width = 96;
  canvas.height = 128;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Sprite da vocação ' + vocacao.nome);

  desenhistas[vocacao.sprite]().then(desenhar => {
    const ctx = canvas.getContext('2d');
    let tentativas = 0;
    const quadro = () => {
      if (!canvas.isConnected) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(48, 118);
      ctx.scale(1.5, 1.5);
      const pronto = desenhar(ctx, { facing: { x: 0, y: 1 }, moving: false, transformed: false }, { x: 0, y: 0 }, 0);
      ctx.restore();
      if (!pronto && tentativas++ < 90) requestAnimationFrame(quadro);
    };
    quadro();
  }).catch(() => canvas.setAttribute('aria-label', 'Vocação ' + vocacao.nome + ' (sprite indisponível)'));
  return canvas;
}
