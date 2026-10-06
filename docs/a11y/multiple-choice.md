# Multiple Choice A11y Coverage

## Intended Use

Students select one or more answer choices, with gather and evaluate modes for response entry and feedback.

## Automated Coverage

- `single-select-radio-group`: radio-style choice semantics, group labelling, keyboard selection, and state exposure.
- `multi-select-checkbox-group`: checkbox-style multi-select semantics, target size, and keyboard selection.
- `evaluate-feedback-status`: correctness state, feedback text, and status-message semantics.

The choice focus ring and hover ring take the [THEMING.md](../THEMING.md) focus chain, `#1565C0` under no theme ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)). The multiple-choice unit tests pin the rules.

## Not Covered / Manual

- Confirm configured single-select vs multi-select semantics match the item model.
- Confirm feedback is clear without relying on icons, color, or choice position alone.
