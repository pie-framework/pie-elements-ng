# Patricia Issues Tracker (One-by-One)

This document breaks down the reported regressions into isolated work items so they can be addressed and verified independently.

## How to use this tracker

- Pick the next unchecked item in **Execution Order**.
- Complete only that item's scope.
- Run the listed verification for that item.
- Mark it done before moving to the next one.

## Execution Order

- [x] 1) Prevent session/reset regressions on mode/role change
- [x] 2) Restore image upload in authoring
- [x] 3) Fix non-answerable item interactions in player
- [ ] 4) Reduce lag (focus: drawing-response)
- [ ] 5) Fix EBSR author import regression
- [ ] 6) Fix complex-rubric author crash (`any is not defined`)

---

## 1) Prevent session/reset regressions on mode/role change

### Problem
Items refresh/reset to initial state when switching mode or role.

### Target areas
- `apps/element-demo/src/routes/[element]/deliver/+page.svelte`
- `packages/element-player/src/players/PieElementPlayer.svelte`
- `apps/element-demo/src/routes/[element]/+layout.svelte`

### Useful `../pie-players` references
- `../pie-players/packages/item-player/src/PieItemPlayer.svelte` (session event normalization at host layer)
- `../pie-players/packages/players-shared/src/components/PieItemPlayer.svelte` (forwarding + dedupe patterns for session/model events)
- `../pie-players/packages/players-shared/src/pie/item-controller.ts` (`setSession` guard that avoids replacing real response data with metadata-only updates)

### Copy vs adapt
- **Copy idea:** metadata-only `session-changed` events should be filtered and deduped before updating host session state.
- **Adapt carefully:** keep `pie-elements-ng` single-element player flow; do not pull in `ItemController` wholesale unless needed.

### Item-player parity notes
- **Similar to item-player:** filters metadata-only session events and avoids redundant session forwarding.
- **Differs from item-player:** uses `pie-element-player` single-element event flow, not `players-shared` `ItemController` orchestration.

### Likely root causes
- Metadata-only `session-changed` payloads being treated as full sessions.
- Temporary `undefined` model/session during async mode/role rebuild causing visible reset/jank.

### Done criteria
- Mode/role toggles do not wipe existing responses.
- Session store remains a valid session object (not `{ complete, component }`-style metadata).
- No reactive loop introduced between layout URL sync and player updates.

### Verification
- Manual: answer item, switch mode/role, confirm response persists as expected.
- Run targeted e2e:
  - `apps/element-demo/test/e2e/unified-player-strategy.spec.ts`
  - related deliver-route tests in phase suites.

---

## 2) Restore image upload in authoring

### Problem
Image upload is not working in authoring/configure flows.

### Target areas
- `apps/element-demo/src/routes/[element]/author/+page.svelte`
- `packages/shared/configure-events/src/index.ts`

### Useful `../pie-players` references
- `../pie-players/packages/players-shared/src/pie/asset-handler.ts` (`insert.image`/`delete.image` listener manager pattern)
- `../pie-players/packages/players-shared/src/components/PieItemPlayer.svelte` (author handler wiring and `handler.done(err)` safety behavior)

### Copy vs adapt
- **Copy idea:** central event manager pattern for `insert.image`/`delete.image` and guaranteed `handler.done(...)` on success/failure.
- **Adapt carefully:** use a demo-safe local upload strategy (object/data URL), not production backend assumptions.

### Item-player parity notes
- **Similar to item-player:** host layer should own asset event handling and always resolve `handler.done(...)`.
- **Differs from item-player:** demo implementation may use local URL/data URL instead of backend upload contract.

### Likely root cause
- Host layer in demo is not handling configure upload events (`insert.image`, `delete.image`) and/or not calling `handler.done(...)`.

### Done criteria
- In author view, image insert succeeds and leaves pending/loading state.
- Delete image flow is handled cleanly.
- No console errors from unresolved image handlers.

### Verification
- Manual: insert/delete image in authoring elements that use rich text.
- Confirm handler lifecycle (`fileChosen`, `progress`, `done`) completes.

---

## 3) Fix non-answerable item interactions in player

### Problem
Some items cannot be answered in player: categorize, drag-in-the-blank, hotspot, number-line, select-text.

### Target areas
- `apps/element-demo/src/routes/[element]/deliver/+page.svelte`
- `packages/element-player/src/players/PieElementPlayer.svelte`
- Element controllers under `packages/elements-react/*/src/controller/index.ts`

### Useful `../pie-players` references
- `../pie-players/packages/item-player/src/PieItemPlayer.svelte` (session update flow into controller/store)
- `../pie-players/packages/players-shared/src/components/PieItemPlayer.svelte` (event capture/dispatch sequencing to avoid loops)

