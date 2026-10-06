# Math Inline A11y Coverage

## Intended Use

Students enter math responses inline with prompt content through a math editor or rendered math controls.

## Automated Coverage

- `inline-math-editor-controls`: editor naming, keyboard reachability, rendered math semantics, and math alternatives.
- `inline-math-evaluate-feedback`: evaluate-mode feedback, math alternatives, and status semantics.

Each response field's textarea is named "Enter answer" by `@pie-lib/math-input`, and math-inline adds the keypad instructions as its description ([PIE-1164](https://illuminate.atlassian.net/browse/PIE-1164)). The advanced response type names it in the item language; the simple one stays English because `@pie-lib/math-toolbar` does not pass the language to its input.

Keypad keys draw the [THEMING.md](../THEMING.md) focus chain on keyboard focus, backed inside by a 2px `--pie-background` ring, and their labels take `--pie-text` darkened to hold 4.5:1 on the key fills under grey-on-light-grey and purple-on-light-green. In the response fields the MathQuill caret and bars take the text colour and an unfocused field border takes `--pie-border-dark` ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)). Submitted answers in evaluate and view render outside that styling and keep MathQuill's black and `#4d4d4d` bars.

## Not Covered / Manual

- Confirm equation editor operation and rendered math output are usable with screen readers.
- Confirm spoken math alternatives preserve enough meaning for the task.
