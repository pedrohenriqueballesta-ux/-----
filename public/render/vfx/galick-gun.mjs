import { desenharFeixeSegmentado } from './feixe-segmentado.mjs';
import { GALICK, quadroGalick } from '../../shared/tecnicas/galick-gun.mjs';

const folhas = new Map([
  [1, { url: '/assets/skills/galick-gun/v1/spritesheet.png', largura: 418, altura: 236 }],
  [2, { url: '/assets/skills/galick-gun/v2/galick_gun_v2_sheet_rgba.png', largura: 418, altura: 235 }],
  [3, { url: '/assets/skills/galick-gun/v3/galick_gun_v3_sheet_rgba.png', largura: 417, altura: 235 }],
  [4, { url: '/assets/skills/galick-gun/v4/galick_gun_v4_sheet_rgba.png', largura: 417, altura: 235 }],
  [5, { url: '/assets/skills/galick-gun/v5/galick_gun_v5_sheet_rgba.png', largura: 418, altura: 235 }]
]);
const impactoUrl = '/assets/skills/galick-gun/v1/impacto/spritesheet.png';
const largurasImpacto = [58, 76, 92, 108, 122];
const imagens = new Map();

function carregar(url) {
  if (!imagens.has(url)) {
    const imagem = new Image();
    imagem.src = url;
    imagens.set(url, imagem);
  }
  const imagem = imagens.get(url);
  return imagem.complete && imagem.naturalWidth ? imagem : null;
}

function prepararFolha(versao) {
  const folha = folhas.get(versao);
  if (!folha || folha.quadros) return folha;
  const imagem = carregar(folha.url);
  if (!imagem) return null;
  const canvas = document.createElement('canvas');
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imagem, 0, 0);
  folha.imagem = canvas;
  folha.quadros = Array.from({ length: 16 }, (_, i) => {
    const sx = (i % 4) * folha.largura, sy = Math.floor(i / 4) * folha.altura;
    const celula = ctx.getImageData(sx, sy, folha.largura, folha.altura);
    const pixels = celula.data;
    let primeiro = folha.largura, ultimo = -1;
    let topo = folha.altura, fundo = -1;
    for (let y = 0; y < folha.altura; y++) for (let x = 0; x < folha.largura; x++) {
      if (pixels[(y * folha.largura + x) * 4 + 3] <= 16) continue;
      primeiro = Math.min(primeiro, x);
      ultimo = Math.max(ultimo, x);
      topo = Math.min(topo, y);
      fundo = Math.max(fundo, y);
    }
    // Suaviza só as bordas em que o original encosta no limite da célula.
    const cortado = primeiro === 0 || ultimo === folha.largura - 1 || topo === 0 || fundo === folha.altura - 1;
    if (cortado) {
      for (let y = topo; y <= fundo; y++) for (let x = primeiro; x <= ultimo; x++) {
        const alpha = (y * folha.largura + x) * 4 + 3;
        const margem = Math.min(1, primeiro === 0 ? x / 5 : 1, topo === 0 ? y / 5 : 1,
          ultimo === folha.largura - 1 ? (ultimo - x) / 9 : 1, fundo === folha.altura - 1 ? (fundo - y) / 5 : 1);
        pixels[alpha] = Math.round(pixels[alpha] * margem);
      }
      ctx.putImageData(celula, sx, sy);
    }
    // Mantém a energia translúcida na periferia sem amostrar a célula vizinha.
    const x = Math.max(0, primeiro - 2), y = Math.max(0, topo - 2);
    return { x: sx + x, y: sy + y, largura: Math.min(folha.largura, ultimo + 3) - x,
      altura: Math.min(folha.altura, fundo + 3) - y };
  });
  return folha;
}

let impactoLimpo;
function carregarImpacto() {
  if (impactoLimpo) return impactoLimpo;
  const imagem = carregar(impactoUrl);
  if (!imagem) return null;
  const canvas = document.createElement('canvas');
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imagem, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (g > 90 && g > r * 1.12 && g > b * 1.08) {
      const excesso = Math.min(1, (g - Math.max(r, b)) / 100);
      d[i + 3] = Math.round(d[i + 3] * (1 - excesso));
    }
  }
  ctx.putImageData(pixels, 0, 0);
  impactoLimpo = canvas;
  return canvas;
}

export function carregarGalick(versao) {
  const folha = folhas.get(versao);
  if (!folha) return;
  carregar(folha.url);
  carregar(impactoUrl);
}

