# 08 — Image-based variant additions

Type: **HITL**

## What to build

Identify Learnosity items in the `1JQLtMp0itQcxfSQ` org that use image-based choices (as opposed to text choices). Add corresponding entries to `mc-populated-blank.json` with `sourceReference` fields pointing to those items. These entries unlock parity testing for the image-choice rendering path, which current text-only variants do not exercise.

Use `scripts/fetch-learnosity-item.mjs` to inspect candidate items and verify they map correctly to McPopulatedBlank's model shape (image URL, image alt, correct choice ID).

## Acceptance criteria

- [ ] At least one image-based choice variant entry added to `mc-populated-blank.json` with a valid `sourceReference`.
- [ ] The new entry renders correctly on the existing deliver route (`/mc-populated-blank/deliver?demo=<id>`).
- [ ] The new entry renders correctly on the parity route (`/mc-populated-blank/parity?demo=<id>`) once issues 01–02 are complete.
- [ ] Image alt text from the Learnosity item is mapped to the PIE model's `imageAlt` field.

## Blocked by

None — can start immediately (parallel track; parity spec coverage depends on issues 01–06 being complete first).
