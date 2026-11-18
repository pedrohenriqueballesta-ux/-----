import test from 'node:test';
import assert from 'node:assert/strict';
import { legPose } from '../public/art/walk-rig.mjs';
import { DIRECTIONS } from '../public/render/mapa/camera.mjs';

test('em todas as oito direções, as pernas trocam avanço e recuo a cada meia passada', () => {
  for (const direction of DIRECTIONS) {
    const left = legPose(0, 0, direction), right = legPose(0, 1, direction);
    const nextLeft = legPose(8, 0, direction), nextRight = legPose(8, 1, direction);
    assert.ok(Math.abs(left.x - nextRight.x) < 1e-8);
    assert.ok(Math.abs(left.y - nextRight.y) < 1e-8);
    assert.ok(Math.abs(right.x - nextLeft.x) < 1e-8);
    assert.ok(Math.hypot(left.x - right.x, left.y - right.y) > 9, direction.id);
  }
});
test('pé de balanço levanta, apoio permanece no chão, e o ciclo fecha sem salto', () => {
  const direction = { x: -1, y: -1 };
  assert.ok(legPose(4, 0, direction).lift > 0.99);
  assert.ok(legPose(4, 1, direction).lift < 1e-8);
  assert.ok(legPose(12, 1, direction).lift > 0.99);
  assert.deepEqual(legPose(16, 0, direction), legPose(0, 0, direction));
  const poses = Array.from({length:16}, (_, f) => legPose(f, 0, direction));
  assert.equal(new Set(poses.map(p=>[p.x,p.y,p.bend].map(n=>n.toFixed(3)).join(','))).size, 16);
});
test('o corpo sobe quando as pernas se cruzam e volta ao chão com a passada aberta', async () => {
  const { walkBob, WALK_BOB } = await import('../public/art/walk-rig.mjs');
  assert.ok(walkBob(0) < 1e-9 && walkBob(8) < 1e-9);
  assert.ok(Math.abs(walkBob(4) - WALK_BOB) < 1e-9 && Math.abs(walkBob(12) - WALK_BOB) < 1e-9);
  for (let f = 0; f < 16; f++) assert.ok(walkBob(f) >= 0 && walkBob(f) <= WALK_BOB);
  assert.equal(walkBob(16), walkBob(0));
});
