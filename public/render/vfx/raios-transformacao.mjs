const URL_FOLHA = '/assets/skills/raios-transformacao/aura_raios_universal_36f_rgba.png';
const COLUNAS = 6;
const QUADROS = 36;
const LARGURA = 211;
const ALTURA = 206;
// Pontos médios das bordas visíveis de cada quadro, na ordem da folha 6 × 6.
// O espaço transparente nas laterais varia mesmo entre quadros de mesma largura.
const ANCORAS_X = [
  120.5, 114, 112.5, 100, 101, 98.5,
  115.5, 111.5, 105, 106, 99.5, 94.5,
  117, 114, 111, 106, 101.5, 94,
  117, 113, 103, 110, 99.5, 97,
  124.5, 114.5, 107, 108, 99.5, 102.5,
  110.5, 109.5, 107, 105.5, 100.5, 96.5
];
let imagem;
const texturas = new WeakMap();

function texturaDaPaleta(config) {
  if (texturas.has(config)) return texturas.get(config);
  if (!imagem) {
    imagem = new Image();
    imagem.src = URL_FOLHA;
  }
  if (!imagem.complete || !imagem.naturalWidth) return null;
  const tela = document.createElement('canvas');
  tela.width = imagem.naturalWidth;
  tela.height = imagem.naturalHeight;
  const ctx = tela.getContext('2d');
  ctx.drawImage(imagem, 0, 0);
  const pixels = ctx.getImageData(0, 0, tela.width, tela.height);
  const { data } = pixels;
  const ganhoAlpha = config.ganhoAlpha ?? 1;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (!alpha) continue;
    // O alfa da fonte branca distingue a borda do núcleo na recoloração.
    const camada = Math.min(1, alpha / 128);
    const nucleo = Math.max(0, (alpha - 128) / 127) * config.intensidade * .82;
    for (let canal = 0; canal < 3; canal++) {
      const brilho = config.brilho[canal];
      const cor = brilho + (config.cor[canal] - brilho) * camada;
      data[i + canal] = cor + (255 - cor) * nucleo;
    }
    // O ganho reforça apenas os pixels do traço, uma vez por textura.
    data[i + 3] = alpha * ganhoAlpha;
  }
  ctx.putImageData(pixels, 0, 0);
  texturas.set(config, tela);
  return tela;
}

function sortear(valor) {
  valor = Math.imul(valor ^ (valor >>> 16), 0x7feb352d);
  valor = Math.imul(valor ^ (valor >>> 15), 0x846ca68b);
  return ((valor ^ (valor >>> 16)) >>> 0) / 0x100000000;
}

function semente(id, forma) {
  const chave = String(id ?? '') + forma;
  let valor = 0;
  for (let i = 0; i < chave.length; i++) valor = Math.imul(valor, 31) + chave.charCodeAt(i);
  return valor | 0;
}

export function descargaTransformacao(id, forma, tempo, config) {
  const chave = semente(id, forma);
  const [minimo, maximo] = config.intervaloMs;
  const periodo = (minimo + maximo) / 2;
  const oscilacao = (maximo - minimo) / 2;
  const ms = tempo * 1000 + sortear(chave) * periodo;
  let passo = Math.floor(ms / periodo);
  // Cada início pode atrasar até metade da faixa. A diferença entre dois
  // atrasos consecutivos mantém a duração dentro do intervalo configurado.
  if (ms - passo * periodo < sortear(chave + passo) * oscilacao) passo--;
  const ciclo = chave + Math.imul(passo, 5);
  if (sortear(ciclo + 1) < config.pausa) return null;
  // Alternar a paridade impede repetição imediata sem guardar estado por jogador.
  const quadro = 2 * Math.floor(sortear(ciclo + 2) * (QUADROS / 2)) + (passo & 1);
  const variacao = config.variacaoOpacidade ?? .32;
  return { quadro, opacidade: config.opacidade * (1 - variacao * (1 - sortear(ciclo + 3))) };
}

export function desenharRaiosTransformacao(ctx, personagem, pos, tempo, altura, configuracoes) {
  if (personagem.dead) return false;
  const config = configuracoes[personagem.vocacao]?.[personagem.forma];
  if (!config) return false;
  const textura = texturaDaPaleta(config);
  if (!textura) return false;
  const descarga = descargaTransformacao(personagem.id, personagem.forma, tempo, config);
  if (!descarga) return false;
  const h = altura * config.escala;
  const w = h * LARGURA / ALTURA;
  const sx = descarga.quadro % COLUNAS * LARGURA;
  const sy = Math.floor(descarga.quadro / COLUNAS) * ALTURA;
  const x = Math.round(pos.x) - ANCORAS_X[descarga.quadro] * w / LARGURA;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha *= descarga.opacidade;
  ctx.drawImage(textura, sx, sy, LARGURA, ALTURA, x, Math.round(pos.y) - h * config.ancoraY, w, h);
  ctx.restore();
  return true;
}
