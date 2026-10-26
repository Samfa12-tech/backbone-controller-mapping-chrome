# Validation record

Validated on 26 October 2026, using Node.js 22.22.2 and an isolated headless Chrome profile. No phone/controller interaction or new physical capture was performed.

`npm test` runs 17 fixture/local-server tests covering:

- Every documented button; unassigned buttons and axes; independent sticks/triggers; all eight D-pad directions, tolerance, neutral and invalid values.
- Exact signature/context checks, malformed snapshots, explicit calibration priority, standard handler priority and unknown-device fallback.
- Initial held L3/R3/menu suppression, one edge per press and release-required rearming after lifecycle resets.
- Explicit capture start, late browser activation, single polling loop, canceled/stale callbacks, stop/resume, blur/hidden/disconnect/error behavior, bounded labelled samples and export copies.
- Sanitization of synthetic private identifiers/non-finite values, absence of network/storage/keyboard code, local-only static assets, restrictive headers and rejected upload requests.

A separate local headless browser smoke check exercised the actual capture UI with a synthetic `getGamepads()` implementation installed before page load. It verified Start/wait/activation, neutral preservation, explicit sanitized download, blur/disconnect/pagehide/hidden-tab stop behavior, explicit restart, identifier omission, Clear and missing-pad handling. It observed only the four loopback capture asset requests and no JavaScript exceptions. This browser check was run in the isolated authoring workspace; the public repository includes the portable fixture tests.

Both supplied reference documents were visually/content reviewed before publication and copied without changing their bytes. The PDF has four pages, no form or JavaScript, and generic hardware-reference metadata. The final publication list was reviewed for private source, raw captures, personal paths and credentials.

These checks validate this example software and sanitized publication contents. They do not establish fresh hardware results, firmware/browser portability, standard PS/Xbox physical-controller regression results, or gameplay/engine integration. Those require separate physical acceptance testing as described in CONTRIBUTING.md.
