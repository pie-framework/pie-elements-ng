# 07 — Remaining variant parity specs

Type: **AFK**

## What to build

Following the pattern established in issue 06, write parity specs for all remaining variants:

- `sel_vic` — inline_sentence layout, vertical choices, visible audio + transcript
- `sr_vic` — inline_sentence layout, vertical choices, no visible audio
- `sel_r1-s3` — stimulus_image_blank layout
- `sel_r1-_ggplusggg` — audio_blank_only, horizontal choices (gg variant)
- `sel_r1-g_plusggg` — audio_blank_only, horizontal choices (g variant)

Each spec extends the corresponding existing `*-parity.spec.ts` file with a new `describe` block scoped to the parity route. Existing hardcoded CSS-geometry assertions are not removed.

Variant-specific behavioral differences (e.g. sel-vic has a visible transcript that toggles; sr-vic has a screen-reader-only transcript) should be reflected in the behavioral section of each spec.

## Acceptance criteria

- [ ] One extended parity spec per variant listed above.
- [ ] Each spec passes the same three-section structure (visual, ARIA, behavioral) from issue 06.
- [ ] Visual cross-comparisons cover the layout properties specific to each variant's profile (e.g. stimulus image position for s3, transcript visibility for sel-vic).
- [ ] All specs skip gracefully when `LEARNOSITY_CONSUMER_KEY` is absent.
- [ ] All new specs pass in CI when credentials are configured.

## Blocked by

- Issue 06 — First variant parity spec (gplusggg)
