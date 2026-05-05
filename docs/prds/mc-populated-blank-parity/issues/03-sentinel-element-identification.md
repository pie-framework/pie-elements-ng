# 03 — Sentinel element identification

Type: **HITL** ✅ Resolved — sentinel is `lrn-assess`

## What to build

Run the parity route in a headed browser with credentials configured. Inspect the Learnosity-rendered DOM in `#learnosity-container` to identify a reliable element that is always present once rendering is complete, regardless of variant. Commit the sentinel selector as a named constant in the parity route component, replacing the placeholder from issue 02.

The sentinel must be present for all variants (gplusggg, sel-vic, sr-vic, s3, gg-plus, g-plus) — verify by loading at least two variants before committing.

## Acceptance criteria

- [ ] A specific CSS selector (or DOM attribute check) is identified that reliably indicates Learnosity rendering is complete across all variants.
- [ ] The selector is committed as a named constant in the parity route.
- [ ] `data-learnosity-ready="true"` fires consistently within 10 seconds of page load in a headed browser for at least two variants.
- [ ] The constant and the reason for choosing it are documented in a one-line comment.

## Blocked by

- Issue 02 — Parity route skeleton
