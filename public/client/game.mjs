import { CONFIG, ZONES, OBSTACLES, MERCHANT, PLANETS, HOUSES, PORTAIS, RAIO_PORTAL, areaPorId, lugar } from '../shared/index.mjs';
import { deslocar } from '../shared/passagem.mjs';
import { frenteDaCasa } from '../shared/config.mjs';
import { art, CLEARINGS, drawTerrain, drawGroundImage, drawMarket, drawHouse, drawHouseGround, drawTree, drawRock, drawVendor, drawAlien, drawSaibaman, drawGoku, drawFreeza, drawPortal, drawVoador, VOADORES, ALTURA_DE_VOO, ALTURA_GOKU, drawGuerreiro, ALTURA_GUERREIRO } from '../art/index.mjs';
import { $, notify, atualizarHud, ligarHud, alternarCaca, abrirPortal, COR_DESTINO } from './hud.mjs';
import { CAMERA, clampZoom, zoomFromWheel, cameraView, worldFromPointer, advancePose, mobStrikeProgress } from '../render/camera.mjs';

// O mapa e o minimapa são do jogo, não da HUD: o mapa é obrigatório; o minimapa, se existir.
const canvas = document.getElementById('world'), ctx = canvas.getContext('2d'), mini = document.getElementById('minimap'), mctx = mini?.getContext('2d');
const keys = new Set(), renderPositions = new Map(), seenEvents = new Set();
let snapshot = null, session = '', playerId = '', eventSource = null, receivedAt = 0, width = 900, height = 600, ratio = 1;
let camera = { x: 0, y: 0, scale: 1 }, zoom = CAMERA.zoomPadrao, pointerAim = null, touchVector = { x: 0, y: 0 }, lastUI = 0, sendingInput = false;
let floating = [], lastFrame = performance.now(), connectionError = false, miniTick = 0;
async function api(path, data = {}) {
  const res = await fetch('/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sessão desconectada. Recarregue a página.' : 'Não foi possível executar a ação.');
  return res.json();
}
function action(data) {
  if (!session || !snapshot) return;
  api('action', data).catch(e => notify(e.message));
}
function connected(ok) {
  connectionError = !ok; $('connection').textContent = ok ? 'Servidor conectado' : 'Reconectando…';
  $('connection').classList.toggle('offline', !ok);
}
async function join(name, previousToken) {
  const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, token: previousToken }) });
  if (!res.ok) throw new Error('Não foi possível entrar. Confirme se o servidor está rodando.');
  const data = await res.json(); session = data.token; playerId = data.playerId;
  sessionStorage.setItem('dbi-session', session); localStorage.setItem('dbi-last-session', session); localStorage.setItem('dbi-name', name);
  if (eventSource) eventSource.close();
  eventSource = new EventSource('/api/events?session=' + encodeURIComponent(session));
  eventSource.onopen = () => connected(true);
  eventSource.onerror = () => connected(false);
  eventSource.onmessage = event => {
    try {
      snapshot = JSON.parse(event.data); receivedAt = performance.now();
      for (const effect of snapshot.events) {
        if (seenEvents.has(effect.id)) continue;
        seenEvents.add(effect.id);
        if (effect.type === 'message') notify(effect.text);
        else floating.push(effect);
      }
      if (seenEvents.size > 2000) { const items = [...seenEvents]; items.slice(0, 1000).forEach(id => seenEvents.delete(id)); }
      if (performance.now() - lastUI > 90) { atualizarHud(snapshot, playerId); lastUI = performance.now(); }
    } catch (e) { console.error('Falha ao ler estado do jogo:', e.message); }
  };
  if ($('welcomeDialog').open) $('welcomeDialog').close();
  notify(data.resumed ? 'Seu personagem foi recuperado.' : 'Bem-vindo! Entre no portal para ir a Namekusei.');
}


