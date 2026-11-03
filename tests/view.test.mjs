import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, MIN_ZOOM, MAX_ZOOM, clampZoom, zoomFromWheel, cameraView, worldFromPointer, spriteFacing, walkStep, DIRECTIONS, strikeFrame, mobStrikeProgress, advancePose } from '../public/render/camera.mjs';

test('roda do mouse aproxima para cima, afasta para baixo e respeita os limites', () => {
  assert.ok(zoomFromWheel(1, -120) > 1);
  assert.ok(zoomFromWheel(1, 120) < 1);
  assert.equal(zoomFromWheel(1, -5000), MAX_ZOOM);
  assert.equal(zoomFromWheel(1, 5000), MIN_ZOOM);
  assert.equal(zoomFromWheel(1, 3, 1), zoomFromWheel(1, 48, 0));
  assert.equal(clampZoom(NaN), 1);
});

test('câmera mantém a mira correta depois do zoom e respeita as bordas do mapa', () => {
  const character = { x: 1500, y: 900 };
  for (const zoom of [MIN_ZOOM, 1, MAX_ZOOM]) {
    const camera = cameraView(character, 1000, 600, zoom, 3300, 2200);
    const target = worldFromPointer(520, 330, { left: 20, top: 30 }, camera);
    assert.ok(Math.abs(target.x - character.x) < 1e-8);
    assert.ok(Math.abs(target.y - character.y) < 1e-8);
  }
  const edge = cameraView({ x: 0, y: 0 }, 1000, 600, 1, 3300, 2200);
  assert.equal(edge.x, 0); assert.equal(edge.y, 0);
});

test('as oito direções distinguem os quatro quadrantes diagonais', () => {
  for (const [index, direction] of DIRECTIONS.entries()) assert.equal(spriteFacing(direction), index, direction.label);
  assert.equal(spriteFacing({ x: 10, y: -10 }), 5);
  assert.equal(spriteFacing({ x: 0.01, y: -1 }), 4);
  assert.equal(spriteFacing({ x: 1, y: 0.01 }), 6);
  assert.equal(spriteFacing({ x: 0, y: 0 }), 0);
});

test('um ciclo completo percorre os dezesseis quadros e volta ao início', () => {
  assert.deepEqual(Array.from({ length: 16 }, (_, i) => walkStep(i * 6, 96)), Array.from({ length: 16 }, (_, i) => i));
  assert.equal(walkStep(96, 96), 0);
  assert.equal(walkStep(48, 96), 8);
  assert.equal(walkStep(0, 96, 0.5), 8);
  assert.equal(strikeFrame(1), 15);
  assert.equal(strikeFrame(0.5), 8);
});

test('os passos acompanham distância, congelam sem deslocamento e reiniciam em teleporte', () => {
  const entity = { x: 1000, y: 700, moving: true, facing: { x: 1, y: -1 } };
  let pose = advancePose(null, entity, 1 / 60);
  for (let i = 0; i < 60; i++) pose = advancePose(pose, entity, 1 / 60);
  assert.equal(pose.travelled, 0, 'intenção sem movimento não anima as pernas');
  entity.x += 30; entity.y -= 30;
  pose = advancePose(pose, entity, 1);
  assert.ok(Math.abs(pose.travelled - Math.hypot(30, 30)) < 1e-8);
  assert.equal(spriteFacing(pose.facing), 5);
  const travelled = pose.travelled;
  entity.moving = false;
  pose = advancePose(pose, entity, 1);
  assert.equal(pose.travelled, travelled);
  assert.equal(spriteFacing(pose.facing), 5, 'parar mantém a orientação');
  entity.x += 500;
  pose = advancePose(pose, entity, 1);
  assert.equal(pose.travelled, 0);
});

test('a animação do mob preserva o instante de impacto e completa a recuperação', () => {
  const strike = { started: 100, release: 101, until: 101.32 };
  assert.equal(mobStrikeProgress(strike, 99), null);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 100)), 0);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 100.99)), 7);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 101)), 8);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 101.31)), 15);
  assert.equal(mobStrikeProgress(strike, 101.32), null);
});

test('o campo de visão é limitado em qualquer tela, mesmo no zoom mínimo', () => {
  const telas = [[1366, 768], [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160], [3440, 1440], [5120, 1440], [390, 844], [844, 390]];
  for (const [w, h] of telas) {
    const padrao = cameraView({ x: 2300, y: 1500 }, w, h, CAMERA.zoomPadrao, 4608, 3072);
    const longe = cameraView({ x: 2300, y: 1500 }, w, h, CAMERA.zoomMinimo, 4608, 3072);
    const vista = c => [w / c.scale, h / c.scale];
    const [pw, ph] = vista(padrao), [lw, lh] = vista(longe);
    // Na visão padrão dá para ver um mob que percebe o jogador (300) nas duas direções.
    assert.ok(Math.min(pw, ph) / 2 >= 280, w + 'x' + h + ': visão padrão curta demais (' + Math.round(pw) + 'x' + Math.round(ph) + ')');
    // Afastado ao máximo, no máximo 15% da área do mapa (antes chegava a 56% num monitor 2560x1440).
    assert.ok(lw * lh <= 0.15 * 4608 * 3072, w + 'x' + h + ': afastamento mostra mapa demais (' + Math.round(lw) + 'x' + Math.round(lh) + ')');
  }
});

test('numa área fechada a câmera fica presa nela: a tela nunca mostra além da borda', () => {
  const area = { x: 2000, y: 1100, w: 4000, h: 2000 };
  for (const pos of [{ x: 2000, y: 1100 }, { x: 6000, y: 3100 }, { x: 4000, y: 2000 }, { x: 0, y: 0 }]) {
    const cam = cameraView(pos, 1400, 900, 0.8, 8294, 5530, area);
    const vw = 1400 / cam.scale, vh = 900 / cam.scale;
    assert.ok(cam.x >= area.x && cam.x + vw <= area.x + area.w + 1e-6, 'horizontal dentro da área');
    assert.ok(cam.y >= area.y && cam.y + vh <= area.y + area.h + 1e-6, 'vertical dentro da área');
  }
});
