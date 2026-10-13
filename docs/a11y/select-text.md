# Select Text A11y Coverage

## Intended Use

Students select tokens or spans of text in a passage-like interaction.

## Automated Coverage

- `select-text-token-semantics`: token names, selection state, keyboard reachability, focus order, and target size.
- `select-text-evaluate-feedback`: evaluate-mode selected-state feedback and status-message semantics.

Each token is a toggle button (`role="button"` with `aria-pressed`) inside a `role="group"` named "Selectable text", or "Selectable text, select up to N" when `maxSelections` is set. In gather the text is one tab stop: the arrow keys, Home and End move between tokens, Space and Enter toggle the focused token, and each token is described by its position ("2 of 4"). At the selection limit, unselected tokens stay in the sequence as unavailable (`aria-disabled`). In view, evaluate and print the text has no tab stop; evaluate describes each marked token by its Legend label, in the item language ([PIE-1165](https://illuminate.atlassian.net/browse/PIE-1165), [PRD](../prds/select-text/PRD.md)).

A token holding math takes the math's speech in its name from the shared renderer ([PIE-1153](https://illuminate.atlassian.net/browse/PIE-1153), [MATH-RENDERING.md](../MATH-RENDERING.md#control-names)).

## Not Covered / Manual

- Confirm a screen reader announces each toggle from the pressed state alone, and the position and unavailable state at the limit.
- Confirm tokens stay reachable in screen-reader browse mode in view and evaluate.
- Confirm selected and unselected token states are announced without relying only on visual highlighting.
