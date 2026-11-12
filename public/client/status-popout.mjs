import { CANAL_STATUS_POPUP } from './stats-popout.mjs';
import { desenharGokuPopout } from '../render/goku-popout.mjs';

const $ = id => document.getElementById(id);
const inteiro = valor => Math.round(Number(valor) || 0).toLocaleString('pt-BR');
const rotulos = { cacando: 'CAÇANDO', repouso: 'EM REPOUSO', explorando: 'EXPLORANDO', morto: 'MORTO' };
const canal = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CANAL_STATUS_POPUP) : null;
const spriteCanvas = $('sprite'), spriteCtx = spriteCanvas?.getContext('2d');
let recebeuStatus = false, atualizadoEm = 0, statusAtual = null, spriteRecebidaEm = 0, ultimoFrame = 0, distanciaAnimada = 0;

function render(status) {
  recebeuStatus = Boolean(status); atualizadoEm = performance.now(); statusAtual = status; spriteRecebidaEm = atualizadoEm;
  if (!status) {
    $('nome').textContent = 'Sem personagem conectado';
    $('nivel').textContent = 'Entre no jogo na janela principal';
    $('estado').textContent = 'DESCONECTADO';
    $('estado').dataset.estado = 'desconectado';
    $('hpTexto').textContent = $('kiTexto').textContent = $('xpHora').textContent = '—';
    $('hpBarra').style.width = $('kiBarra').style.width = '0%';
    $('atualizacao').textContent = 'Aguardando conexão com o jogo.';
    $('vocacao').textContent = 'Goku'; distanciaAnimada = 0;
    return;
  }
  $('nome').textContent = status.nome;
  $('vocacao').textContent = status.vocacao || 'Goku';
  $('nivel').textContent = 'Nível ' + inteiro(status.nivel);
  $('estado').textContent = rotulos[status.estado] || 'SEM SINAL';
  $('estado').dataset.estado = status.estado || 'desconectado';
  $('hpTexto').textContent = inteiro(status.hp) + ' / ' + inteiro(status.hpMax);
  $('kiTexto').textContent = inteiro(status.ki) + ' / ' + inteiro(status.kiMax);
  $('xpHora').textContent = inteiro(status.xpHora);
  $('hpBarra').style.width = status.hpPercentual + '%';
  $('kiBarra').style.width = status.kiPercentual + '%';
  $('atualizacao').textContent = 'Atualizado agora';
}

canal?.addEventListener('message', evento => {
  if (evento.data?.tipo === 'status') render(evento.data.status);
});
canal?.postMessage({ tipo: 'pedir-status' });
function animarSprite(agora) {
  const delta = ultimoFrame ? Math.min(.1, (agora - ultimoFrame) / 1000) : 0;
  ultimoFrame = agora;
  const sprite = statusAtual?.sprite;
  if (sprite?.moving) distanciaAnimada += Math.max(0, sprite.movementSpeed || 0) * delta;
  const tempo = sprite ? sprite.serverTime + Math.max(0, agora - spriteRecebidaEm) / 1000 : 0;
  if (spriteCtx) desenharGokuPopout(spriteCtx, sprite, tempo, distanciaAnimada);
  requestAnimationFrame(animarSprite);
}
requestAnimationFrame(animarSprite);
setInterval(() => {
  if (recebeuStatus && performance.now() - atualizadoEm > 6000) $('atualizacao').textContent = 'Sem atualização da janela principal';
}, 1500);
window.addEventListener('pagehide', () => canal?.close(), { once: true });
