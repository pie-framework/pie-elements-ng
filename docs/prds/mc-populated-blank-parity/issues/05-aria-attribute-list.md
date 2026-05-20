# 05 — ARIA attribute list determination

Type: **HITL**

## What to build

With the parity route running in a headed browser, use `page.accessibility.snapshot()` and direct DOM inspection on both `#pie-container` and `#learnosity-container` for the `variant-sel-r1-gplusggg` variant to produce the definitive list of ARIA attributes the parity tests will assert.

The goal is a specific, narrow list — not a full tree snapshot diff. For each attribute identified, document:
- The semantic intent (e.g. "blank slot announces its label to screen readers")
- The corresponding selector on each side
- The assertion strategy (exact match, pattern match, or semantic equivalence)

Commit the list as a comment block or small markdown note alongside the first variant spec (issue 06). It becomes the reference for all subsequent variant specs.

## Acceptance criteria

- [ ] ARIA attributes for at least the following elements are documented: blank slot, choices group/radiogroup, individual radio inputs, audio button, audio transcript region.
- [ ] Each attribute entry specifies the PIE selector, the Learnosity selector, and the assertion strategy.
- [ ] Any meaningful differences between PIE and Learnosity ARIA output are flagged for review (not silently papered over with loose assertions).
- [ ] The list is committed to the repo alongside or within the issue 06 spec file.

## Blocked by

- Issue 02 — Parity route skeleton
