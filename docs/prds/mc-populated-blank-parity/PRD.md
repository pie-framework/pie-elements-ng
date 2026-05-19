# McPopulatedBlank parity testing harness

Status: **Proposal** · Impl. path: `apps/learnosity-parity-demo` + parity test infrastructure

## Context

McPopulatedBlank is a PIE-framework port of the Renaissance Custom Question type defined in `web-ItemBankViewer/learnosity/templates/Renaissance`. The reference implementation is a set of Learnosity Custom Question API objects (JavaScript factories) that render inside the Learnosity Items API runtime. The PIE port must match the reference across three dimensions: visual layout, ARIA/accessibility semantics, and behavioral fidelity (audio playback, image switching during playback).

The current parity test suite consists of static screenshot-derived CSS assertions, one spec file per variant. These cover layout geometry and computed CSS values but cannot test ARIA attributes, audio event sequencing, or the image-switching behavior that is the core interactive feature of several variants. The suite is also fragile: layout pixel thresholds break on minor CSS changes unrelated to parity.

This PRD specifies a live side-by-side parity harness: a dedicated local parity app hosts both the PIE rendering and a Learnosity rendering of the same item on a dedicated route, and Playwright tests compare the two live DOMs directly.

## Goals

- A dedicated parity route in `apps/learnosity-parity-demo` renders PIE and Learnosity side by side for any variant, derived from the existing `mc-populated-blank.json` sample registry.
- Playwright tests can assert visual, ARIA, and behavioral parity by querying both DOMs in a single test run, with no external authentication required.
- Audio behavioral tests are deterministic — they do not depend on network audio playback or Chromium's audio stack.
- Test organization mirrors the variant structure: one spec file per variant, covering all three parity dimensions.
- The `mc-populated-blank.json` registry is extended to include image-based choice variants (currently only text-choice variants have Learnosity source references).

## Non-goals

- **Not a replacement for the existing parity specs.** The existing CSS-geometry tests provide a fast, CI-safe check against known values; they stay. The new harness supplements them with live cross-comparison.
- **No authentication dependency.** The Learnosity signing endpoint lives inside the local parity app and sources credentials from env vars, not from PIEOneer or any deployed service.
- **Not a general Learnosity integration.** The signing endpoint and parity route exist solely as a local test harness. They are gated behind env var presence so they cannot function in production builds without credentials configured.
- **No real audio playback in behavioral tests.** Chromium headless audio reliability is not the property being tested; what matters is whether the PIE and Learnosity implementations respond identically to the same audio lifecycle events. Real network audio is deferred to manual QA.
- **No coverage of Learnosity authoring, scoring, or response-masking APIs.** Only the delivery rendering surface (gather mode) is in scope.

## Proposed surface

**New route**: `/mc-populated-blank/parity?demo=<demoId>`

- Server `load` function signs the Learnosity Items API payload using the demo ID to look up the item reference in `mc-populated-blank.json`.
- Page renders two containers side by side: `#pie-container` (PIE element via the existing ESM player) and `#learnosity-container` (Learnosity Items API initialized via CDN script in `onMount`).
- `onMount` polls via `setInterval` for a known sentinel element inside `#learnosity-container`; when found, sets `data-learnosity-ready="true"` on the container. The sentinel element is determined empirically during implementation by inspecting the headed browser.
- Playwright tests `waitForSelector('[data-learnosity-ready="true"]')` before running assertions.

**New signing endpoint**: `/mc-populated-blank/parity/sign` (or as a SvelteKit `+page.server.ts` load function — implementation may fold this into the page load rather than a separate endpoint)

- Accepts demo ID, looks up `sourceReference` in `mc-populated-blank.json`, returns a signed Learnosity Items API init config.
- Returns 503 if `LEARNOSITY_CONSUMER_KEY` / `LEARNOSITY_SECRET` env vars are absent.
- Signing algorithm matches the existing implementation in `scripts/fetch-learnosity-item.mjs`.

**Audio mock**: `page.addInitScript()` in test setup replaces `window.HTMLAudioElement` with a controllable fake that fires `play`, `pause`, `ended`, and `timeupdate` events on demand. Applied to both `#pie-container` and `#learnosity-container` contexts so behavioral assertions are symmetric.

**`mc-populated-blank.json` additions**: new entries for image-based choice variants with `sourceReference` fields pointing to corresponding Learnosity items.

**Test structure**: one spec file per variant (e.g. `mc-populated-blank-gplusggg-parity.spec.ts` extended, not replaced), structured in three sections — visual, ARIA, behavioral.

**ARIA assertion list**: deferred — determined by inspecting both live DOMs during implementation. The principle is specific named attribute assertions on semantically corresponding elements (e.g. "both sides expose a radiogroup with an accessible label", "both sides have a polite live region on the blank slot"), not full accessibility tree snapshot diffs.

## Worked example

Demo ID `variant-sel-r1-gplusggg` maps to Learnosity item `11b4d9be-a79e-48c3-9e58-84f5be3dbb0f`. The parity route loads both renderings. A Playwright test:

1. Waits for `[data-learnosity-ready="true"]`.
2. Reads `aria-label` from the Learnosity blank slot and from the PIE `.pie-blank-slot` element.
3. Asserts the two values communicate the same semantic intent (blank placeholder label).
4. Fires a synthetic `play` event via the audio mock.
5. Asserts both sides switch to their "playing" image state.

## Accessibility

This PRD adds test infrastructure, not a delivery surface. The ARIA parity tests are themselves an accessibility verification mechanism — they assert that the PIE element produces equivalent semantic markup to the reference. No new WCAG obligations arise from the harness itself.

## Open questions

- [ ] What is the reliable Learnosity sentinel element to poll for in `setInterval`? Determined by headed browser inspection during implementation.
- [ ] Which specific ARIA attributes require cross-comparison assertions? Determined by inspecting both live DOMs during implementation.
- [ ] Which image-based choice variants have corresponding Learnosity items available in the `1JQLtMp0itQcxfSQ` org? Requires a lookup pass against the Learnosity item bank.
