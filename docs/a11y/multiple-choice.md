# Multiple Choice A11y Coverage

## Intended Use

Students select one or more answer choices, with gather and evaluate modes for response entry and feedback.

## Automated Coverage

- `single-select-radio-group`: radio-style choice semantics, group labelling, keyboard selection, and state exposure.
- `multi-select-checkbox-group`: checkbox-style multi-select semantics, target size, and keyboard selection.
- `evaluate-feedback-status`: correctness state, feedback text, and status-message semantics.

The choice focus ring and hover ring take the [THEMING.md](../THEMING.md) focus chain, `#1565C0` under no theme ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)). The multiple-choice unit tests pin the rules.

## Authoring

The prompt, teacher instructions, choices, and rationales have accessible names.
Choice fields and correct-answer controls include the current letter or number,
so repeated fields can be distinguished. Configured field labels are preserved
in those names.
- `src/author/__tests__/accessible-names.test.tsx` checks all eight rich-text
  fields and three correct-answer radios in a three-choice author, including a
  configured prompt-label change.
- Shared `@pie-lib/config-ui` tests cover native radio, checkbox and switch names,
  choice renumbering, custom feedback names, and change callbacks.
- On 22 October 2026, the built element demo passed the scoped axe-core 4.14.0
  `aria-input-field-name`, `label`, and `label-content-name-mismatch` checks in
  both checkbox and radio configurations. Browser keyboard checks confirmed
  that selecting a named correct-answer radio updates its checked state.

## Not Covered / Manual

- Confirm configured single-select vs multi-select semantics match the item model.
- Confirm feedback is clear without relying on icons, color, or choice position alone.
- Complete rich-editing workflows and announcements still need screen-reader
  testing. The authoring checks above establish control names, not full WCAG
  conformance of the editor or its dialogs.
