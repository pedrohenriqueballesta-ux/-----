import {apresentarGenkiJogador,POSE_GENKI} from '../render/genki-personagem.mjs';
import {instalarAtalhosInterface} from './atalhos.mjs';
import {desenharNimbus,nimbusCarregada} from '../render/nimbus.mjs';
import {geometriaNimbus} from '../shared/montarias.mjs';
import {montarEntrada,requisitarAuth} from './entrada.mjs';
import {instalarTutorial} from './tutorial.mjs';
import {instalarTrilhaSonora} from './audio.mjs';
import {PADRAO_PREFERENCIAS} from '../shared/preferencias.mjs';
import { OBSTACLES, MERCADORES, PLANETS, HOUSES, PORTAIS, RAIO_PORTAL, DECORACAO, DECORACAO_ESCALA, areaPorId, lugar } from '../shared/index.mjs';
import { deslocar } from '../shared/passagem.mjs';
import { frenteDaCasa, zonaSeguraDaHunt } from '../shared/config.mjs';
import { desenharRachaduras } from '../render/safe-zone.mjs';
import { carregarKame, carregarImpactoKame, desenharKameComProfundidade } from '../render/kamehameha.mjs';
carregarImpactoKame();
import { KAME, origemKame } from '../shared/kamehameha.mjs';
import { carregarBarreira, desenharBarreira } from '../render/barreira-ki.mjs';
import { criarTransicaoTeleport } from '../render/teleporte.mjs';
import { carregarCura, desenharCura } from '../render/cura.mjs';
import { carregarProjetilMob, desenharProjetilMob } from '../render/projetil-mob.mjs';
import { carregarGenki, desenharGenki } from '../render/genki.mjs';
import { art, soloDe, objetoVegeta, VEGETA_OBJETOS, VEGETA_OBJETOS_ESCALA, CLEARINGS, drawGroundImage, drawMarket, drawHouse, drawHouseGround, drawTree, drawRock, drawVendor, drawDecoracao, drawSombraDecoracao, drawAlien, drawSaibaman, drawGoku, drawFreeza, drawPortal, drawVoador, VOADORES, ALTURA_DE_VOO, ALTURA_GOKU, drawGuerreiro, drawVeterano, ALTURA_GUERREIRO, drawLutador, LUTADORES, drawFreezaBoss, FREEZA_ALTURA } from '../art/index.mjs';
import { $, notify, mensagemChat, atualizarHud, ligarHud, alternarCaca, alternarAutoHunt, abrirPortal, COR_DESTINO, encaixarAutoHunt } from './hud.mjs';
import { zoomMinimapa, vistaMinimapa, pontoDoMinimapa, arrastarMinimapa } from '../render/minimapa.mjs';
import { CAMERA, clampZoom, zoomFromWheel, cameraView, worldFromPointer, advancePose, mobStrikeProgress } from '../render/camera.mjs';

