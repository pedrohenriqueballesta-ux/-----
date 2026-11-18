// Funções matemáticas puras, sem dependência das regras do jogo.
export const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function norm(x, y) {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d };
}
export function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
