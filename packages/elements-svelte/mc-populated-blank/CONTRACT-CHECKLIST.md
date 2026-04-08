# mc-populated-blank Contract Checklist

This checklist defines the required PIE contract behavior for `@pie-element/mc-populated-blank`.

## Model output (`controller.model`)

- [ ] `mode` is present and equals `env.mode`.
- [ ] `disabled` is `true` when `mode !== "gather"`.
- [ ] `correctChoiceId` is only present in `evaluate` mode.
- [ ] `responseCorrect` is only present in `evaluate` mode.
- [ ] `teacherInstructions` is only present for instructor `view`/`evaluate`.
- [ ] `choices` order is deterministic when shuffling is enabled and not locked.

## Outcome output (`controller.outcome`)

- [ ] Returns a consistent shape with `score`, `empty`, and `traceLog`.
- [ ] Empty or unanswered sessions return `score: 0` and `empty: true`.
- [ ] Answered sessions return `empty: false` and binary score (`0` or `1`).

## Completion semantics

- [ ] `isComplete` is the single source of truth for completion.
- [ ] Completion respects audio gating when autoplay + complete-audio are enabled.
- [ ] Delivery does not emit divergent completeness metadata.

## Event contract (`delivery`)

- [ ] `model-set` and `session-changed` details use `component: tagName.toLowerCase()`.
- [ ] `session-changed` detail `complete` comes from controller `isComplete`.
- [ ] No fallback legacy event payloads are emitted.

## Packaging contract

- [ ] `exports` entries resolve to built files for `.`, `./delivery`, `./controller`, `./author`, `./print`.
- [ ] IIFE policy is explicit via `./iife` export.
- [ ] Runtime dependencies include only what delivery/controller actually import.
