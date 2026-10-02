# Legacy-compatible print artifact

Status: **Accepted** · Impl. path: Cross-cutting

## Context

PIE-647 found that print stops working when an item/section renders elements built as `pie-elements-ng` ESM bundles — a regression against classic `pie-elements`, where print worked. The decision recorded on PIE-647 was to make **this repo's** print output compatible with how print is actually used by clients today, rather than requiring every client to adopt the new item-level `@pie-players/pie-print-player` in lockstep with their `pie-elements-ng` migration. PIE-839 tracks that implementation.

The client-side loader running in production today is `@pie-framework/pie-print` (`key-data-systems/pie-print-support`). Its resolver builds a URL as `` `https://cdn.jsdelivr.net/npm/${pkg}/module/print.js` `` and loads it with a bare `import(url)` — **no import map is ever injected**, not even for React. Classic `pie-elements` satisfies this because its `module/print.js` (built by `pslb`) externalizes React/MUI/lodash/etc. as **relative CDN paths** into sibling `@pie-lib/*-module` packages, so nothing is a bare specifier and nothing needs an import map.

`pie-elements-ng`'s print artifact (`dist/browser/print/index.js`, documented in [`PRINT_SUPPORT.md`](../../PRINT_SUPPORT.md)) is shaped differently: self-contained except for a bare `react` / `react-dom` import, resolved only by an import map that the *new* `pie-print-player` injects. Fed through the current client's loader, it fails twice over — wrong path (`module/print.js` doesn't exist) and an unresolvable `react` specifier (no import map). That's the regression.

## Goals

- An item/section using `pie-elements-ng` print-enabled elements prints correctly through the **existing, unmodified** `@pie-framework/pie-print` client loader — no client-side changes, no import map, no new resolver.
- The existing `dist/browser/print/index.js` artifact and its `pie-print-player` compatibility (validated in PIE-647) keep working unchanged — this is additive, not a replacement.
- Publishing a new version of an already-print-enabled element (e.g. `multiple-choice`) produces both artifacts automatically, from that version's own source, with no separate manual step and no possibility of the two drifting apart.
- The fix is generic build-pipeline behavior (`tools/vite/**`), not a per-element workaround, per this repo's shared-infra guardrails.

## Non-goals

- **Not changing `pie-elements` (classic) or `pie-players` (`pie-print-player`, `pie-print-support`)** — those are separate repos; PIE-647 decided the compatibility work happens on the `pie-elements-ng` side, not by asking clients or the player repos to change.
- **Not replicating the classic `@pie-lib/*-module` DLL / relative-CDN-path trick.** It would avoid duplicating React across element bundles, but only at the cost of standing up and permanently versioning a new shared package, and depending on jsdelivr's undocumented relative-path-across-packages resolution. A fully self-contained artifact reaches the same compatibility goal with materially less ongoing maintenance.
- **Not deduplicating React across print bundles on one printed page.** Each print custom element already mounts its own isolated `createRoot(this)` — nothing today relies on a shared React singleton across print elements (unlike the interactive multi-element delivery page). Bundling React per element is a size cost, not a correctness risk, and optimizing it is out of scope here.
- **Not adding print support to elements that don't have it today** (10 of 28, per `PRINT_SUPPORT.md`). This only changes how *already* print-enabled elements are bundled.
- **Not changing `package.json#exports`.** The legacy client resolver fetches `<pkg>/module/print.js` as a raw CDN path — it never goes through Node's exports resolution — so no exports-map change is required for compatibility. An exports entry may still be added later for hygiene, but it isn't load-bearing here.

## Proposed surface

Cross-cutting build-pipeline change:

- **Contracts touched**: `tools/vite/**` (new build lane) and each print-enabled package's publish surface (new `module/print.js` file shipped in the npm tarball).
- **New build lane**: a new shared Vite config (sibling to [`element-browser.config.ts`](../../../tools/vite/element-browser.config.ts)) reusing the same `entryIfExists('print/index', …)` detection, but with an **empty externals list** — React included — so the emitted bundle has zero bare specifiers. Output goes to the package's `module/` directory (not `dist/browser`), matching the literal path `@pie-framework/pie-print`'s resolver requests.
- **Externals policy**: either a parallel policy file to [`browser-esm-policy.json`](../../../tools/vite/browser-esm-policy.json) (e.g. `legacy-print-esm-policy.json`, empty `allowedBareImports`) or a policy flag on the existing one — either way, expressed generically so it applies by pattern to every package, not per-element.
- **Publish surface**: package `files`/`publishConfig` updated so `module/print.js` (and its sourcemap) is included in the published tarball.
- **Migration story for existing elements**: none required. The new lane derives its entry the same way the existing browser build does — presence of `src/print/index.ts(x)`. Packages without print are unaffected; packages with print gain the new artifact automatically on their next build.
- **Docs**: `PRINT_SUPPORT.md`'s "classic vs ng" comparison table gets a third artifact row explaining `module/print.js` exists specifically for the legacy `@pie-framework/pie-print` loader, alongside the existing `dist/browser/print/index.js` row for `pie-print-player`.

## Worked example

A client still running today's unmodified `@pie-framework/pie-print` prints an item containing `pie-elements-ng`'s `multiple-choice`. Its resolver requests `https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice@<version>/module/print.js` and does `import(url)` with no import map. That file now exists, is fully self-contained (React inlined), and defines the print custom element successfully. The same published version also still ships `dist/browser/print/index.js`, so a client already on the new `@pie-players/pie-print-player` continues to load that artifact and its React import map unchanged.

## Accessibility

No accessibility surface changes — this PRD only changes how an already-shipped print bundle is packaged for distribution (build output shape and publish path). Rendered DOM, ARIA structure, and print-mode behavior are unchanged; existing per-element print accessibility contracts continue to apply as-is.

## Open questions

- [ ] Does any client's CDN/browser cache need explicit invalidation for versions published *before* this change ships, or is it acceptable that only new element versions gain the `module/print.js` artifact (older, already-published versions never retroactively get one)?
- [ ] Should a size budget analogous to `maxBrowserJsBytesPerPackage` in `browser-esm-policy.json` apply to the new `module/print.js` lane, given React/ReactDOM add roughly 40-45 KB gzipped per element?

## Status log

- Raised as proposal from PIE-647 / PIE-839 discussion.
- Accepted — scoped explicitly to the elements that already have print support today; implementation started in the same session.
