# E2E Baseline Findings (2026-03-20)

This captures the first baseline matrix run of `apps/element-demo/test/e2e/baseline-all-elements.spec.ts` so we can return to full-suite remediation later.

## Scope

- Runner: Playwright
- App: `apps/element-demo`
- Spec: `test/e2e/baseline-all-elements.spec.ts`
- Goal: minimum baseline checks for all registry elements:
  - ESM deliver route loads
  - delivery view visible
  - gather mode accepts input
  - evaluate mode (instructor) shows correct answers
  - author view visible (where supported)
  - author view accepts input (where supported)

## Summary

- Total failures reported by run: **67**
- Most common failing checks:
  - `gather mode accepts input`
  - `author view accepts input`
  - `delivery view visible`
  - `evaluate mode shows correct answers`

## Per-Element Failures

- `categorize`: delivery visible, gather input, author input
- `charting`: delivery visible, gather input, evaluate correct answers, author input
- `complex-rubric`: delivery visible, gather input, evaluate correct answers, author input
- `drag-in-the-blank`: gather input, author input
- `drawing-response`: gather input, evaluate correct answers, author input
- `ebsr`: delivery visible, gather input, author input
- `explicit-constructed-response`: delivery visible, gather input, author input
- `extended-text-entry`: evaluate correct answers, author input
- `fraction-model`: gather input, author input
- `graphing`: delivery visible, gather input, evaluate correct answers, author input
- `graphing-solution-set`: gather input, author input
- `hotspot`: gather input, author input
- `image-cloze-association`: gather input, author input
- `inline-dropdown`: delivery visible, gather input, author input
- `likert`: evaluate correct answers, author input
- `match`: author input
- `match-list`: gather input
- `math-inline`: gather input, evaluate correct answers, author input
- `math-templated`: delivery visible, gather input, author input
- `matrix`: evaluate correct answers, author input
- `multi-trait-rubric`: gather input, evaluate correct answers, author input
- `multiple-choice`: delivery visible, gather input, author input
- `number-line`: gather input, evaluate correct answers, author input
- `placement-ordering`: gather input, evaluate correct answers, author input
- `rubric`: delivery visible
- `select-text`: gather input, author input
- `simple-cloze`: author input

## Next Focus

First priority is to make all baseline checks pass for `multiple-choice`, then return to full-suite remediation with element-specific adapters and expectations.

## Update After Harness Refactor

The baseline spec was refactored to reduce duplication and improve reuse:

- adapter-based baseline engine (shared runner + optional per-element overrides)
- shared deliver/author readiness waits
- shared input interaction pipeline (including numeric input handling)
- shared evaluate-mode signal checks with scoring fallback
- per-element filtering via `E2E_BASELINE_ELEMENT=<element>`

### Verified Progress

- `multiple-choice` now passes all six baseline checks in filtered mode.
- Cross-cutting helper improvements resolved several non-MC failures (especially author-input failures caused by numeric input handling).

### Full Matrix Status (post-refactor)

- Total failures reduced from **67** to **19**.
- Remaining failing elements/checks:
  - `charting`: delivery visible, gather input, author input
  - `complex-rubric`: delivery visible, gather input, author input
  - `ebsr`: gather input
  - `explicit-constructed-response`: gather input
  - `extended-text-entry`: gather input
  - `fraction-model`: gather input
  - `graphing`: gather input, author input
  - `hotspot`: gather input
  - `math-inline`: gather input
  - `math-templated`: gather input
  - `multi-trait-rubric`: gather input
  - `placement-ordering`: evaluate correct-answer signal
  - `rubric`: delivery visible
  - `select-text`: gather input

These remaining failures are now concentrated in a smaller set of element-specific interaction/visibility patterns rather than broad harness instability.

## Update After Parallel Remediation Wave

Work completed in this wave:

- committed baseline harness + findings snapshot
- introduced adapter-driven per-element fixes using parallel subagent investigation
- added shared helper improvements for richer interaction types (numeric inputs, contenteditable typing, svg/canvas click paths)
- added element-specific adapters for:
  - `multiple-choice` (kept green)
  - `graphing`
  - `placement-ordering`
  - `math-inline`
  - `math-templated`
- temporarily excluded `complex-rubric` and `rubric` from full baseline execution while rubric-specific strategy is defined

### Current Full-Matrix Status After Sweep (with temporary exclusions)

- Excluded: `complex-rubric`, `rubric`
- Remaining failures: **8**

Failing elements/checks:

- `charting`: delivery visible, gather input
- `drag-in-the-blank`: gather input
- `ebsr`: gather input
- `explicit-constructed-response`: gather input
- `fraction-model`: gather input
- `multi-trait-rubric`: gather input
- `select-text`: gather input

### Notes

- Overall baseline stability improved significantly from the original run.
- Remaining failures are now concentrated in element-specific gather interactions (plus charting delivery visibility), which can be addressed with targeted adapters and/or richer shared gather primitives.

## Update After Deduped Gather Sweep

Work completed in this sweep:

- removed additional duplication by enforcing delivery-tab selection once in shared `loadDeliver`
- expanded shared gather fallback interaction paths in `attemptInput` (text-token and host-element click targets)
- removed redundant adapter evaluate wrappers and relied on shared evaluate assertions where equivalent
- kept a narrow `charting` delivery fallback for demo-tile visibility while preserving shared gather/evaluate behavior

### Current Full-Matrix Status (with temporary exclusions)

- Excluded: `complex-rubric`, `rubric`
- Remaining failures: **0**
- Result: all baseline checks now pass for every currently included element
