# McPopulatedBlank — Domain Glossary

## ClozeMarker

The inline visual slot within a sentence template that displays the student's currently selected answer. It renders in one of three states: empty (no selection), text (selected choice's label HTML), or image (selected choice's image). Carries the live-region ARIA contract (`role=status`, `aria-live=polite`) so screen readers announce selection changes without moving focus.

Implemented as `ClozeMarker.svelte`. Not the same as the blank as a structural position in the template string — that is just the `{{blank}}` token placeholder.

## ChoiceRow

A single selectable answer tile. Renders in two layouts: **inline** (radio left, label right) and **horizontal** (label above, radio below, tile-style). Displays a correctness badge (✓ or ✕) in evaluate mode. Does not own selection state — selection is managed by the parent fieldset via event bubbling.

Implemented as `ChoiceRow.svelte`.
