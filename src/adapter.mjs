import profile from '../profiles/backbone-windows-chrome-usb.json' with { type: 'json' };

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function decodeHat(raw) {
  // Neutral is ABOVE 1. Never clamp this axis before decoding.
  if (!Number.isFinite(raw) || raw < -1.05 || raw > 1.05) return [0, 0];
  const match = profile.dpad.directions.find(d => Math.abs(raw - d.raw) <= profile.dpad.decodeTolerance);
  return match ? [match.x, match.y] : [0, 0];
}

export function backboneWindowsChromeRaw(pad, environment = {}) {
  if (!pad || pad.connected === false || environment.os !== 'Windows' ||
      environment.browser !== 'Chrome' || environment.transport !== 'USB' ||
      pad.mapping !== '' || typeof pad.id !== 'string' ||
      pad.id.toLowerCase() !== profile.signature.id.toLowerCase() ||
      pad.axes?.length !== 10 || pad.buttons?.length !== 17) return null;
  // Invalid or incomplete snapshots must fall back, never fabricate input.
  if (!Array.from(pad.axes).every(Number.isFinite) ||
      !Array.from(pad.buttons).every(b => b && typeof b.pressed === 'boolean' &&
        Number.isFinite(b.value))) return null;
  const stick = role => ({
    x: clamp(pad.axes[profile.sticks[role].xAxis], -1, 1),
    y: clamp(pad.axes[profile.sticks[role].yAxis], -1, 1)
  });
  const trigger = role => clamp((pad.axes[profile.triggers[role].axis] + 1) / 2, 0, 1);
  return {
    left: stick('left'), right: stick('right'),
    triggers: { left: trigger('left'), right: trigger('right') },
    dpad: decodeHat(pad.axes[9]),
    buttons: Object.fromEntries(Object.entries(profile.buttons).map(([name, i]) =>
      [name, pad.buttons[i].pressed]))
  };
}

// Callbacks are supplied by the host, including its existing standard handler.
// A selected calibration returning null means fallback; it never activates this preset.
export function resolveInput(pad, { calibration, standard, environment } = {}) {
  if (!pad || pad.connected === false) return { source: 'fallback', state: null };
  if (typeof calibration === 'function') return { source: 'calibration', state: calibration(pad) };
  if (pad.mapping === 'standard') return { source: 'standard', state: standard?.(pad) ?? null };
  const state = backboneWindowsChromeRaw(pad, environment);
  return { source: state ? 'backbone-raw' : 'fallback', state };
}

// Example action-edge policy. Reset on blur, disconnect, pause/resume,
// controller change and every scene/menu transition. A held entry is suppressed
// until that button is released. Analog action thresholds belong to the host.
export function createButtonEdges() {
  let previous = new Map();
  return {
    reset() { previous = new Map(); },
    update(state) {
      if (!state) { this.reset(); return []; }
      const edges = [];
      for (const [name, held] of Object.entries(state.buttons ?? {})) {
        if (held && previous.get(name) === false) edges.push(name);
        previous.set(name, Boolean(held));
      }
      return edges;
    }
  };
}