// O mapa e o minimapa são do jogo, não da HUD: o mapa é obrigatório; o minimapa, se existir.
const canvas = document.getElementById('world'), ctx = canvas.getContext('2d'), mini = document.getElementById('minimap'), mctx = mini?.getContext('2d');
const keys = new Set(), renderPositions = new Map(), seenEvents = new Set();
let entrada=null,tutorial=null;
let snapshot = null, session = '', playerId = '', eventSource = null, receivedAt = 0, width = 900, height = 600, ratio = 1;
let camera = { x: 0, y: 0, scale: 1 }, zoom = CAMERA.zoomPadrao, pointerAim = null, touchVector = { x: 0, y: 0 }, lastUI = 0, sendingInput = false;
let floating = [], lastFrame = performance.now(), connectionError = false, miniTick = 0;
let zoomMini = 1, vistaMini = null, destinoMini = null;
let centroMini = null, arrastoMini = null;
const trilhaSonora=instalarTrilhaSonora({obterEstado:()=>snapshot});
const transicaoTeleport = criarTransicaoTeleport({
  viajar: destino => api('action', { type: 'portal', destino }),
  pronto: id => {
    const destino = lugar(id);
    if (!snapshot || snapshot.planet !== destino.planet || snapshot.area !== destino.area) return false;
    const mundo = PLANETS[destino.planet], solo = mundo.solo ? soloDe(mundo) : null;
    return !solo || Boolean(solo.complete && solo.naturalWidth);
  },
  concluir: () => { keys.clear(); touchVector = { x: 0, y: 0 }; pointerAim = null; },
  avisar: mensagem => notify(mensagem)
});
async function api(path, data = {}) {
  const res = await fetch('/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials:'same-origin',body: JSON.stringify(data) });
  if(!res.ok){if([401,403].includes(res.status))entrada?.sessaoExpirada();throw new Error(entrada?.t([401,403].includes(res.status)?'sessaoExpirada':'requisicaoInvalida')||'Falha de conexão.');}
  return res.json();
}
function action(data) {
  if (!session || !snapshot || transicaoTeleport.ativa) return;
  if (data.type === 'portal') {
    keys.clear(); touchVector = { x: 0, y: 0 }; pointerAim = null;
    transicaoTeleport.iniciar(data.destino);
    sendInput();
    return;
  }
  api('action', data).catch(e => notify(e.message));
}
function connected(ok) {
  // Conectado não mostra nada (sem a pílula "Servidor conectado"); só avisa se a conexão cair.
  connectionError = !ok; $('connection').textContent = ok ? '' : 'Reconectando…';
  $('connection').classList.toggle('hidden', ok);
  $('connection').classList.toggle('offline', !ok);
}
function sairDoMundo(){if(eventSource){eventSource.close();eventSource=null;}session='';snapshot=null;playerId='';keys.clear();touchVector={x:0,y:0};pointerAim=null;floating=[];renderPositions.clear();seenEvents.clear();tutorial?.fechar();for(const d of document.querySelectorAll('dialog[open]'))if(d.id!=='welcomeDialog')d.close();trilhaSonora.atualizar();}
function conectarMundo(data){
 if(eventSource)eventSource.close();session='autenticado';playerId=data.playerId;snapshot=null;
 return new Promise((resolve,reject)=>{let primeiro=true;const prazo=setTimeout(()=>{eventSource?.close();session='';reject(new Error('conexao'));},12000);
 eventSource=new EventSource('/api/events');eventSource.onopen=()=>connected(true);
 eventSource.onerror=()=>{connected(false);if(primeiro){clearTimeout(prazo);eventSource?.close();session='';reject(new Error('conexao'));}else entrada?.sessaoExpirada();};
  eventSource.onmessage = event => {
    try {
      const proximo = JSON.parse(event.data);
      if (transicaoTeleport.ativa && snapshot && (snapshot.planet !== proximo.planet || snapshot.area !== proximo.area)) {
        renderPositions.clear(); floating = []; pointerAim = null;
      }
      snapshot = proximo; receivedAt = performance.now();trilhaSonora.atualizar();
      carregarKame(snapshot.self?.level || 1);
      carregarBarreira();
      carregarCura();
      carregarGenki();
      for (const effect of snapshot.events) {
        if (seenEvents.has(effect.id)) continue;
        seenEvents.add(effect.id);
        if (effect.type === 'message') notify(effect.text);
        else if (effect.type === 'chat') mensagemChat(effect.nome, effect.texto, effect.canal);
        else floating.push(effect);
      }
      if (seenEvents.size > 2000) { const items = [...seenEvents]; items.slice(0, 1000).forEach(id => seenEvents.delete(id)); }
      if(primeiro){primeiro=false;clearTimeout(prazo);resolve();}
      if (performance.now() - lastUI > 90) { atualizarHud(snapshot, playerId); lastUI = performance.now(); }
    } catch (e) { console.error('Falha ao ler estado do jogo:', e.message); }
  };

 });
}
async function entrarNoMundo(){
 let pronto=false,carregado=false;
 const ok=await new Promise(resolve=>{const animacao=criarTransicaoTeleport({container:document.getElementById('welcomeDialog'),viajar:async()=>{const r=await requisitarAuth('entrar',{});entrada.atualizarConta(r.conta);await conectarMundo(r);pronto=true;return{ok:true};},pronto:()=>{if(!snapshot?.self)return false;const mundo=PLANETS[snapshot.planet],solo=mundo.solo?soloDe(mundo):null;carregado=!solo||Boolean(solo.complete&&solo.naturalWidth);return carregado;},concluir:()=>resolve(pronto&&carregado),avisar:()=>{}});animacao.iniciar('entrada');});
 if(!ok)sairDoMundo();else setTimeout(()=>tutorial?.iniciar(),0);return ok;
}

function inputVector() {
  if (transicaoTeleport.ativa) return { x: 0, y: 0 };
  let x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + touchVector.x;
  let y = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) + touchVector.y;
  const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
  return { x, y, ...(pointerAim ? { aimX: pointerAim.x, aimY: pointerAim.y } : {}) };
}
async function sendInput() {
  if (!session || !snapshot || sendingInput || connectionError) return;
  sendingInput = true;
  try { await api('input', inputVector()); } catch {} finally { sendingInput = false; }
}
setInterval(sendInput, 70);
instalarAtalhosInterface({
 ativo:()=>Boolean(session&&snapshot?.self&&!document.querySelector('#welcomeDialog[open],#tutorialDialog[open]')),
 bloqueado:()=>transicaoTeleport.ativa,abrirMenu:menu=>document.querySelector('[data-menu="'+menu+'"]')?.click(),
 caca:alternarCaca,painelCaca:alternarAutoHunt,montaria:()=>action({type:'montaria',valor:snapshot.self.montaria==='nimbus'?null:'nimbus'}),
 soltarTeclas:()=>{keys.clear();touchVector={x:0,y:0};sendInput();}
});
document.addEventListener('keydown', e => {
  if(e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
  if (transicaoTeleport.ativa) { e.preventDefault(); return; }
  // Mochila e Auto Hunt são painéis não modais: não pausam movimento ou técnicas.
  if (e.target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || document.querySelector('dialog[open]:not(.mochila):not(.auto-hunt-panel):not(.bestiario)')) return;
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) e.preventDefault();
  keys.add(key); sendInput(); if (e.repeat) return;
  const skills = { '1': 'heal', '2': 'kame', '3': 'kaioken', '4': 'barrier', '6': 'genki', ' ': 'basic', 'shift': 'dash' };
  // Cura universal ocupa a primeira posição; R, Q e T continuam como alternativas.
  if (skills[key]) action({ type: 'skill', skill: skills[key] });
  else if (key === '5' || key === 't') action({ type: 'transform' });
  else if (key === 'f') action({ type: 'food' });
  else if (key === 'q' || key === '8') action({ type: 'usarConsumivelHotkey',slot:8 });
  else if (key === 'r' || key === '7') action({ type: 'usarConsumivelHotkey',slot:7 });
});
document.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); sendInput(); });
window.addEventListener('blur', () => { keys.clear(); touchVector = { x: 0, y: 0 }; sendInput(); });
window.addEventListener('pagehide', () => {
  if (session) fetch('/api/save', { method: 'POST', credentials:'same-origin',keepalive:true }).catch(() => {});
});
function setZoom(value) {
  zoom = clampZoom(value);
  $('zoomOut').disabled = zoom <= CAMERA.zoomMinimo;
  $('zoomIn').disabled = zoom >= CAMERA.zoomMaximo;
  // Do not keep an aim point derived from the old camera scale.
  pointerAim = null;
}
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  setZoom(zoomFromWheel(zoom, event.deltaY, event.deltaMode));
}, { passive: false });
function redesenharMini() {
  if (!snapshot || !mctx) return;
  const mundo = PLANETS[snapshot.planet] || PLANETS.namek;
  drawMinimap(mundo, mundo.solo ? areaPorId(snapshot.area) : null);
}
function ajustarHudMinimapa() {
  if (!mini) return;
  const w = Math.max(1, mini.clientWidth), h = Math.max(1, mini.clientHeight);
  if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; }
  redesenharMini(); encaixarAutoHunt();
}
mini?.closest('.hud-mapa')?.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); });
mini?.addEventListener('wheel', e => {
  e.preventDefault(); e.stopPropagation();
  if (arrastoMini) return;
  zoomMini = zoomMinimapa(zoomMini, e.deltaY, e.deltaMode);
  $('minimapZoomLabel').textContent = 'Zoom ' + Math.round(zoomMini * 100) + '%';
  redesenharMini();
}, { passive: false });
mini?.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !snapshot || snapshot.self?.hp <= 0 || transicaoTeleport.ativa ||
      !vistaMini || vistaMini.planet !== snapshot.planet || vistaMini.area !== snapshot.area) return;
  if (arrastoMini || e.isPrimary === false) return;
  arrastoMini = { id: e.pointerId, x: e.clientX, y: e.clientY, vista: { ...vistaMini },
    caixa: { width: mini.clientWidth, height: mini.clientHeight }, moveu: false };
  mini.setPointerCapture(e.pointerId); e.preventDefault();
});
mini?.addEventListener('pointermove', e => {
  if (!arrastoMini || arrastoMini.id !== e.pointerId || transicaoTeleport.ativa ||
      arrastoMini.vista.planet !== snapshot?.planet || arrastoMini.vista.area !== snapshot?.area) return;
  const dx = e.clientX - arrastoMini.x, dy = e.clientY - arrastoMini.y;
  if (!arrastoMini.moveu && Math.hypot(dx, dy) < 4) return;
  arrastoMini.moveu = true; mini.classList.add('arrastando');
  const mundo = PLANETS[snapshot.planet], limite = areaPorId(snapshot.area) || { x: 0, y: 0, w: mundo.w, h: mundo.h };
  centroMini = { ...arrastarMinimapa(arrastoMini.vista, dx, dy, arrastoMini.caixa, limite), planet: snapshot.planet, area: snapshot.area };
  e.preventDefault(); redesenharMini();
});
function terminarArrastoMini(e) {
  if (!arrastoMini || arrastoMini.id !== e.pointerId) return;
  const gesto = arrastoMini; arrastoMini = null; mini.classList.remove('arrastando');
  if (mini.hasPointerCapture(e.pointerId)) mini.releasePointerCapture(e.pointerId);
  if (e.type !== 'pointerup' || gesto.moveu || !snapshot || transicaoTeleport.ativa || snapshot.self?.hp <= 0 ||
      gesto.vista.planet !== snapshot.planet || gesto.vista.area !== snapshot.area) return;
  const caixa = mini.getBoundingClientRect();
  const ponto = pontoDoMinimapa(e.clientX, e.clientY,
    { left: caixa.left + mini.clientLeft, top: caixa.top + mini.clientTop, width: mini.clientWidth, height: mini.clientHeight }, vistaMini);
  if (!ponto) return;
  e.preventDefault(); keys.clear(); touchVector = { x: 0, y: 0 }; pointerAim = null;
  canvas.focus({ preventScroll: true }); sendInput();
  action({ type: 'moveTo', ...ponto });
  destinoMini = { ...ponto, planet: snapshot.planet, area: snapshot.area, em: performance.now() };
  redesenharMini();
}
for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) mini?.addEventListener(tipo, terminarArrastoMini);
$('minimapCenter').onclick = () => { centroMini = null; redesenharMini(); };
if (mini) new ResizeObserver(ajustarHudMinimapa).observe(mini.closest('.hud-mapa'));
ajustarHudMinimapa();
$('zoomOut').onclick = () => setZoom(zoom / 1.2);
$('zoomIn').onclick = () => setZoom(zoom * 1.2);
const toWorld = event => worldFromPointer(event.clientX, event.clientY, canvas.getBoundingClientRect(), camera);
canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') pointerAim = toWorld(e); });
canvas.addEventListener('pointerdown', e => {
  if (transicaoTeleport.ativa) return;
  if (!snapshot) return; canvas.focus(); const point = toWorld(e);
  const targets = [...snapshot.mobs, ...snapshot.players.filter(p => p.id !== playerId)];
  const target = targets.find(t => Math.hypot(t.x - point.x, t.y - point.y) < (grande(t) ? 45 : 30));
  if (target) action({ type: 'target', id: target.id }); else action({ type: 'moveTo', x: point.x, y: point.y });
});
ligarHud({action,api,snapshot:()=>snapshot,soltarTeclas:()=>{keys.clear();sendInput();},sairConta:()=>entrada?.sair(),selecionarPersonagem:()=>entrada?.voltar(),reverTutorial:()=>tutorial?.iniciar(true)});

