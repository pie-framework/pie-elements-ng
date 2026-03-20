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
