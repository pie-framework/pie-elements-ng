# 04 — Audio mock utility

Type: **AFK**

## What to build

Create a test helper that installs a controllable `HTMLAudioElement` fake via Playwright's `page.addInitScript()`. The fake replaces the native `HTMLAudioElement` before the page loads so both `#pie-container` and `#learnosity-container` use it. The helper exposes a per-test API to trigger audio lifecycle events (`play`, `pause`, `ended`, `timeupdate`) on demand from test code.

The mock must be reversible — removing the `addInitScript()` call restores real audio. No test assertions depend on whether the mock or real audio is in use.

## Acceptance criteria

- [ ] `installAudioMock(page)` helper (in `test-helpers.ts` or a dedicated file) calls `page.addInitScript()` with a fake `HTMLAudioElement`.
- [ ] The fake fires `play`, `pause`, `ended`, and `timeupdate` events when triggered via a test-exposed control (e.g. `window.__audioMock.trigger('play')`).
- [ ] Applying the mock does not break page load or PIE element initialization.
- [ ] A unit-level smoke test confirms the mock fires the expected events.
- [ ] Removing the helper call from a test results in real `HTMLAudioElement` behavior (no side effects from the mock infrastructure).

## Blocked by

None — can start immediately.
