import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaptureSession, sanitizeSnapshot } from '../capture/session.mjs';
import { pad, neutralAxes } from './fixtures.mjs';

function harness() {
  let pads = [], focused = true, id = 0, fail = false;
  const frames = new Map(), snapshots = [];
  const session = createCaptureSession({
    getGamepads: () => { if (fail) throw Error('synthetic permission failure'); return pads; },
    requestFrame: cb => { frames.set(++id, cb); return id; },
    cancelFrame: i => frames.delete(i), canPoll: () => focused,
    onSnapshot: snapshot => snapshots.push(snapshot)
  });
  return { session, frames, snapshots,
    pads(value) { pads = value; }, focus(value) { focused = value; }, fail() { fail = true; },
    step() { const [key, callback] = frames.entries().next().value ?? []; if (callback) { frames.delete(key); callback(); } }
  };
}

test('explicit start, single poll loop, late activation, manual capture and neutral retention', () => {
  const h = harness(); assert.equal(h.frames.size, 0); assert.equal(h.session.record('neutral', 'released'), false);
  h.session.start(); h.session.start(); assert.equal(h.frames.size, 1);
  h.step(); assert.equal(h.session.running, true); assert.equal(h.session.latest, null);
  h.pads([null, pad()]); h.step(); assert.deepEqual(h.session.latest.axes, neutralAxes);
  assert.equal(h.session.record('neutral', 'released'), true);
  const exported = h.session.export(); assert.equal(exported.samples.length, 1);
  exported.samples[0].snapshot.axes[0] = 999;
  assert.equal(h.session.export().samples[0].snapshot.axes[0], 0);
  h.session.stop(); assert.equal(h.frames.size, 0); assert.equal(h.session.latest, null);
  assert.equal(h.session.export().samples.length, 1); h.session.clear(); assert.equal(h.session.export().samples.length, 0);
});

test('blur/hidden and explicit stop cancel polling; stale callbacks cannot restart it', () => {
  for (const reason of ['blur', 'hidden', 'stop', 'pagehide', 'disconnect-event']) {
    const h = harness(); h.pads([pad()]); h.session.start();
    const stale = [...h.frames.values()][0]; h.step();
    if (reason === 'blur' || reason === 'hidden') { h.focus(false); h.step(); } else h.session.stop();
    assert.equal(h.session.running, false, reason); assert.equal(h.session.latest, null);
    assert.equal(h.frames.size, 0); stale(); assert.equal(h.frames.size, 0);
    h.focus(true); assert.equal(h.frames.size, 0); h.session.start(); assert.equal(h.frames.size, 1);
    stale(); assert.equal(h.frames.size, 1); h.step(); assert.ok(h.session.latest);
  }
});

test('disconnect never switches to a second controller; explicit restart needed', () => {
  const h = harness(); h.pads([pad(), pad()]); h.session.start(); h.step();
  h.pads([null, pad()]); h.step(); assert.equal(h.session.running, false); assert.equal(h.session.latest, null);
  assert.equal(h.session.record('menu', 'held'), false);
  h.session.start(); h.step(); assert.ok(h.session.latest);
});

test('unavailable/throwing API stops cleanly; hidden start and recording are rejected', () => {
  const h = harness(); h.focus(false); h.session.start(); assert.equal(h.frames.size, 0);
  h.focus(true); h.pads([pad()]); h.session.start(); h.step();
  h.focus(false); assert.equal(h.session.record('neutral', 'released'), false);
  h.focus(true); h.fail(); h.step(); assert.equal(h.session.running, false); assert.equal(h.frames.size, 0);
});

test('sanitized exports exclude arbitrary identifiers, timestamps, browser and account metadata', () => {
  const p = pad({ id: 'PERSONAL-SERIAL-DO-NOT-PUBLISH', mapping: 'PRIVATE-MAPPING',
    timestamp: 123, account: 'private', userAgent: 'private', serial: 'private' });
  p.axes[0] = NaN; p.buttons[0].value = Infinity;
  const safe = sanitizeSnapshot(p), json = JSON.stringify(safe);
  assert.deepEqual(Object.keys(safe).sort(), ['axes', 'axisCount', 'buttonCount', 'buttons', 'family', 'mapping'].sort());
  assert.equal(safe.family, 'unrecognized'); assert.equal(safe.mapping, 'other');
  assert.equal(safe.axes[0], null); assert.equal(safe.buttons[0].value, null);
  assert.doesNotMatch(json, /PERSONAL|PRIVATE|timestamp|account|userAgent|serial|private/);
  assert.equal(sanitizeSnapshot(pad()).family, 'Backbone One (358a:0204)');
  assert.equal(sanitizeSnapshot(pad({ connected: false })), null);
  assert.equal(sanitizeSnapshot(pad({ axes: Array(65).fill(0) })), null);
  assert.equal(sanitizeSnapshot(pad({ buttons: Array(129).fill({ value: 0 }) })), null);
});

test('fixed labels/phases, bounded memory and no mutation of kept snapshots', () => {
  const h = harness(); const p = pad(); h.pads([p]); h.session.start(); h.step();
  assert.equal(h.session.record('personal text', 'held'), false);
  assert.equal(h.session.record('neutral', 'private'), false);
  for (let i = 0; i < 100; i++) assert.equal(h.session.record('neutral', 'released'), true);
  assert.equal(h.session.record('neutral', 'released'), false);
  p.axes[0] = 1; h.step(); assert.equal(h.session.export().samples[0].snapshot.axes[0], 0);
});
