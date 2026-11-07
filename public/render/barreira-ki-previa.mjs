import { drawGoku } from '../art/goku.mjs';
import { BARREIRA_KI, carregarBarreira, desenharBarreira, quadroBarreira } from './barreira-ki.mjs';

const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const tempo = document.querySelector('#tempo'), tocar = document.querySelector('#tocar');
const ataque = document.querySelector('#ataque'), mover = document.querySelector('#mover');
let rodando = true, anterior = performance.now(), t = Number(tempo.value);
carregarBarreira();
tocar.onclick = () => { rodando = !rodando; tocar.textContent = rodando ? 'Pausar' : 'Reproduzir'; };
tempo.oninput = () => { t = Number(tempo.value); rodando = false; tocar.textContent = 'Reproduzir'; };
function avatar(x, y, angulo, instante, texto, andar = false) {
  const facing = { x: Math.cos(angulo), y: Math.sin(angulo) };
  const pos = { x: x + (andar ? Math.sin(t * 2) * 22 : 0), y, travelled: t * 60 };
  const jogador = { facing, moving: andar, dead: false, barrier: { started: 0, until: 2.5 } };
  ctx.fillStyle = '#193c2a66'; ctx.beginPath(); ctx.ellipse(pos.x, y + 4, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  drawGoku(ctx, jogador, pos, instante, ataque.checked ? instante % 0.7 / 0.7 : null);
  desenharBarreira(ctx, jogador, pos, instante);
  ctx.fillStyle = '#f4fff7'; ctx.textAlign = 'center'; ctx.font = '14px system-ui'; ctx.fillText(texto, x, y + 42);
}
function frame(agora) {
  if (rodando) { t = (t + Math.min(0.05, (agora - anterior) / 1000)) % 3.5; tempo.value = t; }
  anterior = agora;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < canvas.height; y += 24) for (let x = 0; x < canvas.width; x += 24) {
    ctx.fillStyle = (x / 24 + y / 24) % 2 ? '#487644' : '#527f4b'; ctx.fillRect(x, y, 24, 24);
  }
  ['Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste', 'Norte', 'Nordeste'].forEach((nome, i) =>
    avatar(140 + i % 4 * 270, 118 + Math.floor(i / 4) * 160, i * Math.PI / 4, t, nome, mover.checked));
  [0.24, 0.84, 2.86, 3.23].forEach((instante, i) => avatar(140 + i * 270, 455, Math.PI / 2, instante,
    ['Início · frame 2', 'Durante · frame 7', 'Final · frame 13', 'Efeito removido'][i]));
  const q = quadroBarreira({ started: 0, until: 2.5 }, t);
  document.querySelector('#info').textContent = `${t.toFixed(2)} s · ${q < 0 ? 'efeito removido' : 'frame ' + q} · ${BARREIRA_KI.segundosPorFrame * 1000} ms/frame`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
