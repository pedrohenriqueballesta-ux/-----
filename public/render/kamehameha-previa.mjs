import { ESTAGIOS_KAME, KAME, estagioKame, origemKame } from '../shared/kamehameha.mjs';
import { desenharKameComProfundidade, carregarKame } from './kamehameha.mjs';
import { drawGoku } from '../art/goku.mjs';

const $ = id => document.getElementById(id), canvas = $('previa'), ctx = canvas.getContext('2d');
let nivel = 1, tocando = true, inicio = performance.now(), idade = 0;
for (const e of ESTAGIOS_KAME) {
  const b = document.createElement('button'); b.textContent = 'Nível ' + e.nivel + ' · ' + e.alcance / 32 + ' tiles';
  b.dataset.nivel = e.nivel; b.setAttribute('aria-pressed', String(e.nivel === nivel));
  b.onclick = () => { nivel = e.nivel; inicio = performance.now(); carregarKame(nivel); for (const botao of $('niveis').children) botao.setAttribute('aria-pressed', String(Number(botao.dataset.nivel) === nivel)); };
  $('niveis').append(b);
}
$('tocar').onclick = () => { tocando = !tocando; inicio = performance.now() - idade * 1000; $('tocar').textContent = tocando ? 'Pausar' : 'Reproduzir'; };
$('quadro').oninput = () => { tocando = false; $('tocar').textContent = 'Reproduzir'; idade = Number($('quadro').value) * KAME.quadro + .001; };
for (const e of ESTAGIOS_KAME) carregarKame(e.nivel);
function frame(now) {
  if (tocando) idade = ((now - inicio) / 1000) % 1.6;
  const angulo = Number($('direcao').value) * Math.PI / 180, direction = { x: Math.cos(angulo), y: Math.sin(angulo) };
  const p = { x: 550, y: 425, facing: direction, moving: false, transformed: false }, origem = origemKame(p, direction), e = estagioKame(nivel);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#2b4447'; ctx.lineWidth = 1;
  for (let x = 6; x < 1100; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 850); ctx.stroke(); }
  for (let y = 9; y < 850; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1100, y); ctx.stroke(); }
  ctx.save(); ctx.setLineDash([4, 8]); ctx.strokeStyle = '#91adba88'; ctx.beginPath(); ctx.arc(origem.x, origem.y - KAME.alturaMao, e.alcance, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  drawGoku(ctx, p, p, now / 1000);
  desenharKameComProfundidade(ctx, { ...origem, direction, nivel, started: 0 }, idade,
    () => drawGoku(ctx, p, p, now / 1000));
  const f = Math.min(15, Math.floor(idade / .08)); if (tocando) $('quadro').value = f;
  $('info').textContent = `Frame ${f + 1}/16 · ${e.alcance} unidades · 80 ms/frame`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
