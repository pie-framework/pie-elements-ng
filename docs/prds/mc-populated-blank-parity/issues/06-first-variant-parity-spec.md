# 06 — First variant parity spec (gplusggg)

Type: **AFK**

## What to build

Write the full parity spec for `variant-sel-r1-gplusggg` covering all three dimensions: visual, ARIA, and behavioral. This spec establishes the pattern all subsequent variant specs follow.

**Visual**: assert that computed CSS values on semantically corresponding elements (tile background, blank underline thickness, font size, gap between tiles, audio button position) match between `#pie-container` and `#learnosity-container` — not against hardcoded pixel values.

**ARIA**: assert the specific named attributes from the list produced in issue 05 on corresponding elements in both containers.

**Behavioral**: using the audio mock from issue 04, fire a `play` event and assert both containers switch to their playing image state; fire `ended` and assert both return to their silent state.

The existing `mc-populated-blank-gplusggg-parity.spec.ts` is extended (not replaced) with a new `describe` block scoped to the parity route. The old CSS-geometry assertions against hardcoded values remain.

## Acceptance criteria

- [ ] Spec navigates to `/mc-populated-blank/parity?demo=variant-sel-r1-gplusggg` and waits for `[data-learnosity-ready="true"]`.
- [ ] Visual section: at least 5 CSS property cross-comparisons pass (PIE value === Learnosity value).
- [ ] ARIA section: all attributes from the issue 05 list are asserted on both containers.
- [ ] Behavioral section: audio mock `play` → both containers show playing state; `ended` → both show silent state.
- [ ] Tests skip gracefully when `LEARNOSITY_CONSUMER_KEY` is absent.
- [ ] Spec file structure (three `describe` blocks: visual, aria, behavioral) is documented in a comment for variant spec authors to follow.

## Blocked by

- Issue 03 — Sentinel element identification
- Issue 04 — Audio mock utility
- Issue 05 — ARIA attribute list determination
