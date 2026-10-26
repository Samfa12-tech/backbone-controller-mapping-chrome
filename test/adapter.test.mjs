import test from 'node:test';
import assert from 'node:assert/strict';
import profile from '../profiles/backbone-windows-chrome-usb.json' with { type: 'json' };
import { backboneWindowsChromeRaw as adapt, resolveInput, decodeHat, createButtonEdges } from '../src/adapter.mjs';
import { pad, environment, neutralAxes, buttonMap, hats } from './fixtures.mjs';

test('neutral has no movement, trigger, hat or button input', () => {
  const source = pad(), original = structuredClone(source);
  const state = adapt(source, environment);
  assert.deepEqual(state.left, { x: 0, y: 0 }); assert.deepEqual(state.right, { x: 0, y: 0 });
  assert.deepEqual(state.triggers, { left: 0, right: 0 }); assert.deepEqual(state.dpad, [0, 0]);
  assert.ok(Object.values(state.buttons).every(v => v === false));
  assert.deepEqual(source, original);
});

test('every verified button maps independently; unassigned buttons remain ignored', () => {
  assert.deepEqual(profile.buttons, buttonMap);
  for (let i = 0; i < 17; i++) {
    const p = pad(); p.buttons[i] = { pressed: true, value: 1 };
    const expected = Object.entries(buttonMap).filter(([, index]) => index === i).map(([key]) => key);
    assert.deepEqual(Object.keys(adapt(p, environment).buttons).filter(k => adapt(p, environment).buttons[k]), expected);
  }
});

test('sticks use axes 0/1 and 2/5, independently of resting triggers and unassigned axes', () => {
  for (const [axis, role, coordinate, value] of [[0, 'left', 'x', -1], [1, 'left', 'y', 0.94964],
    [2, 'right', 'x', 0.93075], [5, 'right', 'y', -0.99167]]) {
    const p = pad(); p.axes[axis] = value;
    const result = adapt(p, environment), expected = adapt(pad(), environment);
    expected[role][coordinate] = value; assert.deepEqual(result, expected);
  }
  const p = pad(); p.axes[6] = 1; p.axes[7] = -1; p.axes[8] = 1;
  assert.deepEqual(adapt(p, environment), adapt(pad(), environment));
});

test('independent analog triggers normalize and clamp; partial values are synthetic arithmetic checks', () => {
  for (const [axis, role] of [[4, 'left'], [3, 'right']]) {
    for (const [raw, expected] of [[-2, 0], [-1, 0], [0, 0.5], [1, 1], [2, 1]]) {
      const p = pad(); p.axes[axis] = raw;
      const result = adapt(p, environment);
      assert.equal(result.triggers[role], expected);
      assert.equal(result.triggers[role === 'left' ? 'right' : 'left'], 0);
      assert.deepEqual(result.right, { x: 0, y: 0 });
    }
  }
});

test('all eight hats, rounding tolerance, neutral, transitions and invalid positions', () => {
  for (const [raw, expected] of hats) {
    assert.deepEqual(decodeHat(raw), expected);
    assert.deepEqual(decodeHat(raw + 0.001), expected);
    const p = pad(); p.axes[9] = raw; assert.deepEqual(adapt(p, environment).dpad, expected);
  }
  for (const raw of [neutralAxes[9], 2, -2, 0, NaN, Infinity, undefined]) assert.deepEqual(decodeHat(raw), [0, 0]);
  assert.deepEqual([1, -1, neutralAxes[9]].map(decodeHat), [[-1, -1], [0, -1], [0, 0]]);
});

test('exact context/signature guards and invalid snapshots fall back', () => {
  for (const changes of [{ id: 'other' }, { id: pad().id + ' serial:fake' }, { mapping: 'standard' },
    { mapping: 'xr-standard' }, { connected: false }, { axes: [] }, { buttons: [] }, { axes: null }, { buttons: null }]) {
    assert.equal(adapt(pad(changes), environment), null);
  }
  for (const context of [{}, { ...environment, os: 'Android' }, { ...environment, browser: 'Firefox' },
    { ...environment, transport: 'Bluetooth' }]) assert.equal(adapt(pad(), context), null);
  assert.equal(adapt(null, environment), null);
  for (const invalid of [NaN, Infinity, '0', undefined]) {
    const p = pad(); p.axes[3] = invalid; assert.equal(adapt(p, environment), null);
  }
  for (const invalid of [null, {}, { pressed: true, value: NaN }]) {
    const p = pad(); p.buttons[0] = invalid; assert.equal(adapt(p, environment), null);
  }
});

test('calibration then standard then raw then fallback, with no silent override', () => {
  const options = { environment, calibration: () => 'user', standard: () => 'standard' };
  assert.deepEqual(resolveInput(pad({ mapping: 'standard' }), options), { source: 'calibration', state: 'user' });
  assert.deepEqual(resolveInput(pad(), { ...options, calibration: () => null }), { source: 'calibration', state: null });
  assert.deepEqual(resolveInput(pad({ mapping: 'standard' }), { environment, standard: options.standard }),
    { source: 'standard', state: 'standard' });
  assert.deepEqual(resolveInput(pad({ mapping: 'standard' }), { environment }), { source: 'standard', state: null });
  assert.equal(resolveInput(pad(), { environment }).source, 'backbone-raw');
  assert.deepEqual(resolveInput(pad({ id: 'unknown' }), { environment }), { source: 'fallback', state: null });
  assert.deepEqual(resolveInput(null, options), { source: 'fallback', state: null });
});

test('held L3, R3 and menu never repeat, and require release across every lifecycle reset', () => {
  for (const action of ['leftStick', 'rightStick', 'menu']) {
    const edges = createButtonEdges();
    const held = adapt(pad(), environment), released = adapt(pad(), environment);
    held.buttons[action] = true;
    assert.deepEqual(edges.update(held), []); assert.deepEqual(edges.update(held), []);
    assert.deepEqual(edges.update(released), []); assert.deepEqual(edges.update(held), [action]);
    assert.deepEqual(edges.update(held), []);
    for (const lifecycle of ['blur', 'disconnect', 'pause', 'resume', 'scene', 'menu', 'controller-change']) {
      edges.reset(); assert.deepEqual(edges.update(held), [], lifecycle);
      edges.update(released); assert.deepEqual(edges.update(held), [action], lifecycle);
    }
    edges.update(null); assert.deepEqual(edges.update(held), []);
  }
});

test('machine profile matches independent documented fixture values', () => {
  assert.deepEqual(profile.neutralAxesObserved, neutralAxes);
  assert.deepEqual(profile.dpad.directions.map(d => [d.raw, [d.x, d.y]]), hats);
  assert.deepEqual(profile.unassignedButtons, [2, 5, 15, 16]);
  assert.deepEqual(profile.unassignedAxes, [6, 7, 8]);
});
