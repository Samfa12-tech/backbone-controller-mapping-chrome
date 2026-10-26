# Backbone One on Windows Chrome: verified mapping

Measured on 26 October 2026 for cesharpe / Out 4 Blood. This is a hardware-input reference, with an engine-agnostic example. It does not claim that Out 4 Blood has been tested.

## Quick implementation guidance

Use a narrowly selected raw-layout adapter. Keep existing standard PlayStation/Xbox handling and explicit user calibration first. Do not apply this raw Windows layout to phone browsers, Steam Input, or mapping="standard".

## Captured signature

PlayStation-edition Backbone One, USB to a Windows laptop; Chrome 155.0.0.0. Browser mapping is the empty string (""), with 10 axes and 17 buttons. Product-family label: Backbone One (Vendor: 358a Product: 0204). These are shared USB family IDs, not a serial number.

The empty mapping string is significant. Reading raw axis 3 as right-stick Y would interpret a resting trigger (-1) as constant stick input.

## Buttons

| Physical control | Raw button | Note |
| --- | --- | --- |
| Cross / X | 0 | Face south |
| Circle | 1 | Face east |
| Square | 3 | Face west; targeted retry |
| Triangle | 4 | Face north |
| L1 | 6 | Left shoulder |
| R1 | 7 | Right shoulder; targeted retry |
| L2 digital echo | 8 | Analog axis 4 is preferred for magnitude |
| R2 digital echo | 9 | Analog axis 3; first sample already held |
| Three dots (...) | 10 | Separate labelled physical capture |
| Hamburger / menu | 11 | Separate labelled physical capture |
| Backbone launcher | 12 | Targeted retry |
| L3 - left-stick click | 13 | Earlier isolated capture; owner confirmed |
| R3 - right-stick click | 14 | Earlier isolated capture; owner confirmed |

Buttons 2, 5, 15 and 16 are unassigned by this capture.

## Axes and triggers

| Axis | Physical role | Observed neutral | Observed range / note |
| --- | --- | --- | --- |
| 0 | Left stick X | 0 | Left -1; right +1 |
| 1 | Left stick Y | 0 | Up -1; down +0.94964 observed |
| 2 | Right stick X | 0 | Left -1; right +0.93075 observed |
| 3 | R2 analog trigger | -1 | Full press +1; button 9 digital echo |
| 4 | L2 analog trigger | -1 | Full press +1; button 8 digital echo |
| 5 | Right stick Y | 0 | Up -0.99167; down +1 observed |
| 6, 7, 8 | Unassigned | 0 | No physical role observed |
| 9 | D-pad / POV hat | +1.2857144 | Eight directions below; not a stick |

Released snapshot:

```json
[0, 0, 0, -1, -1, 0, 0, 0, 0, 1.2857143878936768]
```

Normalize each trigger with clamp((raw + 1) / 2, 0, 1). Do not treat its -1 rest as a stick.

## D-pad hat

| Direction | Raw axis 9 | Semantic x, y |
| --- | --- | --- |
| Up | -1 | 0, -1 |
| Up-right | -0.7142857 (-5/7) | 1, -1 |
| Right | -0.4285714 (-3/7) | 1, 0 |
| Down-right | -0.1428571 (-1/7) | 1, 1 |
| Down | +0.1428572 (1/7) | 0, 1 |
| Down-left | +0.4285715 (3/7) | -1, 1 |
| Left | +0.7142857 (5/7) | -1, 0 |
| Up-left | +1 | -1, -1 |
| Released | +1.2857144 | 0, 0 |

**Do not clamp axis 9 to [-1,+1] before decoding.** Released is about +1.2857144; clamping would turn neutral into Up-left. Match with a small tolerance rather than exact decimal equality.

## Evidence and limits

- All indices are zero-based Gamepad API indices. The complete session recorded all 17 buttons released, value 0, with the neutral axis snapshot shown here. These samples are not a permanent centre/deadzone calibration.

- Square, R1, D-pad Down, Up-left and the launcher were rechecked after missed/ambiguous first-pass input. The first probe briefly ignored input after changing prompts; those misses are not evidence of defective hardware or browser-invisible controls. The corrected pass used persistent, explicitly advanced prompts.

- Three-dots and hamburger were captured separately. Some first samples were already held; a held sample followed by release identifies a control but does not prove a captured rising edge. R2 was observed held at full press, then released; L2 also has a recorded press edge.

