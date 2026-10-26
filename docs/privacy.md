# Local capture privacy

The page reads only `navigator.getGamepads()` for device input, after Start. It uses normal UI click/select events and focus/visibility/disconnect events for lifecycle control. It has no keyboard event handlers, text entry, camera, microphone, geolocation, WebHID, WebUSB, haptics, telemetry, analytics, cookies, persistent storage or service worker.

There are no external scripts/fonts or remote resources. The content security policy blocks connections (`connect-src 'none'`), forms, objects and images. JavaScript has no fetch, XHR, WebSocket, beacon or upload code. The local server accepts GET requests for exactly four static capture assets; it binds to IPv4 loopback only, emits no request logs, and writes no samples. Initial asset delivery is local HTTP traffic; controller samples are never sent to the server.

Only the first connected Gamepad API slot is monitored. Disconnect other controllers before Start. A controller may require a real press in a focused page before it appears. This repository's automated tests use synthetic pads; they do not ask for a new physical capture.

Each kept sample contains a fixed physical-control label, `released` or `held`, axis/button counts, raw finite numeric axes, numeric button values, pressed flags, a normalized mapping category and a family category. The only recognized family is the exact public Backbone family ID; every other ID becomes `unrecognized`. The raw ID is used transiently for that comparison and is never displayed, retained or exported. Non-finite values become JSON null. Counts are capped at 64 axes / 128 buttons, and exports at 100 explicitly kept snapshots.

No raw ID, serial, browser user agent/version, operating-system detail, IP address, account name, device timestamp, event time or session identifier is added to a snapshot. There is no free-text label that could accidentally retain personal information. Browser download location/history are controlled by the browser, not by this page.

The current snapshot is cleared when polling stops. Kept snapshots remain only in tab memory until Clear or page close/reload. Stop/blur/hidden/disconnect/API error cancels polling; focus return does not restart it. Kept snapshots can be downloaded through an explicit local Blob download. No automatic submission or clipboard access occurs. Review files before manually sharing them.

This is intentionally a minimal observation tool, not an automatic mapping detector or full calibration system. Browser extensions, modified copies and the user's browser settings are outside this source's guarantees. Serve it using the provided loopback server rather than hosting a capture session publicly.