function inputVector() {
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
document.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || document.querySelector('dialog[open]')) return;
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) e.preventDefault();
  keys.add(key); sendInput(); if (e.repeat) return;
  const skills = { '1': 'kame', '2': 'kaioken', '3': 'barrier', '5': 'genki', ' ': 'basic', 'shift': 'dash' };
  // 6 e 7: semente e poção de Ki, na barra de atalhos da HUD nova (R e Q continuam valendo).
  if (skills[key]) action({ type: 'skill', skill: skills[key] });
  else if (key === '4' || key === 't') action({ type: 'transform' });
  else if (key === 'f') action({ type: 'food' });
  else if (key === 'q' || key === '7') action({ type: 'potion' });
  else if (key === 'r' || key === '6') action({ type: 'seed' });
  else if (key === 'h') alternarCaca();
});
document.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); sendInput(); });
window.addEventListener('blur', () => { keys.clear(); touchVector = { x: 0, y: 0 }; sendInput(); });
window.addEventListener('pagehide', () => {
  if (session) fetch('/api/save', { method: 'POST', headers: { Authorization: 'Bearer ' + session }, keepalive: true }).catch(() => {});
});
function setZoom(value) {
  zoom = clampZoom(value);
  $('zoomLabel').textContent = Math.round(zoom * 100) + '%';
  $('zoomOut').disabled = zoom <= CAMERA.zoomMinimo;
  $('zoomIn').disabled = zoom >= CAMERA.zoomMaximo;
  // Do not keep an aim point derived from the old camera scale.
  pointerAim = null;
}
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  setZoom(zoomFromWheel(zoom, event.deltaY, event.deltaMode));
}, { passive: false });
$('zoomOut').onclick = () => setZoom(zoom / 1.2);
$('zoomIn').onclick = () => setZoom(zoom * 1.2);
const toWorld = event => worldFromPointer(event.clientX, event.clientY, canvas.getBoundingClientRect(), camera);
canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') pointerAim = toWorld(e); });
canvas.addEventListener('pointerdown', e => {
  if (!snapshot) return; canvas.focus(); const point = toWorld(e);
  const targets = [...snapshot.mobs, ...snapshot.players.filter(p => p.id !== playerId)];
  const target = targets.find(t => Math.hypot(t.x - point.x, t.y - point.y) < (grande(t) ? 45 : 30));
  if (target) action({ type: 'target', id: target.id }); else action({ type: 'moveTo', x: point.x, y: point.y });
});
ligarHud({ action, api, snapshot: () => snapshot, soltarTeclas: () => { keys.clear(); sendInput(); } });
$('joinForm').onsubmit = async event => { event.preventDefault(); const button = event.target.querySelector('button'); button.disabled = true; try { await join($('nickname').value); } catch (e) { notify(e.message); } finally { button.disabled = false; } };

