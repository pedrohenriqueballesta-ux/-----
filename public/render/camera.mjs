// Camera and animation helpers do not change any server-authoritative rules.
// Calibração da câmera, num lugar só. O campo de visão é medido em unidades do mundo, não em
// pixels de tela: monitor grande vê o mesmo pedaço de mapa que um notebook, só que maior.
// Referências do jogo: mob percebe o jogador a 300 (chefe a 460), Sentinela ataca de 235,
// a caça solta o Kamehameha a até 400. Na visão padrão sobram ~375 para cima e para baixo.
export const CAMERA = Object.freeze({
  zoomMinimo: 0.8,                // mais afastado: ~1500×940 de mundo numa tela 16:10
  zoomPadrao: 1,                  // ~1200×750 de mundo numa tela 16:10
  zoomMaximo: 2,                  // mais perto: ~600×375
  areaVisivel: 1200 * 750,        // área de mundo na tela com zoom 1, qualquer que seja a tela
  ladoMaximo: 1300,               // teto do lado maior com zoom 1 (telas ultralargas e celular em pé)
  ladoMinimo: 600                 // piso do lado menor com zoom 1: o combate sempre cabe (vence o teto)
});
export const MIN_ZOOM = CAMERA.zoomMinimo;
export const MAX_ZOOM = CAMERA.zoomMaximo;
export function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number.isFinite(value) ? value : CAMERA.zoomPadrao));
}
export function zoomFromWheel(current, delta, mode = 0) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 600 : 1);
  return clampZoom(current * Math.exp(-pixels * 0.0012));
}
// Pixels de tela por unidade do mundo com zoom 1: mantém a área visível fixa e corta o lado
// maior em telas muito largas ou altas, sem deixar o lado menor curto demais para o combate.
export function baseScale(width, height) {
  const porArea = Math.max(Math.sqrt(width * height / CAMERA.areaVisivel), Math.max(width, height) / CAMERA.ladoMaximo);
  return Math.min(porArea, Math.min(width, height) / CAMERA.ladoMinimo);
}
// `limite` (opcional) é o retângulo { x, y, w, h } onde a câmera fica presa: numa área fechada, a tela
// termina onde a área termina, como na borda do mundo, e o que está fora nunca aparece.
export function cameraView(position, width, height, zoom, worldWidth, worldHeight, limite = null) {
  const scale = baseScale(width, height) * clampZoom(zoom);
  const visibleWidth = width / scale, visibleHeight = height / scale;
  const { x: x0, y: y0, w, h } = limite || { x: 0, y: 0, w: worldWidth, h: worldHeight };
  const axis = (value, start, extent, visible) => visible >= extent ? start + (extent - visible) / 2 : Math.max(start, Math.min(start + extent - visible, value - visible / 2));
  return { x: axis(position.x, x0, w, visibleWidth), y: axis(position.y, y0, h, visibleHeight), scale };
}
export function worldFromPointer(x, y, rect, camera) {
  return { x: (x - rect.left) / camera.scale + camera.x, y: (y - rect.top) / camera.scale + camera.y };
}
export const ANIMATION_FRAMES = 16;
// Clockwise in screen coordinates, starting at the bottom of the map.
export const DIRECTIONS = Object.freeze([
  { id: 's', label: 'Sul', x: 0, y: 1 },
  { id: 'sw', label: 'Sudoeste', x: -1, y: 1 },
  { id: 'w', label: 'Oeste', x: -1, y: 0 },
  { id: 'nw', label: 'Noroeste', x: -1, y: -1 },
  { id: 'n', label: 'Norte', x: 0, y: -1 },
  { id: 'ne', label: 'Nordeste', x: 1, y: -1 },
  { id: 'e', label: 'Leste', x: 1, y: 0 },
  { id: 'se', label: 'Sudeste', x: 1, y: 1 }
]);
export function spriteFacing(facing) {
  const x = Number.isFinite(facing?.x) ? facing.x : 0;
  const y = Number.isFinite(facing?.y) ? facing.y : 1;
  if (Math.hypot(x, y) < 0.0001) return 0;
  return (Math.round((Math.atan2(y, x) - Math.PI / 2) / (Math.PI / 4)) + 8) % 8;
}
// Travel, rather than wall-clock time, drives gait: a blocked actor cannot walk in place.
export function walkStep(travelled, stride = 96, phase = 0) {
  const cycle = ((travelled / stride + phase) % 1 + 1) % 1;
  return Math.floor(cycle * ANIMATION_FRAMES) % ANIMATION_FRAMES;
}
export function strikeFrame(progress) {
  return Math.min(ANIMATION_FRAMES - 1, Math.max(0, Math.floor(progress * ANIMATION_FRAMES)));
}
// Half the frames anticipate the existing impact; the other half finish and recover.
// Folhas de golpe com 4 quadros (preparacao, soco, impacto, recuperacao).
export function strikeColumn(progress) {
  return progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.8 ? 2 : 3;
}
export const PLAYER_STRIKE_DURATION = 0.36;
export const PLAYER_STRIKE_START = 0.375;
export function playerStrikeProgress(age) {
  if (age < 0 || age >= PLAYER_STRIKE_DURATION) return null;
  return PLAYER_STRIKE_START + (1 - PLAYER_STRIKE_START) * age / PLAYER_STRIKE_DURATION;
}
export function mobStrikeProgress(strike, time) {
  if (!strike || time < strike.started || time >= strike.until) return null;
  if (time < strike.release) return 0.5 * (time - strike.started) / (strike.release - strike.started);
  return 0.5 + 0.5 * (time - strike.release) / (strike.until - strike.release);
}
export function advancePose(previous, entity, dt, local = false) {
  const teleport = !previous || Math.hypot(previous.x - entity.x, previous.y - entity.y) > 250;
  const pose = teleport ? { x: entity.x, y: entity.y, facing: entity.facing || { x: 0, y: 1 }, travelled: 0 } : previous;
  const factor = Math.min(1, Math.max(0, dt) * (local ? 23 : 13));
  const dx = (entity.x - pose.x) * factor, dy = (entity.y - pose.y) * factor;
  pose.x += dx; pose.y += dy;
  if (entity.moving) pose.travelled += Math.hypot(dx, dy);
  if (entity.facing) pose.facing = entity.facing;
  else if (entity.moving && Math.hypot(dx, dy) > 0.05) pose.facing = { x: dx, y: dy };
  return pose;
}
