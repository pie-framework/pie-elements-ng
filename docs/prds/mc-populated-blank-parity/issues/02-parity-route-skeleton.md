# 02 — Parity route skeleton

Type: **AFK**

## What to build

Add the `/mc-populated-blank/parity` SvelteKit route. The page renders two containers side by side: `#pie-container` (PIE element via the existing ESM player, identical to the deliver route) and `#learnosity-container` (Learnosity Items API initialized with the signed payload from the server load). In `onMount`, load the Learnosity CDN script, then call `LearnosityItems.init()` with the signed payload. Poll via `setInterval` for the sentinel element (placeholder constant — resolved in issue 03). When the sentinel is found, set `data-learnosity-ready="true"` on `#learnosity-container` and clear the interval.

The route is demoable: navigating to it in a headed browser with credentials configured shows both renderings side by side.

## Acceptance criteria

- [ ] `/mc-populated-blank/parity?demo=variant-sel-r1-gplusggg` renders `#pie-container` and `#learnosity-container` side by side in a headed browser.
- [ ] PIE element renders correctly (identical to the deliver route for the same demo).
- [ ] Learnosity Items API initializes without console errors when credentials are present.
- [ ] `data-learnosity-ready="true"` is set on `#learnosity-container` once Learnosity has rendered (sentinel placeholder may be a broad selector initially; sharpened in issue 03).
- [ ] Page shows a clear error state when credentials are absent (propagated from the server load 503).
- [ ] Route is excluded from the standard `test:e2e` run when credentials are absent (tests skip gracefully).

## Blocked by

- Issue 01 — Learnosity signing endpoint
