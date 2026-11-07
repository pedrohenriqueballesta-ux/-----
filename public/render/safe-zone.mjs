import { emTerra } from '../shared/passagem.mjs';
import { areaPorId } from '../shared/config.mjs';

// Fissuras fixas no terreno: acompanham câmera e zoom, sem brilho ou pintura sobre o chão.
export function desenharRachaduras(ctx, q, area) {
  const vegeta = area.startsWith('vegeta-');
  const lava = area === 'vegeta-lava';
  const sombra = lava ? '#1c1016' : vegeta ? '#562916' : '#66503a';
  const luz = lava ? '#995346' : vegeta ? '#d99150' : '#d8c294';
  const planeta = areaPorId(area).planet;
  const ruido = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const linhas = [];
  const cantos = [[q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]];
  for (let lado = 0; lado < 4; lado++) {
    const a = cantos[lado], b = cantos[(lado + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1];
    const comprimento = Math.hypot(dx, dy), nx = -dy / comprimento, ny = dx / comprimento;
    const linha = [a];
    for (let i = 1; i < 24; i++) {
      const t = i / 24, n = lado * 100 + i, desvio = (ruido(n) - .5) * 5;
      const x = a[0] + dx * t + nx * desvio, y = a[1] + dy * t + ny * desvio;
      linha.push([x, y]);
      if (i % 4 === 2) {
        const sinal = ruido(n + 30) > .5 ? 1 : -1, tamanho = 7 + ruido(n + 60) * 11;
        const ponta = [x + nx * sinal * tamanho + dx / comprimento * 5, y + ny * sinal * tamanho + dy / comprimento * 5];
        linhas.push([[x, y], [x + nx * sinal * tamanho * .5 - dy / comprimento * 2, y + ny * sinal * tamanho * .5 + dx / comprimento * 2], ponta]);
      }
    }
    linha.push(b); linhas.push(linha);
  }
  ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  for (const [cor, largura, deslocamento] of [[luz, 3, 1], [sombra, 1.8, 0]]) {
    ctx.strokeStyle = cor; ctx.lineWidth = largura;
    for (const linha of linhas) {
      ctx.beginPath();
      linha.forEach(([x, y], i) => {
        const anterior = linha[i - 1];
        // A borda pode cruzar a praia: rachaduras só aparecem em terra, nunca sobre a água.
        if (anterior && emTerra(planeta, x, y) && emTerra(planeta, anterior[0], anterior[1])
          && emTerra(planeta, (x + anterior[0]) / 2, (y + anterior[1]) / 2)) ctx.lineTo(x + deslocamento, y + deslocamento);
        else ctx.moveTo(x + deslocamento, y + deslocamento);
      });
      ctx.stroke();
    }
  }
  ctx.restore();
}