let joystickPointer = null;
const joystick = $('joystick'), knob = $('joystickKnob');
function joystickMove(e) {
  if (transicaoTeleport.ativa) return;
  const r = joystick.getBoundingClientRect(), dx = e.clientX - r.left - 50, dy = e.clientY - r.top - 50, d = Math.max(35, Math.hypot(dx, dy));
  touchVector = { x: dx / d, y: dy / d }; knob.style.transform = 'translate(' + touchVector.x * 28 + 'px,' + touchVector.y * 28 + 'px)';
  pointerAim = null; sendInput();
}
joystick.onpointerdown = e => { e.preventDefault(); joystickPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); joystickMove(e); };
joystick.onpointermove = e => { if (e.pointerId === joystickPointer) joystickMove(e); };
const releaseJoystick = () => { joystickPointer = null; touchVector = { x: 0, y: 0 }; knob.style.transform = ''; sendInput(); };
joystick.onpointerup = releaseJoystick; joystick.onpointercancel = releaseJoystick;

// Sprites simples de reserva, usados enquanto as artes carregam.
function sprite(draw, w = 24, h = 32) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; }
const gokuSprite = (gold = false, back = false) => sprite(c => {
  c.fillStyle = '#20232b'; c.fillRect(6, 19, 14, 9);
  c.fillStyle = '#ed8437'; c.fillRect(7, 15, 12, 10); c.fillRect(7, 24, 5, 6); c.fillRect(14, 24, 5, 6);
  c.fillStyle = '#154e7c'; c.fillRect(7, 22, 12, 3); c.fillRect(7, 29, 5, 3); c.fillRect(14, 29, 5, 3); c.fillRect(5, 17, 3, 5); c.fillRect(19, 17, 3, 5);
  c.fillStyle = '#e9ae78'; c.fillRect(4, 15, 3, 6); c.fillRect(20, 15, 3, 6); c.fillRect(9, 7, 9, 8);
  c.fillStyle = gold ? '#f1da66' : '#141d26'; c.beginPath(); c.moveTo(5, 9); c.lineTo(1, 4); c.lineTo(9, 5); c.lineTo(8, 0); c.lineTo(13, 4); c.lineTo(17, 0); c.lineTo(18, 5); c.lineTo(23, 3); c.lineTo(20, 10); c.lineTo(17, 12); c.lineTo(15, 7); c.lineTo(12, 11); c.lineTo(10, 8); c.lineTo(7, 11); c.closePath(); c.fill();
  if (!back) { c.fillStyle = '#fff3d0'; c.fillRect(10, 11, 2, 1); c.fillRect(15, 11, 2, 1); c.fillStyle = '#24313c'; c.fillRect(11, 11, 1, 1); c.fillRect(15, 11, 1, 1); c.fillStyle = '#bd7449'; c.fillRect(12, 14, 3, 1); }
  else { c.fillStyle = '#f4e4b4'; c.fillRect(10, 17, 7, 5); c.fillStyle = '#374337'; c.fillRect(12, 18, 3, 3); }
});
const sprites = { goku: gokuSprite(), gokuBack: gokuSprite(false, true), ssj: gokuSprite(true), ssjBack: gokuSprite(true, true),
  melee: sprite(c => { c.fillStyle = '#376a43'; c.fillRect(7, 16, 12, 11); c.fillRect(5, 25, 5, 5); c.fillRect(16, 25, 5, 5); c.fillStyle = '#78a65c'; c.fillRect(6, 5, 14, 14); c.fillRect(2, 8, 4, 5); c.fillRect(20, 8, 4, 5); c.fillRect(3, 18, 4, 8); c.fillRect(20, 18, 4, 8); c.fillStyle = '#9cc878'; c.fillRect(9, 4, 8, 5); c.fillStyle = '#e8c7b0'; c.fillRect(8, 11, 4, 3); c.fillRect(15, 11, 4, 3); c.fillStyle = '#8d333b'; c.fillRect(10, 12, 2, 1); c.fillRect(15, 12, 2, 1); }),
  ranged: sprite(c => { c.fillStyle = '#40374e'; c.fillRect(7, 17, 13, 11); c.fillRect(6, 26, 5, 5); c.fillRect(16, 26, 5, 5); c.fillStyle = '#ac9bbb'; c.fillRect(7, 4, 12, 13); c.fillRect(3, 18, 4, 8); c.fillRect(20, 18, 4, 8); c.fillStyle = '#6d456a'; c.fillRect(9, 2, 8, 6); c.fillRect(8, 17, 10, 5); c.fillStyle = '#e8d5c5'; c.fillRect(9, 10, 8, 3); c.fillStyle = '#ba5c65'; c.fillRect(11, 10, 2, 2); c.fillRect(15, 10, 2, 2); }),
  tree: sprite(c => { c.fillStyle = '#5a4936'; c.fillRect(13, 15, 5, 17); c.fillStyle = '#173f35'; c.fillRect(5, 12, 25, 10); c.fillRect(2, 7, 27, 10); c.fillStyle = '#2b6349'; c.fillRect(5, 3, 23, 12); c.fillRect(2, 6, 28, 8); c.fillStyle = '#3d7853'; c.fillRect(9, 0, 15, 8); c.fillRect(5, 4, 8, 4); c.fillStyle = '#638758'; c.fillRect(10, 2, 5, 3); }, 32, 34),
  rock: sprite(c => { c.fillStyle = '#3c4140'; c.fillRect(2, 9, 27, 13); c.fillStyle = '#747971'; c.beginPath(); c.moveTo(0, 13); c.lineTo(7, 4); c.lineTo(23, 2); c.lineTo(32, 12); c.lineTo(27, 24); c.lineTo(7, 24); c.closePath(); c.fill(); c.fillStyle = '#96998a'; c.fillRect(7, 7, 13, 3); c.fillRect(5, 11, 4, 3); c.fillStyle = '#555f56'; c.fillRect(18, 16, 11, 6); }, 32, 26)
};
function resize() {
  const r = canvas.getBoundingClientRect(); width = r.width; height = r.height; ratio = 1;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.imageSmoothingEnabled = false;
}
new ResizeObserver(resize).observe(canvas);
function screenPosition(entity, dt) {
  const p = advancePose(renderPositions.get(entity.id), entity, dt, entity.id === playerId);
  renderPositions.set(entity.id, p); return p;
}
function shadow(x, y, size = 16) { if(snapshot?.self?.preferencias?.qualidade==='economica')return; ctx.fillStyle = '#15291e66'; ctx.beginPath(); ctx.ellipse(x, y + 4, size, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
// Placa de nome e vida sobre o personagem (modelo da HUD): texto forte com contorno e barra arredondada.
function placa(x, y, texto, hp, max, cor, largura = 52) {
  ctx.save(); ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 3; ctx.strokeStyle = '#000c'; ctx.strokeText(texto, x, y); ctx.fillStyle = '#fff'; ctx.fillText(texto, x, y);
  if(snapshot?.self?.preferencias?.barrasVida===false){ctx.restore();return;}
  ctx.fillStyle = '#060b18d9'; ctx.beginPath(); ctx.roundRect(x - largura / 2 - 2, y + 4, largura + 4, 9, 4); ctx.fill();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x - largura / 2, y + 6, Math.max(0, largura * hp / max), 5, 3); ctx.fill();
  ctx.restore();
}
function drawPlayer(p, pos, time, somenteCorpo = false) {
  p = apresentarGenkiJogador(p,snapshot.genkiCharges || [],time);
  if (!somenteCorpo) shadow(pos.x, pos.y, 20);
  const opcoesNimbus={flutuar:!snapshot.self?.preferencias?.reduzirAnimacoes};
  const montado=somenteCorpo?(p.montaria==='nimbus'&&!p.dead&&nimbusCarregada()?geometriaNimbus(p,pos,time,opcoesNimbus):null):desenharNimbus(ctx,p,pos,time,opcoesNimbus);
  if(montado){pos=montado.personagem;p={...p,moving:false};}
  const back = p.facing.y < -0.3;
  const image = p.transformed ? (back ? sprites.ssjBack : sprites.ssj) : back ? sprites.gokuBack : sprites.goku;
  const bob = p.moving ? Math.sin(time * 15) * 1.4 : 0;
  // Sem círculo dourado em volta do Super Saiyajin (pedido do Pedro, 11/11/2026), como já foi feito com a Kaioken.
  const rajada = floating.find(e => e.playerId === p.id && e.type === 'kiShot' && time - e.at >= 0 && time - e.at < .36);
  const kame = (snapshot.kamehamehas || []).find(k => k.owner === p.id && (!k.impacto || time-k.impacto.started < .25));
  p = { ...p, rajadaStarted:rajada?.at, kameStarted:kame?.started };
  const strike = floating.find(e => e.playerId === p.id && e.type === 'punch' && time - e.at >= 0 && time - e.at < 0.36);
  const strikeProgress = strike ? Math.min(1, (time - strike.at) / 0.36) : null;
  const hit = floating.some(e => e.targetId === p.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  if (p.dashing && !somenteCorpo) { ctx.globalAlpha = 0.3; drawGoku(ctx, p, { ...pos, x: pos.x - p.facing.x * 23, y: pos.y - p.facing.y * 23 }, time, strikeProgress); ctx.globalAlpha = 1; }
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  if (!drawGoku(ctx, p, pos, time, strikeProgress)) ctx.drawImage(image, Math.round(pos.x - 21), Math.round(pos.y - 49 + bob), 42, 56);
  ctx.restore();
  // Aura envolve o corpo; a recomposição do Kame não cria uma segunda cópia.
  if (!somenteCorpo) desenharCura(ctx, p, pos, time);
  desenharBarreira(ctx, p, pos, time);
  if (somenteCorpo) return;
  placa(pos.x, pos.y - 86, p.name + ' • Nv. ' + p.level, p.hp, p.maxHp, p.id === playerId ? '#3ccf55' : '#5fb6ff');
  if (p.id === playerId) { ctx.fillStyle = '#f9d3a4'; ctx.beginPath(); ctx.moveTo(pos.x - 4, pos.y + 13); ctx.lineTo(pos.x + 4, pos.y + 13); ctx.lineTo(pos.x, pos.y + 18); ctx.fill(); }
}
// Chefe e subchefe são desenhados grandes; o subchefe usa a sentinela ampliada (arte provisória).
const grande = m => m.type === 'boss' || m.type === 'subboss' || m.type === 'oozaruSuper' || m.type === 'oozaruDourado' || m.type === 'freezaBoss';
function drawMob(m, pos, time) {
  const boss = grande(m), size = boss ? 76 : 40, h = boss ? 100 : 53;
  shadow(pos.x, pos.y, boss ? 35 : 17);
  if (snapshot.self?.targetId === m.id) { ctx.strokeStyle = '#f3c47b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, boss ? 39 : 24, boss ? 17 : 11, 0, 0, Math.PI * 2); ctx.stroke(); }
  const hit = floating.some(e => e.targetId === m.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  const phase = ((Number(m.id.replace(/\D/g, '')) || 0) % 16) / 16;
  const attackProgress = mobStrikeProgress(m.strike, time);
  const facing = attackProgress !== null ? m.strike.direction : pos.facing;
  if (m.transicao) auraFreeza(pos.x, pos.y, (time - m.transicao.started) / (m.transicao.until - m.transicao.started), time);
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  // Pássaro e Inseto de Namek voam (art/voadores.mjs); se a folha não carregar, usam o Saibaman e a sentinela.
  const corpoACorpo = ['melee', 'passaro', 'guerreiro'].includes(m.type), voa = m.type in VOADORES;
  const drawn = (voa && drawVoador(ctx, m.type, pos.x, pos.y, time, facing, phase, attackProgress))
    || (m.type === 'guerreiro' && drawGuerreiro(ctx, pos.x, pos.y, m.moving, facing, phase, attackProgress, pos.travelled, time))
    || (m.type === 'freezaBoss' && drawFreezaBoss(ctx, m.forma || 'pe', pos.x, pos.y, m.moving, facing, phase, attackProgress, pos.travelled, time))
    || (m.type in LUTADORES && drawLutador(ctx, m.type, pos.x, pos.y, m.moving, facing, phase, attackProgress, pos.travelled, m.strike?.kind === 'shot', time))
    || (m.type === 'veterano' && drawVeterano(ctx, pos.x, pos.y, m.moving, facing, phase, attackProgress, pos.travelled, m.strike?.kind === 'shot', time)) || (m.type === 'boss'
    ? drawFreeza(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
    : corpoACorpo
      ? drawSaibaman(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
      : drawAlien(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled));
  if (!drawn) ctx.drawImage(m.type === 'boss' ? art.freezaBoss : corpoACorpo ? sprites.melee : sprites.ranged, Math.round(pos.x - size / 2), Math.round(pos.y - h + 8 + (m.moving ? Math.sin(time * 14) : 0)), size, h);
  ctx.restore();
  const topo = voa ? ALTURA_GOKU * VOADORES[m.type].proporcao + ALTURA_DE_VOO : ['guerreiro', 'veterano'].includes(m.type) ? ALTURA_GUERREIRO + 4 : m.type in LUTADORES ? LUTADORES[m.type].altura + 4 : m.type === 'freezaBoss' ? (FREEZA_ALTURA[m.forma] || FREEZA_ALTURA.pe) + 6 : h;
  placa(pos.x, pos.y - topo - 16, m.name + (m.level ? ' • Nv. ' + m.level : ''), m.hp, m.maxHp, boss ? '#ff7a2a' : '#e2342a', boss ? 76 : 52);
}
// Freeza entrando na nave: aura roxa que cresce em volta dele (o clarão e a onda vêm pelo evento freezaNave).
function auraFreeza(x, y, p, time) {
  p = Math.max(0, Math.min(1, p)); const r = 40 + p * 70 + Math.sin(time * 20) * 4;
  ctx.save(); const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, r);
  g.addColorStop(0, '#ffffffcc'); g.addColorStop(0.35, '#e7a0ffaa'); g.addColorStop(1, '#8a2be200');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 40, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// Oozaru Dourado: boca na altura da cabeça, um pouco à frente na direção em que ele olha.
const norm2 = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
function bocaOozaru(m) {
  const pos = renderPositions.get(m.id) || m, f = norm2(m.facing?.x || 0, m.facing?.y || 1);
  return { x: pos.x + f.x * 34, y: pos.y - 128 + f.y * 18 };
}
// Bola negra do Oozaru Dourado (Pedro, 06/11: no lugar do laser). Sai da boca no fim da carga e voa até o centro do
// corpo do alvo (a mira o acompanha); diâmetro = metade da Supernova. Miolo preto, borda roxo-avermelhada, pulsando.
const CENTRO_DO_ALVO = 35;   // altura do meio do corpo do personagem acima dos pés (Goku = 70)
function bolaNegra(m, t, time) {
  if (time < t.lanca) return;
  const p = Math.min(1, (time - t.lanca) / (t.until - t.lanca)), b = bocaOozaru(m), d = NOVA.final / 2;
  const x = b.x + (t.tx - b.x) * p, y = b.y + (t.ty - CENTRO_DO_ALVO - b.y) * p, r = d / 2 * (0.7 + 0.3 * Math.min(1, p * 4)) * (1 + Math.sin(time * 26) * 0.05);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.9); g.addColorStop(0, '#ff3aa0aa'); g.addColorStop(0.5, '#9a1a8a55'); g.addColorStop(1, '#3a003a00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const n = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  n.addColorStop(0, '#3a0a40'); n.addColorStop(0.7, '#0b020d'); n.addColorStop(1, '#2a0630');
  ctx.fillStyle = n; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ff5ad0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c0186aaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.7, time * 8, time * 8 + 2.2); ctx.stroke();
}
// Bola de energia negra carregando na boca durante a mira (cresce até o disparo), à frente da boca.
function cargaLaser(m, t, time) {
  if (time >= t.lanca) return;
  const b = bocaOozaru(m), p = Math.min(1, Math.max(0, (time - t.started) / (t.lanca - t.started)));
  const r = 30 + p * 55 + Math.sin(time * 30) * 4;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, r); g.addColorStop(0, '#d94cff99'); g.addColorStop(0.5, '#7a0a8a55'); g.addColorStop(1, '#3a003a00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// Rachadura deixada pela pancada: imagem achatada no chão, do tamanho da área do golpe; some em 2,2 s.
function rachadura(e, age) {
  const img = art.rachadura; if (!img.complete || !img.naturalWidth || age > 2.2) return;
  const w = e.radius * 2.3, h = w * img.naturalHeight / img.naturalWidth, aparece = Math.min(1, age / 0.06);
  ctx.save(); ctx.globalAlpha = aparece * (age > 1.5 ? (2.2 - age) / 0.7 : 1);
  ctx.drawImage(img, e.x - w / 2, e.y - h / 2, w, h); ctx.restore();
}
// Supernova: a bola cresce acima da mão do Freeza durante a carga e voa até o ponto marcado no chão (o dano é lá).
const NOVA = { inicial: 26, final: 125 };   // diâmetro em unidades do mundo (final ≈ 3× a bola da folha antiga; ajustável)
function bolaSupernova(m, t, time) {
  const pos = renderPositions.get(m.id) || m, mao = { x: pos.x + 6, y: pos.y - FREEZA_ALTURA.nave - 30 };
  let x, y, d;
  if (time < t.lanca) {
    const p = Math.max(0, (time - t.started) / (t.lanca - t.started)), e = p * p * (3 - 2 * p);
    d = NOVA.inicial + (NOVA.final - NOVA.inicial) * e; x = mao.x; y = mao.y - d * 0.45;
  } else {
    const p = Math.min(1, (time - t.lanca) / (t.until - t.lanca)); d = NOVA.final;
    x = mao.x + (t.x - mao.x) * p; y = (mao.y - d * 0.45) + (t.y - 20 - (mao.y - d * 0.45)) * p - Math.sin(p * Math.PI) * 60;
  }
  const img = art.supernova, pulso = 1 + Math.sin(time * 18) * 0.04;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, d * 0.2, x, y, d * 0.9); g.addColorStop(0, '#ffb34766'); g.addColorStop(1, '#ff3a0000');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, d * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (img.complete && img.naturalWidth) ctx.drawImage(img, x - d * pulso / 2, y - d * pulso / 2, d * pulso, d * pulso);
}
function telegraphs(time) {
  for (const m of snapshot.mobs) {
    const t = m.telegraph; if (!t) continue;
    if (t.kind === 'supernova') {   // área no chão que vai se enchendo de vermelho até o impacto
      const p = Math.min(1, Math.max(0, (time - t.started) / (t.until - t.started)));
      ctx.fillStyle = '#ff4a1a30'; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.radius, t.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7a2a55'; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.radius * p, t.radius * 0.6 * p, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.radius, t.radius * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      continue;
    }
    if (t.kind === 'bolaNegra') {   // marca no chão onde a bola vai cair (acompanha o personagem)
      const p = Math.min(1, Math.max(0, (time - t.started) / (t.until - t.started)));
      ctx.fillStyle = '#5a0a6a30'; ctx.beginPath(); ctx.ellipse(t.tx, t.ty, t.radius, t.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a02a9a55'; ctx.beginPath(); ctx.ellipse(t.tx, t.ty, t.radius * p, t.radius * 0.6 * p, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e07aff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(t.tx, t.ty, t.radius, t.radius * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      continue;
    }
    if (t.kind === 'shot' && t.beam) { ctx.strokeStyle = '#e06cff90'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(t.x, t.y - 30); ctx.lineTo(t.x + t.dx * 520, t.y - 30 + t.dy * 520); ctx.stroke(); ctx.setLineDash([]); continue; }
    const progress = Math.min(1, Math.max(0, (time - t.started) / (t.until - t.started)));
    // Projéteis TARGET não exibem linha de mira, pois não são desviáveis.
    if (t.kind === 'shot') continue;
    else { ctx.fillStyle = '#a9423340'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d6745460'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f3b089'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function effects(time) {
  floating = floating.filter(e => time - e.at < (e.type === 'pancada' ? 2.3 : 1.5));
  for (const e of floating) {
    const age = time - e.at; if (age < 0) continue;
    const pref=snapshot?.self?.preferencias||PADRAO_PREFERENCIAS;
    if(e.type==='damage'&&!pref.numerosDano)continue;
    if(!['damage','heal','level'].includes(e.type)&&(!pref.particulas||pref.reduzirAnimacoes))continue;
    if (e.type === 'freezaNave' && age < 1.4) {   // clarão roxo e onda de energia pelo chão
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - age / 1.4);
      ctx.strokeStyle = '#d78bff'; ctx.lineWidth = 10 * (1 - age / 1.4) + 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 40 + age * 380, (40 + age * 380) * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      if (age > 1.0) { ctx.globalAlpha = (1.4 - age) / 0.4 * 0.8; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(e.x, e.y - 50, 140, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    } else if (e.type === 'bolaNegra' && age < 0.7) {   // a bola negra explode no alvo
      const p = age / 0.7; ctx.save(); ctx.globalAlpha = 1 - p;
      const r = e.radius * (0.5 + p * 0.8), g = ctx.createRadialGradient(e.x, e.y - 30, 6, e.x, e.y - 30, r);
      g.addColorStop(0, '#0b020d'); g.addColorStop(0.45, '#5a0a6acc'); g.addColorStop(0.8, '#ff3aa066'); g.addColorStop(1, '#ff3aa000');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 30, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (e.type === 'pancada' && age < 0.7) {   // punhos no chão: onda de poeira e rachadura em volta
      const p = age / 0.7; ctx.save(); ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#d9b37a'; ctx.lineWidth = 8 * (1 - p) + 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.radius * (0.4 + p * 0.7), e.radius * (0.4 + p * 0.7) * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();   // a rachadura entra como imagem (pedido do Pedro, 06/11), quando a arte chegar
    } else if (e.type === 'supernova' && age < 0.9) {   // explosão da Supernova no ponto marcado
      const p = age / 0.9; ctx.save(); ctx.globalAlpha = 1 - p; ctx.globalCompositeOperation = 'lighter';
      const r = e.radius * (0.6 + p * 0.7), g = ctx.createRadialGradient(e.x, e.y - 20, 10, e.x, e.y - 20, r);
      g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffb347'); g.addColorStop(0.75, '#ff3d1a'); g.addColorStop(1, '#ff000000');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 20, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (e.type === 'punch' && age < 0.18) {
      ctx.strokeStyle = '#ffe4a7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x + e.dx * 30, e.y - 10 + e.dy * 30, 17, -1.1, 1.1); ctx.stroke();
    } else if (['damage', 'heal', 'level'].includes(e.type)) {
      ctx.globalAlpha = Math.max(0, 1 - age / 1.5); ctx.font = e.type === 'level' ? 'bold 18px monospace' : 'bold 14px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = e.type === 'damage' ? '#ffe2b0' : e.type === 'level' ? '#f3d76d' : '#b7ec9d'; ctx.strokeStyle = '#182522'; ctx.lineWidth = 3;
      const text = e.type === 'damage' ? '-' + e.amount : e.type === 'level' ? 'NÍVEL ' + e.level : e.text;
      ctx.strokeText(text, e.x, e.y - 40 - age * 25); ctx.fillText(text, e.x, e.y - 40 - age * 25); ctx.globalAlpha = 1;
    }
  }
}
// Marcadores do minimapa com contorno preto e borda branca: aparecem em qualquer fundo
// (areia, mata, água, terra vermelha). O jogador usa magenta, cor que o mapa não tem e que
// não se confunde com os mobs (vermelho/laranja); outros jogadores, azul-claro e menores.
function miniMarker(x, y, r, color) {
  mctx.beginPath(); mctx.arc(x, y, r + 2, 0, Math.PI * 2); mctx.fillStyle = '#000'; mctx.fill();
  mctx.beginPath(); mctx.arc(x, y, r + 1, 0, Math.PI * 2); mctx.fillStyle = '#fff'; mctx.fill();
  mctx.beginPath(); mctx.arc(x, y, r, 0, Math.PI * 2); mctx.fillStyle = color; mctx.fill();
}
// Jogador: anel pulsando (chama o olho numa olhada rápida), seta para onde está virado e o marcador.
function drawMiniSelf(x, y, facing) {
  const pulse = (performance.now() / 1100) % 1;
  mctx.beginPath(); mctx.arc(x, y, 6 + pulse * 9, 0, Math.PI * 2);
  mctx.strokeStyle = `rgba(255, 43, 214, ${0.9 * (1 - pulse)})`; mctx.lineWidth = 2.5; mctx.stroke();
  const a = Math.atan2(facing?.y || 1, facing?.x || 0), tip = (d, da) => [x + Math.cos(a + da) * d, y + Math.sin(a + da) * d];
  mctx.beginPath(); mctx.moveTo(...tip(11, 0)); mctx.lineTo(...tip(6, 0.75)); mctx.lineTo(...tip(6, -0.75)); mctx.closePath();
  mctx.fillStyle = '#fff'; mctx.fill(); mctx.strokeStyle = '#000'; mctx.lineWidth = 1.5; mctx.stroke();
  miniMarker(x, y, 4, '#ff2bd6');
}
// Minimapa da região em volta do jogador (decisão do Pedro, 29/10): mostra um pedaço do mundo
// centrado nele, preso às bordas do mapa; mobs, outros jogadores e o que a câmera vê, no mesmo recorte.
function drawMinimap(world = PLANETS.namek, area = null) {
  if (!mctx) return; // sem minimapa na página
  const mapW = mini.width, mapH = mini.height, self = snapshot.players.find(p => p.id === playerId);
  // Preso à área fechada, como a câmera: o minimapa mostra só onde dá para ir.
  if (centroMini && (centroMini.planet !== snapshot.planet || centroMini.area !== snapshot.area)) centroMini = null;
  const vista = vistaMinimapa(world, area, centroMini || self, mapW, mapH, zoomMini);
  vistaMini = { ...vista, planet: snapshot.planet, area: snapshot.area };
  const { x: ox, y: oy, w: vw, h: vh } = vista;
  const sx = mapW / vw, sy = mapH / vh, X = x => (x - ox) * sx, Y = y => (y - oy) * sy;
  mctx.fillStyle = world.fundo || '#4f8a3a'; mctx.fillRect(0, 0, mapW, mapH);
  const solo = world.solo && soloDe(world);
  if (solo?.complete && solo.naturalWidth) {
    const kx = solo.naturalWidth / world.w, ky = solo.naturalHeight / world.h;
    mctx.imageSmoothingEnabled = true;
    mctx.drawImage(solo, ox * kx, oy * ky, vw * kx, vh * ky, 0, 0, mapW, mapH);
  }
  for (const o of portaisAqui()) miniMarker(X(o.x), Y(o.y), 3, corDoPortal(o));
  for (const mob of snapshot.mobs) { mctx.fillStyle = grande(mob) ? '#ff9369' : '#d96049'; mctx.beginPath(); mctx.arc(X(mob.x), Y(mob.y), grande(mob) ? 4 : 3, 0, Math.PI * 2); mctx.fill(); }
  for (const p of snapshot.players) if (p.id !== playerId) miniMarker(X(p.x), Y(p.y), 2.5, '#5fd8ff');
  mctx.strokeStyle = '#fff0c488'; mctx.lineWidth = 1; mctx.strokeRect(X(camera.x), Y(camera.y), width / camera.scale * sx, height / camera.scale * sy);
  if (self) drawMiniSelf(X(self.x), Y(self.y), self.facing);
  if (destinoMini && destinoMini.planet === snapshot.planet && destinoMini.area === snapshot.area) {
    const idade = (performance.now() - destinoMini.em) / 1000;
    if (idade < 1.2) {
      mctx.save(); mctx.globalAlpha = 1 - idade / 1.2; mctx.strokeStyle = '#7dff9e'; mctx.lineWidth = 2;
      mctx.beginPath(); mctx.arc(X(destinoMini.x), Y(destinoMini.y), 5 + idade * 12, 0, Math.PI * 2); mctx.stroke(); mctx.restore();
    } else destinoMini = null;
  }
}
// Portais do lugar onde o jogador está. Cor e texto pelo destino: portal de uma hunt leva a cor dela;
// portal com vários destinos (saída de hunt) e o caminho Terra ↔ Vila ficam azuis.
const portaisAqui = () => PORTAIS.filter(o => o.planet === snapshot.planet && o.area === (snapshot.area || null));
const corDoPortal = o => o.destinos.length === 1 ? COR_DESTINO[o.destinos[0]] : COR_DESTINO.saida;
function textoDoPortal(o) {
  if (o.planet === 'terra') return 'Planetas';
  if (o.destinos.length > 1) return 'Saída';
  const d = lugar(o.destinos[0]);
  return (d.planet !== snapshot.planet ? PLANETS[d.planet].name : d.name) + (d.nivel ? ' · Nv. ' + d.nivel[0] + '–' + d.nivel[1] : '');
}
// Encostar no portal abre a janela de destinos uma vez; só abre de novo depois de sair do círculo
// (quem chega por um portal aparece fora dele, e fechar a janela não faz ela voltar parada ali).
// Com a caça automática ligada não abre: passar por cima da saída perseguindo um mob não é querer sair.
let portalEncostado = null;
function verificarPortal(pos) {
  if (transicaoTeleport.ativa) return;
  const o = portaisAqui().find(o => Math.hypot(o.x - pos.x, o.y - pos.y) <= RAIO_PORTAL);
  if (o && o.id !== portalEncostado && !snapshot.self?.autoHunt && !document.querySelector('dialog[open]:not(.mochila):not(.auto-hunt-panel):not(.bestiario)')) { keys.clear(); touchVector = { x: 0, y: 0 }; sendInput(); abrirPortal(o); }
  portalEncostado = o ? o.id : null;
}

// Ordem de desenho de um personagem: pela posição dos pés, mas quem pisa à frente da curva da base
// de uma casa (nas laterais a base sobe) vai na frente dela, mesmo acima da linha da base.
// Vulcão: a profundidade dele é o ponto mais baixo do pé, mas quem está ao lado, abaixo da borda da encosta naquela
// coluna, está na frente (relato do Pedro, 05/11: "entrando debaixo do vulcão").
function frenteDoVulcao(o, x, escala) {
  const f = o.frente, i = Math.round((x / escala - f.x0) / f.passo);
  return i >= 0 && i < f.y.length && f.y[i] != null ? f.y[i] * escala : null;
}
function profundidade(pos, casas, escala = 1, vulcoes = []) {
  let y = pos.y;
  for (const o of vulcoes) if (pos.y < o.y * escala) { const f = frenteDoVulcao(o, pos.x, escala); if (f !== null && pos.y >= f) y = Math.max(y, o.y * escala + 0.01); }
  for (const c of casas) if (pos.y < c.y) { const f = frenteDaCasa(c, pos.x); if (f !== null && pos.y >= f) y = Math.max(y, c.y + 0.01); }
  return y;
}
// Recorte do solo do Vegeta desenhado de novo no mesmo lugar (px do solo de 8192 → mundo).
function drawObjetoVegeta(o, escala) {
  const img = objetoVegeta(o.id); if (!img.complete || !img.naturalWidth) return;
  const k = escala / VEGETA_OBJETOS_ESCALA, [x, y, w, h] = o.img;
  ctx.drawImage(img, x * k, y * k, w * k, h * k);
}
// Sempre cobre os inimigos; a direção decide a profundidade em relação ao lançador.
function desenharKameSobreInimigos(efeito, tempo, lancador, pos) {
  desenharKameComProfundidade(ctx, efeito, tempo,
    lancador && pos ? () => drawPlayer(lancador, pos, tempo, true) : null);
}
function frame(now) {
  const fps=snapshot?.self?.preferencias?.fps||60;
  if(now-lastFrame<1000/fps-.5){requestAnimationFrame(frame);return;}
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = false;
  if (!snapshot) {
    ctx.fillStyle = '#2f4a3b'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#9db78f'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillText('PREPARANDO O MUNDO', width / 2, height / 2); requestAnimationFrame(frame); return;
  }
  const time = snapshot.time + Math.min(0.2, (now - receivedAt) / 1000);
  // Planeta de hunt tem solo desenhado, áreas, casas, mercador e decoração; a Terra (lobby) é um gramado.
  const world = PLANETS[snapshot.planet] || PLANETS.namek, comSolo = Boolean(world.solo), aquiNoPlaneta = o => o.planet === world.id;
  const casas = HOUSES.filter(aquiNoPlaneta), mercadores = MERCADORES.filter(aquiNoPlaneta);
  const vulcoesAqui = world.id === 'vegeta' ? VEGETA_OBJETOS.filter(o => o.tipo === 'vulcao') : [];
  const self = snapshot.players.find(p => p.id === playerId);
  for (const entity of [...snapshot.players, ...snapshot.mobs]) {
    if (entity.id === playerId && !entity.dead && !entity.dashing && !entity.charge) {
      const iv = inputVector(); let px = entity.x, py = entity.y;
      if (iv.x || iv.y) { const el = Math.min(0.2, (now - receivedAt) / 1000); [px, py] = deslocar(snapshot.planet, entity.x, entity.y, iv.x, iv.y, (snapshot.self?.stats.mobility || 175) * el, 15, snapshot.self?.area); }
      screenPosition({ ...entity, x: px, y: py }, dt);
    } else screenPosition(entity, dt);
  }
  const position = self ? renderPositions.get(self.id) : { x: world.w / 2, y: world.h / 2 };
  if (self && !self.dead) verificarPortal(position);
  const area = comSolo ? areaPorId(snapshot.area) : null;
  // Câmera presa à área: a tela termina onde a área termina, sem borda nem escurecimento (pedido do Pedro).
  camera = cameraView(position, width, height, zoom, world.w, world.h, area);
  ctx.save(); ctx.scale(camera.scale, camera.scale); ctx.translate(-camera.x, -camera.y);
  // Decoração perto da tela (sombra no chão agora; o objeto entra na ordem de profundidade abaixo).
  const decoVisivel = comSolo ? DECORACAO.filter(d => d.planet === world.id && d.x > camera.x - 300 && d.x < camera.x + width / camera.scale + 300
    && d.y > camera.y - 100 && d.y < camera.y + height / camera.scale + 400) : [];
  if (comSolo) {
    if (drawGroundImage(ctx, soloDe(world), world, camera, width, height)) { for (const c of casas) drawHouseGround(ctx, c); for (const m of mercadores) drawMarket(ctx, m); }
    else { ctx.fillStyle = world.fundo; ctx.fillRect(0, 0, world.w, world.h); } // solo ainda carregando
    const segura = zonaSeguraDaHunt(snapshot.area);
    if (segura) desenharRachaduras(ctx, segura, snapshot.area);
    for (const o of portaisAqui()) drawPortal(ctx, o, time, corDoPortal(o), textoDoPortal(o), RAIO_PORTAL);
    for (const d of decoVisivel) drawSombraDecoracao(ctx, d, DECORACAO_ESCALA);
    telegraphs(time);
    // Carga da bola negra: só um brilho ATRÁS do Oozaru (a bola negra já está na boca no desenho da folha) — a cabeça fica
    // à mostra durante toda a carga (Pedro, 06/11).
    for (const m of snapshot.mobs) if (m.telegraph?.kind === 'bolaNegra') cargaLaser(m, m.telegraph, time);
    // Rachadura da pancada no chão (imagem do Pedro), por baixo de todo mundo, sumindo aos poucos.
    for (const e of floating) if (e.type === 'pancada' && time >= e.at) rachadura(e, time - e.at);
    for (const l of snapshot.loot) { shadow(l.x, l.y, 7); ctx.fillStyle = l.item.startsWith('seed') ? '#a4cf72' : l.item === 'crystal' ? '#83d2d3' : '#d7c8a3'; ctx.fillRect(l.x - 5, l.y - 6 + Math.sin(time * 3) * 2, 10, 9); ctx.fillStyle = '#edf3c1'; ctx.fillRect(l.x - 2, l.y - 8, 4, 3); }
  } else {
    // Planeta Terra: gramado verde limpo e seguro (tela inicial).
    ctx.fillStyle = '#5a8f3c'; ctx.fillRect(0, 0, world.w, world.h);
    ctx.strokeStyle = '#3c6428'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, world.w, world.h);
    for (const o of portaisAqui()) drawPortal(ctx, o, time, corDoPortal(o), textoDoPortal(o), RAIO_PORTAL);
  }
  const drawables = [
    ...(comSolo ? OBSTACLES.filter(aquiNoPlaneta).map(o => ({ y: o.y, draw: () => { if (o.type === 'tree') { shadow(o.x, o.y, o.r); if (!drawTree(ctx, o)) ctx.drawImage(sprites.tree, o.x - 61, o.y - 116, 122, 130); } else if (!drawRock(ctx, o)) { shadow(o.x, o.y, o.r); ctx.drawImage(sprites.rock, o.x - o.r, o.y - o.r * 1.15, o.r * 2, o.r * 1.7); } } })) : []),
    ...mercadores.map(m => ({ y: m.y, draw: () => drawVendor(ctx, m) })),
    // Árvores, arbustos e pedras: só os que estão perto da tela entram na ordem de profundidade.
    ...(comSolo ? decoVisivel.map(d => ({ y: d.y, draw: () => drawDecoracao(ctx, d, DECORACAO_ESCALA) })) : []),
    // Árvores e cristais do Vegeta (recortados do solo): entram pela base, como as casas.
    ...(world.id === 'vegeta' ? VEGETA_OBJETOS.map(o => ({ y: o.y * world.escala, draw: () => drawObjetoVegeta(o, world.escala) })) : []),
    // Casas entram na ordem de profundidade pela base: quem está acima da base passa por trás.
    ...casas.map(c => ({ y: c.y, draw: () => drawHouse(ctx, c) })),
    ...snapshot.players.map(p => ({ y: profundidade(renderPositions.get(p.id), casas, world.escala, vulcoesAqui), draw: () => drawPlayer(p, renderPositions.get(p.id), time) })),
    ...snapshot.mobs.map(m => ({ y: profundidade(renderPositions.get(m.id), casas, world.escala, vulcoesAqui), draw: () => drawMob(m, renderPositions.get(m.id), time) }))
  ].sort((a, b) => a.y - b.y);
  for (const d of drawables) if (d.y > camera.y - 150 && d.y < camera.y + height / camera.scale + 350) d.draw();
  // Sem recorte: para baixo o feixe cobre o lançador; para cima o sprite recompõe a oclusão.
  for (const p of snapshot.players) if (p.charge) {
    const pos = renderPositions.get(p.id) || p;
    desenharKameSobreInimigos({ ...p.charge, ...origemKame(pos, p.charge.direction, snapshot.mobs.find(m => m.id === p.charge.targetId)) }, Math.min(Math.max(time, p.charge.started), p.charge.started + KAME.primeiroFeixe * KAME.quadro - .001), p, pos);
  }
  for (const k of snapshot.kamehamehas || []) {
    const pos = renderPositions.get(k.owner);
    desenharKameSobreInimigos(pos && !k.impacto ? { ...k, ...origemKame(pos, k.direction, snapshot.mobs.find(m => m.id === k.targetId)) } : k, time, snapshot.players.find(p => p.id === k.owner), pos);
  }
  for (const g of snapshot.genkiCharges || []) {
    const dono = snapshot.players.find(p => p.id === g.owner);
    let pos = renderPositions.get(g.owner) || g;
    if (dono?.montaria === 'nimbus' && !dono.dead && nimbusCarregada())
      pos = geometriaNimbus({...dono,facing:g.direction},pos,time,{flutuar:!snapshot.self?.preferencias?.reduzirAnimacoes}).personagem;
    desenharGenki(ctx,'carga',g,time,{...pos,alturaCanalizacao:dono && !dono.transformed ? POSE_GENKI.alturaCanalizacao : 62});
  }
  for (const s of snapshot.projectiles) {
    const px = s.x + s.dx * s.speed * Math.min(0.07, (now - receivedAt) / 1000), py = s.y + s.dy * s.speed * Math.min(0.07, (now - receivedAt) / 1000);
    if (s.kind === 'mobKiTarget') {
      const alvo=renderPositions.get(s.alvoId),distancia=alvo?Math.hypot(alvo.x-s.x,alvo.y-s.y):Infinity;
      const avanco=Math.min(s.speed*Math.min(.07,(now-receivedAt)/1000),distancia);
      const pos={x:s.x+s.dx*avanco,y:s.y+s.dy*avanco};
      if(desenharProjetilMob(ctx,s,pos,time,camera.scale))continue;
    }
    if (s.kind === 'deathbeam') { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#d65cffaa'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(px - s.dx * 70, py - 30 - s.dy * 70); ctx.lineTo(px, py - 30); ctx.stroke(); ctx.strokeStyle = '#fff3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - s.dx * 70, py - 30 - s.dy * 70); ctx.lineTo(px, py - 30); ctx.stroke(); ctx.restore(); continue; }
    if (s.kind === 'genki') desenharGenki(ctx, 'voo', s, time, { x: px, y: py });
    else { ctx.strokeStyle = s.ownerType === 'player' ? '#b7edff' : '#f3ba8d'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - s.dx * 12, py - s.dy * 12); ctx.lineTo(px, py); ctx.stroke(); ctx.lineCap = 'butt'; }
  }
  for (const g of snapshot.genkiExplosions || []) desenharGenki(ctx, 'explosao', g, time);
  for (const m of snapshot.mobs) if (m.telegraph?.kind === 'supernova') bolaSupernova(m, m.telegraph, time);
  for (const m of snapshot.mobs) if (m.telegraph?.kind === 'bolaNegra') bolaNegra(m, m.telegraph, time);
  effects(time);
  ctx.restore(); if (++miniTick % 4 === 0) drawMinimap(world, area); requestAnimationFrame(frame);
}
carregarProjetilMob();
resize(); requestAnimationFrame(frame);
entrada=montarEntrada({entrarNoMundo,sairDoMundo,ajustarAudio:p=>trilhaSonora.configurar(p),preferenciasAudio:()=>trilhaSonora.preferencias});
tutorial=instalarTutorial({entrada,liberarTeclas:()=>{keys.clear();touchVector={x:0,y:0};sendInput();}});
window.addEventListener('pageshow',e=>{if(e.persisted)entrada.voltar();});
