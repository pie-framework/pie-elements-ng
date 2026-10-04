# Math Inline A11y Coverage

## Intended Use

Students enter math responses inline with prompt content through a math editor or rendered math controls.

## Automated Coverage

- `inline-math-editor-controls`: editor naming, keyboard reachability, rendered math semantics, and math alternatives.
- `inline-math-evaluate-feedback`: evaluate-mode feedback, math alternatives, and status semantics.

Each response field's textarea is named "Enter answer" by `@pie-lib/math-input`, and math-inline adds the keypad instructions as its description ([PIE-1164](https://illuminate.atlassian.net/browse/PIE-1164)). The advanced response type names it in the item language; the simple one stays English because `@pie-lib/math-toolbar` does not pass the language to its input.

## Not Covered / Manual

- Confirm equation editor operation and rendered math output are usable with screen readers.
- Confirm spoken math alternatives preserve enough meaning for the task.