export function desenharImpactoGalick(ctx, impacto, tempo, versao = 1, pesAlvo = impacto.pesAlvo) {
  const frame = Math.floor((tempo - impacto.started) / GALICK.impactoQuadro);
  if (frame < 0 || frame >= GALICK.impactoQuadros) return false;
  const imagem = carregarImpacto();
  if (!imagem) return false;
  const largura = 362, altura = 272;
  const escala = (largurasImpacto[versao - 1] ?? largurasImpacto[0]) / largura;
  ctx.save();
  ctx.translate(pesAlvo?.x ?? impacto.x, pesAlvo?.y ?? (impacto.y - GALICK.alturaMao));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imagem, frame % 4 * largura, Math.floor(frame / 4) * altura, largura, altura,
    -largura * escala / 2, -altura * escala / 2, largura * escala, altura * escala);
  ctx.restore();
  return true;
}

export function linhaGalick(efeito, tempo, mao = efeito, pesAlvo) {
  const { direction: direcao } = efeito;
  // A projeção compensa o deslocamento da mão na direção do tiro. A altura da
  // montaria e a interpolação lateral deslocam a linha inteira, sem inclinar o feixe.
  const ajuste = (efeito.x - mao.x) * direcao.x + (efeito.y - mao.y) * direcao.y;
  const emVoo = !efeito.impacto && efeito.tempoVoo && Number.isFinite(efeito.distanciaContato);
  const limite = emVoo ? efeito.distanciaContato : efeito.distancia;
  const progresso = emVoo ? Math.max(0, Math.min(1, (tempo - efeito.started) / efeito.tempoVoo)) : 1;
  if (pesAlvo) {
    const dx = pesAlvo.x - mao.x, dy = pesAlvo.y - mao.y + GALICK.alturaMao;
    return { distancia: Math.hypot(dx, dy) * progresso, ponta: { x: mao.x + dx * progresso, y: mao.y + dy * progresso } };
  }
  const distancia = Math.max(0, limite + ajuste) * progresso;
  return { distancia, ponta: { x: mao.x + distancia * direcao.x, y: mao.y + distancia * direcao.y } };
}

export function desenharGalick(ctx, efeito, tempo, mao = efeito, pesAlvo) {
  const idade = tempo - efeito.started;
  const lancamento = Math.min(4 * GALICK.quadro, efeito.tempoVoo ?? 4 * GALICK.quadro);
  const posContato = efeito.impacto ? tempo - efeito.impacto.started : null;
  const dissipando = posContato !== null && posContato >= GALICK.sustentacaoContato;
  const quadro = dissipando ? quadroGalick('dissipacao', posContato - GALICK.sustentacaoContato, GALICK.dissipacao)
    : posContato !== null ? quadroGalick('sustentacao', Math.max(0, idade - lancamento))
    : efeito.carga ? quadroGalick('carga', idade, GALICK.carga)
    : idade < lancamento ? quadroGalick('disparo', idade, lancamento)
    : quadroGalick('sustentacao', idade - lancamento);
  if (quadro < 0) return false;
  const folha = prepararFolha(efeito.versao ?? 1);
  const q = folha?.quadros[quadro];
  if (!q || q.largura <= 0 || q.altura <= 0) return false;
  const versao = efeito.versao ?? 1;
  const escalaBase = .26 + (versao - 1) * .025;
  const escala = efeito.carga ? Math.min(escalaBase * .75, (24 + (versao - 1) * 3) / Math.max(q.largura, q.altura)) : escalaBase;
  const altura = q.altura * escala;
  const { direction: direcao } = efeito;
  ctx.save();
  ctx.translate(mao.x, mao.y - GALICK.alturaMao);
  const linha = !efeito.carga && linhaGalick(efeito, tempo, mao, pesAlvo);
  ctx.rotate(pesAlvo && linha?.distancia > 0 ? Math.atan2(linha.ponta.y - mao.y, linha.ponta.x - mao.x) : Math.atan2(direcao.y, direcao.x));
  ctx.imageSmoothingEnabled = true;
  if (dissipando) ctx.globalAlpha *= Math.min(1, (GALICK.sustentacaoContato + GALICK.dissipacao - posContato) / GALICK.quadro);
  if (efeito.carga) {
    ctx.drawImage(folha.imagem, q.x, q.y, q.largura, q.altura, -q.largura * escala / 2, -altura / 2, q.largura * escala, altura);
  } else {
    const { distancia } = linha;
    // As extremidades mantêm a escala natural sempre que há espaço. Só o corpo varia com o alcance.
    if (distancia > 0) desenharFeixeSegmentado(ctx, folha.imagem, q, escala, distancia, altura);
  }
  ctx.restore();
  return true;
}