let joystickPointer = null;
const joystick = $('joystick'), knob = $('joystickKnob');
function joystickMove(e) {
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
function shadow(x, y, size = 16) { ctx.fillStyle = '#15291e66'; ctx.beginPath(); ctx.ellipse(x, y + 4, size, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
// Placa de nome e vida sobre o personagem (modelo da HUD): texto forte com contorno e barra arredondada.
function placa(x, y, texto, hp, max, cor, largura = 52) {
  ctx.save(); ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 3; ctx.strokeStyle = '#000c'; ctx.strokeText(texto, x, y); ctx.fillStyle = '#fff'; ctx.fillText(texto, x, y);
  ctx.fillStyle = '#060b18d9'; ctx.beginPath(); ctx.roundRect(x - largura / 2 - 2, y + 4, largura + 4, 9, 4); ctx.fill();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x - largura / 2, y + 6, Math.max(0, largura * hp / max), 5, 3); ctx.fill();
  ctx.restore();
}
function drawPlayer(p, pos, time) {
  shadow(pos.x, pos.y, 20);
  const back = p.facing.y < -0.3;
  const image = p.transformed ? (back ? sprites.ssjBack : sprites.ssj) : back ? sprites.gokuBack : sprites.goku;
  const bob = p.moving ? Math.sin(time * 15) * 1.4 : 0;
  if (p.transformed) { ctx.strokeStyle = '#f1d75a88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pos.x, pos.y - 20, 28 + Math.sin(time * 10) * 3, 42, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (p.id === playerId && snapshot.self?.kaiokenActive) { ctx.strokeStyle = '#ff4c43aa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(pos.x, pos.y - 20, 31 + Math.sin(time * 18) * 3, 44, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (p.id === playerId && snapshot.self?.barrierActive) { const r = 33 + Math.sin(time * 12) * 2; ctx.strokeStyle = '#66dfffcc'; ctx.lineWidth = 2.5; ctx.fillStyle = '#4bc5ff18'; ctx.beginPath(); ctx.arc(pos.x, pos.y - 22, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  const strike = floating.find(e => e.playerId === p.id && e.type === 'punch' && time - e.at >= 0 && time - e.at < 0.36);
  const strikeProgress = strike ? Math.min(1, (time - strike.at) / 0.36) : null;
  const hit = floating.some(e => e.targetId === p.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  if (p.dashing) { ctx.globalAlpha = 0.3; drawGoku(ctx, p, { ...pos, x: pos.x - p.facing.x * 23, y: pos.y - p.facing.y * 23 }, time, strikeProgress); ctx.globalAlpha = 1; }
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  if (!drawGoku(ctx, p, pos, time, strikeProgress)) ctx.drawImage(image, Math.round(pos.x - 21), Math.round(pos.y - 49 + bob), 42, 56);
  ctx.restore();
  if (p.charge) { ctx.fillStyle = '#bdefff'; ctx.beginPath(); ctx.arc(pos.x + p.facing.x * 26, pos.y - 16 + p.facing.y * 18, 7 + Math.sin(time * 22) * 2, 0, Math.PI * 2); ctx.fill(); }
  placa(pos.x, pos.y - 86, p.name + ' • Nv. ' + p.level, p.hp, p.maxHp, p.id === playerId ? '#3ccf55' : '#5fb6ff');
  if (p.id === playerId) { ctx.fillStyle = '#f9d3a4'; ctx.beginPath(); ctx.moveTo(pos.x - 4, pos.y + 13); ctx.lineTo(pos.x + 4, pos.y + 13); ctx.lineTo(pos.x, pos.y + 18); ctx.fill(); }
}
// Chefe e subchefe são desenhados grandes; o subchefe usa a sentinela ampliada (arte provisória).
const grande = m => m.type === 'boss' || m.type === 'subboss';
function drawMob(m, pos, time) {
  const boss = grande(m), size = boss ? 76 : 40, h = boss ? 100 : 53;
  shadow(pos.x, pos.y, boss ? 35 : 17);
  if (snapshot.self?.targetId === m.id) { ctx.strokeStyle = '#f3c47b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, boss ? 39 : 24, boss ? 17 : 11, 0, 0, Math.PI * 2); ctx.stroke(); }
  const hit = floating.some(e => e.targetId === m.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  const phase = ((Number(m.id.replace(/\D/g, '')) || 0) % 16) / 16;
  const attackProgress = mobStrikeProgress(m.strike, time);
  const facing = attackProgress !== null ? m.strike.direction : pos.facing;
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  // Pássaro e Inseto de Namek voam (art/voadores.mjs); se a folha não carregar, usam o Saibaman e a sentinela.
  const corpoACorpo = ['melee', 'passaro', 'guerreiro'].includes(m.type), voa = m.type in VOADORES;
  const drawn = (voa && drawVoador(ctx, m.type, pos.x, pos.y, time, facing, phase, attackProgress))
    || (m.type === 'guerreiro' && drawGuerreiro(ctx, pos.x, pos.y, m.moving, facing, phase, attackProgress, pos.travelled)) || (m.type === 'boss'
    ? drawFreeza(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
    : corpoACorpo
      ? drawSaibaman(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
      : drawAlien(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled));
  if (!drawn) ctx.drawImage(m.type === 'boss' ? art.freezaBoss : corpoACorpo ? sprites.melee : sprites.ranged, Math.round(pos.x - size / 2), Math.round(pos.y - h + 8 + (m.moving ? Math.sin(time * 14) : 0)), size, h);
  ctx.restore();
  const topo = voa ? ALTURA_GOKU * VOADORES[m.type].proporcao + ALTURA_DE_VOO : m.type === 'guerreiro' ? ALTURA_GUERREIRO + 4 : h;
  placa(pos.x, pos.y - topo - 16, m.name + (m.level ? ' • Nv. ' + m.level : ''), m.hp, m.maxHp, boss ? '#ff7a2a' : '#e2342a', boss ? 76 : 52);
}
function telegraphs(time) {
  for (const m of snapshot.mobs) {
    const t = m.telegraph; if (!t) continue;
    const progress = Math.min(1, Math.max(0, (time - t.started) / (t.until - t.started)));
    if (t.kind === 'shot') { ctx.strokeStyle = '#f5a37ca0'; ctx.lineWidth = 7; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + t.dx * 240, t.y + t.dy * 240); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.fillStyle = '#a9423340'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d6745460'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f3b089'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function effects(time) {
  floating = floating.filter(e => time - e.at < 1.5);
  for (const e of floating) {
    const age = time - e.at; if (age < 0) continue;
    if (e.type === 'beam' && age < 0.35) {
      ctx.globalAlpha = Math.max(0, 1 - age / 0.35); ctx.lineCap = 'round'; ctx.strokeStyle = '#4bb9e899'; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(e.x, e.y - 12); ctx.lineTo(e.bx, e.by - 12); ctx.stroke(); ctx.strokeStyle = '#d7fbff'; ctx.lineWidth = 11; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = 'butt';
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
const MINIMAPA_VISTA = 2400; // largura do pedaço de mundo mostrado (a altura segue a proporção do minimapa)
function drawMinimap(onNamek = true, world = PLANETS.namek, area = null) {
  if (!mctx) return; // sem minimapa na página
  const mapW = mini.width, mapH = mini.height, self = snapshot.players.find(p => p.id === playerId);
  // Preso à área fechada, como a câmera: o minimapa mostra só onde dá para ir.
  const lim = area || { x: 0, y: 0, w: world.w, h: world.h };
  const vw = Math.min(MINIMAPA_VISTA, lim.w), vh = Math.min(vw * mapH / mapW, lim.h);
  const cx = self ? self.x : lim.x + lim.w / 2, cy = self ? self.y : lim.y + lim.h / 2;
  const ox = Math.max(lim.x, Math.min(lim.x + lim.w - vw, cx - vw / 2)), oy = Math.max(lim.y, Math.min(lim.y + lim.h - vh, cy - vh / 2));
  const sx = mapW / vw, sy = mapH / vh, X = x => (x - ox) * sx, Y = y => (y - oy) * sy;
  mctx.fillStyle = onNamek ? '#385a2d' : '#4f8a3a'; mctx.fillRect(0, 0, mapW, mapH);
  const solo = art.namekSolo;
  if (onNamek && solo.complete && solo.naturalWidth) {
    const kx = solo.naturalWidth / world.w, ky = solo.naturalHeight / world.h;
    mctx.imageSmoothingEnabled = true;
    mctx.drawImage(solo, ox * kx, oy * ky, vw * kx, vh * ky, 0, 0, mapW, mapH);
  }
  for (const o of portaisAqui()) miniMarker(X(o.x), Y(o.y), 3, corDoPortal(o));
  for (const mob of snapshot.mobs) { mctx.fillStyle = grande(mob) ? '#ff9369' : '#d96049'; mctx.beginPath(); mctx.arc(X(mob.x), Y(mob.y), grande(mob) ? 4 : 3, 0, Math.PI * 2); mctx.fill(); }
  for (const p of snapshot.players) if (p.id !== playerId) miniMarker(X(p.x), Y(p.y), 2.5, '#5fd8ff');
  mctx.strokeStyle = '#fff0c488'; mctx.lineWidth = 1; mctx.strokeRect(X(camera.x), Y(camera.y), width / camera.scale * sx, height / camera.scale * sy);
  if (self) drawMiniSelf(X(self.x), Y(self.y), self.facing);
}
// Portais do lugar onde o jogador está. Cor e texto pelo destino: portal de uma hunt leva a cor dela;
// portal com vários destinos (saída de hunt) e o caminho Terra ↔ Vila ficam azuis.
const portaisAqui = () => PORTAIS.filter(o => o.planet === snapshot.planet && o.area === (snapshot.area || null));
const corDoPortal = o => o.destinos.length === 1 ? COR_DESTINO[o.destinos[0]] : COR_DESTINO.saida;
function textoDoPortal(o) {
  if (o.destinos.length > 1) return 'Saída';
  const d = lugar(o.destinos[0]);
  return (d.planet !== snapshot.planet ? (d.planet === 'terra' ? 'Terra' : 'Namekusei') : d.name) + (d.nivel ? ' · Nv. ' + d.nivel[0] + '–' + d.nivel[1] : '');
}
// Encostar no portal abre a janela de destinos uma vez; só abre de novo depois de sair do círculo
// (quem chega por um portal aparece fora dele, e fechar a janela não faz ela voltar parada ali).
// Com a caça automática ligada não abre: passar por cima da saída perseguindo um mob não é querer sair.
let portalEncostado = null;
function verificarPortal(pos) {
  const o = portaisAqui().find(o => Math.hypot(o.x - pos.x, o.y - pos.y) <= RAIO_PORTAL);
  if (o && o.id !== portalEncostado && !snapshot.self?.autoHunt && !document.querySelector('dialog[open]')) { keys.clear(); touchVector = { x: 0, y: 0 }; sendInput(); abrirPortal(o); }
  portalEncostado = o ? o.id : null;
}

// Ordem de desenho de um personagem: pela posição dos pés, mas quem pisa à frente da curva da base
// de uma casa (nas laterais a base sobe) vai na frente dela, mesmo acima da linha da base.
function profundidade(pos, onNamek) {
  let y = pos.y;
  if (onNamek) for (const c of HOUSES) if (pos.y < c.y) { const f = frenteDaCasa(c, pos.x); if (f !== null && pos.y >= f) y = Math.max(y, c.y + 0.01); }
  return y;
}
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = false;
  if (!snapshot) {
    ctx.fillStyle = '#2f4a3b'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#9db78f'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillText('PREPARANDO O MUNDO', width / 2, height / 2); requestAnimationFrame(frame); return;
  }
  const time = snapshot.time + Math.min(0.2, (now - receivedAt) / 1000);
  const onNamek = snapshot.planet === 'namek';
  const world = PLANETS[snapshot.planet] || PLANETS.namek;
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
  const area = onNamek ? areaPorId(snapshot.area) : null;
  // Câmera presa à área: a tela termina onde a área termina, sem borda nem escurecimento (pedido do Pedro).
  camera = cameraView(position, width, height, zoom, world.w, world.h, area);
  ctx.save(); ctx.scale(camera.scale, camera.scale); ctx.translate(-camera.x, -camera.y);
  if (onNamek) {
    if (drawGroundImage(ctx, art.namekSolo, world, camera, width, height)) { for (const c of HOUSES) drawHouseGround(ctx, c); drawMarket(ctx, MERCHANT); }
    else drawTerrain(ctx, CONFIG, ZONES, MERCHANT, camera, width, height);
    for (const o of portaisAqui()) drawPortal(ctx, o, time, corDoPortal(o), textoDoPortal(o), RAIO_PORTAL);
    telegraphs(time);
    for (const l of snapshot.loot) { shadow(l.x, l.y, 7); ctx.fillStyle = l.item.startsWith('seed') ? '#a4cf72' : l.item === 'crystal' ? '#83d2d3' : '#d7c8a3'; ctx.fillRect(l.x - 5, l.y - 6 + Math.sin(time * 3) * 2, 10, 9); ctx.fillStyle = '#edf3c1'; ctx.fillRect(l.x - 2, l.y - 8, 4, 3); }
  } else {
    // Planeta Terra: gramado verde limpo e seguro (tela inicial).
    ctx.fillStyle = '#5a8f3c'; ctx.fillRect(0, 0, world.w, world.h);
    ctx.strokeStyle = '#3c6428'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, world.w, world.h);
    for (const o of portaisAqui()) drawPortal(ctx, o, time, corDoPortal(o), textoDoPortal(o), RAIO_PORTAL);
  }
  const drawables = [
    ...(onNamek ? OBSTACLES.map(o => ({ y: o.y, draw: () => { if (o.type === 'tree') { shadow(o.x, o.y, o.r); if (!drawTree(ctx, o)) ctx.drawImage(sprites.tree, o.x - 61, o.y - 116, 122, 130); } else if (!drawRock(ctx, o)) { shadow(o.x, o.y, o.r); ctx.drawImage(sprites.rock, o.x - o.r, o.y - o.r * 1.15, o.r * 2, o.r * 1.7); } } })) : []),
    ...(onNamek ? [{ y: MERCHANT.y, draw: () => drawVendor(ctx, MERCHANT) }] : []),
    // Casas entram na ordem de profundidade pela base: quem está acima da base passa por trás.
    ...(onNamek ? HOUSES.map(c => ({ y: c.y, draw: () => drawHouse(ctx, c) })) : []),
    ...snapshot.players.map(p => ({ y: profundidade(renderPositions.get(p.id), onNamek), draw: () => drawPlayer(p, renderPositions.get(p.id), time) })),
    ...snapshot.mobs.map(m => ({ y: profundidade(renderPositions.get(m.id), onNamek), draw: () => drawMob(m, renderPositions.get(m.id), time) }))
  ].sort((a, b) => a.y - b.y);
  for (const d of drawables) if (d.y > camera.y - 150 && d.y < camera.y + height / camera.scale + 350) d.draw();
  for (const s of snapshot.projectiles) {
    const px = s.x + s.dx * s.speed * Math.min(0.07, (now - receivedAt) / 1000), py = s.y + s.dy * s.speed * Math.min(0.07, (now - receivedAt) / 1000);
    if (s.kind === 'genki') { ctx.save(); const glow = ctx.createRadialGradient(px, py, 3, px, py, 29); glow.addColorStop(0, '#ffffff'); glow.addColorStop(.28, '#c4f7ff'); glow.addColorStop(.7, '#5cbbff'); glow.addColorStop(1, '#a152ff00'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, 29, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else { ctx.strokeStyle = s.ownerType === 'player' ? '#b7edff' : '#f3ba8d'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - s.dx * 12, py - s.dy * 12); ctx.lineTo(px, py); ctx.stroke(); ctx.lineCap = 'butt'; }
  }
  effects(time);
  ctx.restore(); if (++miniTick % 4 === 0) drawMinimap(onNamek, world, area); requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
const previousToken = sessionStorage.getItem('dbi-session') || localStorage.getItem('dbi-last-session');
if (previousToken) join(localStorage.getItem('dbi-name') || 'Guerreiro', previousToken).catch(e => { notify(e.message); $('welcomeDialog').showModal(); });
else { $('nickname').value = localStorage.getItem('dbi-name') || 'Guerreiro'; $('welcomeDialog').showModal(); }
