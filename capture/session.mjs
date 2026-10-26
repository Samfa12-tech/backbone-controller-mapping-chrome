const knownId = /^Backbone One \(Vendor: 358a Product: 0204\)$/i;
export const labels = ['neutral', 'south', 'east', 'west', 'north', 'L1', 'R1',
  'L2', 'R2', 'three-dots', 'menu', 'launcher', 'L3', 'R3',
  'left-stick', 'right-stick', 'dpad-up', 'dpad-up-right', 'dpad-right',
  'dpad-down-right', 'dpad-down', 'dpad-down-left', 'dpad-left', 'dpad-up-left'];
export const phases = ['released', 'held'];

// Allowlist export fields. Unknown device IDs and browser/user metadata never leave this function.
export function sanitizeSnapshot(pad) {
  if (!pad || pad.connected === false || !pad.axes || !pad.buttons ||
      pad.axes.length > 64 || pad.buttons.length > 128) return null;
  const number = v => Number.isFinite(v) ? v : null;
  return {
    family: knownId.test(pad.id) ? 'Backbone One (358a:0204)' : 'unrecognized',
    mapping: ['', 'standard', 'xr-standard'].includes(pad.mapping) ? pad.mapping : 'other',
    axisCount: pad.axes.length, buttonCount: pad.buttons.length,
    axes: Array.from(pad.axes, number),
    buttons: Array.from(pad.buttons, b => ({ pressed: b?.pressed === true, value: number(b?.value) }))
  };
}

// Dependency injection allows lifecycle testing with synthetic snapshots only.
export function createCaptureSession({ getGamepads, requestFrame, cancelFrame, canPoll, onSnapshot }) {
  let running = false, frame = null, generation = 0, slot = null, latest = null;
  let samples = [];
  const publish = snapshot => { latest = snapshot; onSnapshot(snapshot); };
  const stop = () => {
    running = false; generation++;
    if (frame !== null) cancelFrame(frame);
    frame = null; slot = null; publish(null);
  };
  const tick = token => {
    if (!running || token !== generation) return;
    frame = null;
    if (!canPoll()) { stop(); return; }
    let pads;
    try { pads = Array.from(getGamepads()); } catch { stop(); return; }
    if (slot === null) slot = pads.findIndex(p => p && p.connected !== false);
    if (slot < 0) slot = null;
    const pad = slot === null ? null : pads[slot];
    if (slot !== null && (!pad || pad.connected === false)) { stop(); return; }
    publish(sanitizeSnapshot(pad));
    if (running && token === generation) frame = requestFrame(() => tick(token));
  };
  return {
    start() {
      if (running) return;
      if (!canPoll()) return;
      running = true; const token = ++generation;
      frame = requestFrame(() => tick(token));
    },
    stop,
    get running() { return running; },
    get latest() { return latest; },
    record(label, phase) {
      if (!running || !canPoll() || !latest || !labels.includes(label) ||
          !phases.includes(phase) || samples.length >= 100) return false;
      samples.push({ label, phase, snapshot: structuredClone(latest) });
      return true;
    },
    clear() { samples = []; },
    export() { return { schemaVersion: 1, samples: structuredClone(samples) }; }
  };
}
