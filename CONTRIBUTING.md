# Contributing

Keep claims tied to a tested signature. Please provide a small, manually reviewed, sanitized table or JSON fixture with:

- Controller edition/revision, OS, browser/version and transport, supplied manually after review.
- Shared vendor/product family IDs only, mapping string and axis/button counts. Remove raw IDs containing serials or unique identifiers.
- A released snapshot followed by separately labelled held and released observations for each claimed control. Note if a first sample was already held.
- All eight D-pad directions and neutral, each stick independently, triggers independently, and any targeted retries or ambiguous transitions.

Do not submit raw session dumps, account/session data, serial numbers, IP addresses, URLs with tokens, personal paths, private game code, screenshots of private applications, or other people's data. Review the local tool's exported JSON before sharing. No contact with a third-party developer is needed to contribute here.

For code/profile changes, run `npm test` on Node 22+. Add synthetic fixtures that exercise the claimed behavior and preserve these acceptance criteria:

1. Explicit calibration and standard mapped controllers take precedence; unknown signatures fall back.
2. Neutral produces no stick, trigger, D-pad or button action. Decode the hat before clamping.
3. Verify all identified indices, unassigned inputs, malformed data, both triggers and every hat direction.
4. Verify held-entry suppression, one edge per press, and reset/release behavior on focus, disconnect, pause/resume, scene/menu and controller changes.
5. Capture stays local, starts only explicitly, stops on lifecycle changes, has no keyboard logging/persistent storage/uploads, and exports only allowlisted sanitized fields.

Physical testing and gameplay acceptance remain separate from fixture tests. Test a standard PS/Xbox controller and an unknown raw pad when integrating into a game, then test movement/aim, menus, sliders, confirm/back and scene/minigame transitions. Do not claim those checks were done from fixtures alone.

Use a separate profile for new evidence instead of widening the existing signature match. Include provenance and permission for any contributed material. Do not copy private/third-party code under this repository's MIT license.
