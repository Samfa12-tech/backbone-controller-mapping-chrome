# Backbone Controller Mapping for Chrome

**Tested scope: PlayStation-edition Backbone One, connected by USB to Windows Chrome 155.0.0.0.**
Measured on 26 October 2026. This is one verified raw browser signature, not a universal Backbone mapping or a gameplay certification.

The browser reported `Backbone One (Vendor: 358a Product: 0204)`, an empty `mapping` string, **10 axes and 17 buttons**. The vendor/product pair identifies a shared USB family, not a serial number.

## Mapping reference

- [Readable verified mapping and evidence limits](docs/verified-mapping.md)
- [Four-page PDF reference](docs/verified-mapping.pdf)
- [Machine-readable profile](profiles/backbone-windows-chrome-usb.json)
- [Small engine-agnostic adapter and button-edge example](src/adapter.mjs)
- [Local-only capture page](capture/index.html) and [privacy notes](docs/privacy.md)

Key integration details:

| Input | Raw indices / behavior |
| --- | --- |
| Left stick | X axis 0; Y axis 1 |
| Right stick | X axis 2; **Y axis 5** |
| L2 / R2 analog | Axis 4 / axis 3; released -1, full +1; normalize with `clamp((raw + 1) / 2, 0, 1)` |
| D-pad | Axis 9, eight-way POV hat; released about **+1.2857144** |
| Face south / east / west / north | Buttons 0 / 1 / 3 / 4 |
| L1 / R1 | Buttons 6 / 7 |
| L2 / R2 digital echoes | Buttons 8 / 9; analog axes preferred for magnitude |
| Three dots / menu / launcher | Buttons 10 / 11 / 12 |
| L3 / R3 | Buttons 13 / 14 |

All indices are zero-based. Stick Y is negative upward. **Do not clamp the D-pad axis before decoding:** clamping its neutral value to +1 would turn release into Up-left. Buttons 2, 5, 15, 16 and axes 6-8 remain unassigned. No separate Share/Capture or Home/PS mapping was established.

## Use the example

Requires Node.js 22 or newer for the tests/server. No package installation or third-party runtime dependencies are needed.

```sh
npm test
npm run capture
# Open http://127.0.0.1:8787/capture/
```

```js
import { resolveInput, createButtonEdges } from './src/adapter.mjs';

const edges = createButtonEdges();
const result = resolveInput(pad, {
  // Supply a function only when the user explicitly selected calibration.
  calibration: selectedUserCalibration,
  standard: yourExistingStandardHandler,
  // Host-confirmed context; Gamepad API does not establish USB transport.
  environment: { os: 'Windows', browser: 'Chrome', transport: 'USB' }
});
if (result.source === 'backbone-raw') {
  const pressedOnce = edges.update(result.state);
  // Apply host deadzones, action bindings and analog thresholds here.
}
// On blur, disconnect, controller/path changes, pause/resume, or scene/menu transitions:
edges.reset(); // Held buttons must be released before a later press can fire.
```

The routing order is explicit user calibration, browser `mapping="standard"`, this exact raw profile, then fallback. A selected calibration is never silently replaced. A standard pad stays on the standard handler even if it has the same name. An unknown or malformed pad returns fallback (`state: null`); the host should offer diagnostics/calibration. The example requires an explicit Windows/Chrome/USB context and does not infer transport from a browser ID. Chrome versions other than the observed version remain unverified; retest after browser/firmware changes.

The adapter supplies semantic snapshots. It does not choose glyphs, remap game actions, calibrate deadzones, or certify any engine/game integration. Preserve raw values before normalization. The button-edge helper suppresses initial held buttons and repeats until release; analog action latching and movement deadzones belong to the integrating application.

## Capture and privacy

Start capture explicitly. Keep separately labelled released/held snapshots, then explicitly download JSON if wanted. Polling stops on blur, hidden tab, disconnect, API error, or Stop; resuming requires Start. The page waits for browser activation if no controller is exposed. It never uploads, auto-saves, requests other devices, or records keyboard input. Only Gamepad API numeric values and fixed labels are retained in memory. Raw device IDs, timestamps, user agents and account data are omitted. The server binds only to `127.0.0.1`, serves four allowlisted assets, and has no upload endpoint. See [the complete privacy model](docs/privacy.md).

## Evidence, limitations and contributions

The supplied Markdown/PDF are the owner's sanitized, physically labelled hardware reference. Only those two source documents were copied; fixture snapshots are reconstructed from their published values. No raw capture session or private game source is included.

Stick extrema are observations, not permanent calibration limits. Some first samples were already held; these identify controls but do not establish captured rising edges. The notes document targeted retries and D-pad release transients. Android/iOS, Steam Input, other revisions, other browsers, native APIs and complete gameplay were not certified. The historical references to Out 4 Blood in the documents do not claim it was tested or imply its authors' endorsement.

See [CONTRIBUTING.md](CONTRIBUTING.md) for sanitized evidence requirements and acceptance checks. A different signature needs its own evidence and profile; do not broaden this override from a product name alone. Fixture tests verify software behavior against documented values, not fresh physical hardware behavior.

## License and affiliation

Newly authored repository material is MIT licensed; the two supplied reference documents are excluded from that grant and reproduced with the repository owner's authorization. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). No third-party or private game code is relicensed.

This is an unofficial community reference, not affiliated with or endorsed by Backbone, Sony/PlayStation, Google/Chrome, Microsoft, or any game or engine developer. Product names are used only to describe tested hardware/software.

API references: [Gamepad.mapping (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping) and [W3C Gamepad specification](https://www.w3.org/TR/gamepad/). These describe the API; the device-specific values come from the supplied hardware reference.