### Copy vs adapt
- **Copy idea:** guard against event echo loops and only forward session events that contain usable response data.
- **Adapt carefully:** preserve current deliver-route model rebuild strategy (session changes should not retrigger controller `model()` rebuild).

### Item-player parity notes
- **Similar to item-player:** interaction events should be loop-safe and only commit valid session payloads.
- **Differs from item-player:** this repo rebuilds via route/controller integration in SvelteKit demo rather than full `players-shared` update pipeline.

### Notes
- Many elements are intentionally disabled unless `mode === gather`.
- Validate this issue in `mode=gather&role=student` first.

### Done criteria
- Each listed element is answerable in gather/student mode.
- Session changes are reflected correctly in store/panel for elements that should mutate session visibly.

### Verification
- Run:
  - `apps/element-demo/test/e2e/phase1-spatial-dnd.spec.ts`
  - `apps/element-demo/test/e2e/phase2-structured.spec.ts`
- Manual smoke per listed element.

---

## 4) Reduce lag (focus: drawing-response)

### Problem
General lag across site, especially drawing-response drawing interactions.

### Target areas
- `packages/element-player/src/players/PieElementPlayer.svelte`
- `packages/elements-react/drawing-response/src/delivery/index.ts`

### Useful `../pie-players` references
- `../pie-players/packages/players-shared/src/pie/math-rendering.ts` (shared math rendering setup)
- `../pie-players/packages/players-shared/src/components/PieItemPlayer.svelte` (compare render/event scheduling decisions)

### Copy vs adapt
- **Copy idea:** keep math rendering centralized and avoid redundant triggers in high-frequency interactions.
- **Adapt carefully:** maintain existing `pie-elements-ng` math queue/observer protections while reducing render churn.

### Item-player parity notes
- **Similar to item-player:** aims for centralized math rendering behavior to reduce interaction overhead.
- **Differs from item-player:** `pie-elements-ng` currently includes player-level observer/queue throttling that is more explicit than item-player defaults.

### Likely contributors
- Repeated math rendering in high-frequency interaction paths.
- Mutation observer + render scheduling churn during frequent updates.

### Done criteria
- Noticeably smoother drawing strokes in drawing-response.
- No regression in math rendering correctness.

### Verification
- Manual draw stress test in drawing-response.
- Re-check math-heavy items after optimization.

---

## 5) Fix EBSR author import regression

### Problem
EBSR authoring fails due to incorrect multiple-choice import path.

### Required import
- Use:
  - `import MultipleChoiceConfigure from '@pie-element/multiple-choice/author'`
- Not:
  - `import MultipleChoiceConfigure from '@pie-element/multiple-choice'`

### Target area
- Synced output file:
  - `packages/elements-react/ebsr/src/author/index.ts`
- Upstream source should be fixed first per project policy.

### Item-player parity notes
- **Similar to item-player:** both require correct author-vs-delivery entrypoint imports for configure elements.
- **Differs from item-player:** this is a synced-source migration/import-path correction, not runtime event plumbing.

### Done criteria
- EBSR authoring loads without import/runtime error.

### Verification
- Manual EBSR author open + interaction.
- Sync and regenerate if fixed upstream.

---

## 6) Fix complex-rubric author crash (`any is not defined`)

### Problem
Author crashes with `Uncaught ReferenceError: any is not defined`.

### Target area
- Synced output file:
  - `packages/elements-react/complex-rubric/src/author/main.tsx`
- Upstream source should be fixed first per project policy.

### Item-player parity notes
- **Similar to item-player:** none functionally; this is a pure author runtime syntax/runtime bug fix.
- **Differs from item-player:** issue is specific to converted synced author code (`rubricTag: any = (...)`) rather than player architecture.

### Likely fix
- Replace invalid labeled assignment pattern:
  - `rubricTag: any = (...)`
- With standard assignment:
  - `rubricTag = (...)`

### Done criteria
- Complex-rubric author loads and rubric-type switching works without crash.

### Verification
- Manual author smoke for each rubric mode.

---

## Cross-project parity check (recommended)

Before finalizing fixes, compare behavior with item player in `../pie-players`, especially:

- Session event normalization / forwarding.
- Author asset event handling (`insert.image` / `delete.image`).
- Mode/view reload boundaries vs in-place updates.

Use parity as a guide, but keep this repo's architecture and constraints intact.

---

## Project policy reminders (important)

- `packages/elements-react/*` and `packages/lib-react/*` are synced outputs.
- Prefer upstream fixes first (`../pie-elements` / `../pie-lib`) and sync back:
  - `bun run upstream:update`
  - or targeted `bun run upstream:sync --element=<name>`
- Avoid element-specific hacks in shared infrastructure.