- Up-left was held at +1 for about 1.08 seconds, followed by one transient Up value during release. Down was held around +1/7 for about 0.82 seconds. Do not infer a different mapping from transition extrema alone.

- A separate Create/Share/Capture control and a separate Home/PS control were marked absent/skip by the owner. No browser-invisible physical button was established. Raw buttons 2, 5, 15 and 16 remain unassigned, and axes 6-8 have no observed role.

- Stick directional identity was physically checked, but not every throw reached exactly 1. Do not scale a controller permanently from these sample maxima. Trigger rest/full/release were observed; a separately labelled partial-pressure calibration was not retained.

- This covers one Windows Chrome USB signature. Android/iOS, Steam Input, other Backbone revisions, other browsers, native APIs and complete gameplay were not certified. It is not a Babylon-specific verification.

## Practical developer checks

1. First honour saved user calibration. Then keep mapping="standard" on your existing standard path. Only use this preset for the matching raw Windows signature; otherwise request diagnostics/calibration.

2. A focused page may need a real gamepad press before navigator.getGamepads() exposes the pad. If absent, offer activation before diagnosing failure. Poll snapshots while active; preserve raw data before clamping.

3. Check each stick independently, both analog triggers independently, every identified button, all eight hat directions and neutral. Neutral must produce no movement, menu navigation or trigger action.

4. Handle click edges deliberately: one press should produce one action. On blur, disconnect, pause/resume and scene/menu transitions, clear or latch action state and require release before rearming. Test held L3, R3 and menu separately.

5. Test menu focus in both axes, confirm/back, sliders, gameplay aim/movement, triggers and clean entry/exit from minigames. Keep PlayStation/Xbox glyph selection separate from physical action semantics.

6. Retest a standard-mapped PS/Xbox controller and an unknown raw pad. Confirm neither inherits this override. For a different signature, request OS/browser, transport, family label, mapping, counts, untouched values and labelled press/release traces; remove serials and account/session information.

## Optional normalization example

```js
// Engine-agnostic reference. Pass your own detected platform string.
// Keep user calibration and mapping="standard" paths ahead of this.
export function backboneWindowsRaw(pad, platform) {
  if (!pad || pad.connected === false || !/win/i.test(platform) ||
      pad.mapping !== "" || pad.axes.length !== 10 ||
      pad.buttons.length !== 17 ||
      !/^Backbone One \(Vendor: 358a Product: 0204\)$/i.test(pad.id)) {
    return null; // Leave other devices to their existing handlers.
  }
  const a = pad.axes;
  const pressed = i => Boolean(pad.buttons[i]?.pressed);
  const trigger = v => Math.max(0, Math.min(1, (v + 1) / 2));
  const hat = v => {
    // Reject released/out-of-range BEFORE any clamp.
    if (!Number.isFinite(v) || v < -1.05 || v > 1.05) return [0, 0];
    const k = Math.round((v + 1) * 3.5);
    if (k < 0 || k > 7 || Math.abs(v - (-1 + k * 2 / 7)) > 0.08)
      return [0, 0];
    return [[0,-1],[1,-1],[1,0],[1,1],
            [0,1],[-1,1],[-1,0],[-1,-1]][k];
  };
  return {
    left:  { x: a[0], y: a[1] }, // negative Y is up
    right: { x: a[2], y: a[5] },
    triggers: { left: trigger(a[4]), right: trigger(a[3]) },
    dpad: hat(a[9]),
    buttons: {
      south: pressed(0), east: pressed(1),
      west: pressed(3), north: pressed(4),
      leftShoulder: pressed(6), rightShoulder: pressed(7),
      leftTriggerDigital: pressed(8), rightTriggerDigital: pressed(9),
      threeDots: pressed(10), menu: pressed(11), launcher: pressed(12),
      leftStick: pressed(13), rightStick: pressed(14)
    }
  };
}
```

The example supplies semantic snapshots only. Apply your existing deadzones, calibration, edge/latch policy, focus lifecycle and action bindings separately. It deliberately leaves unobserved indices unassigned. It was fixture-checked against the recorded values; it has not been integrated or playtested in Out 4 Blood.

## API references

- Gamepad.mapping: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping
- W3C Gamepad specification and standard remapping: https://www.w3.org/TR/gamepad/

Source: owner-labelled physical Gamepad API capture and targeted retries, 26 October 2026. No other developer has been contacted.
