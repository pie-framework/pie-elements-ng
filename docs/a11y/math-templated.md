# Math Templated A11y Coverage

## Intended Use

Students fill math response fields embedded in a math template.

## Automated Coverage

- `templated-math-response-fields`: response field labels, focus order, equation-editor affordances, and math alternatives.
- `templated-math-evaluate-feedback`: evaluate-mode feedback, preserved field labels, math alternatives, and status semantics.

The response areas are prompts of one MathLive `<math-field>`, which `@pie-lib/math-input-mathlive` names "Enter answer" in the item language ([PIE-1164](https://illuminate.atlassian.net/browse/PIE-1164)).

The keypad takes math-inline's focus ring and key ink ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)). The response field draws MathLive's own caret, bars and border, and submitted answers render as MathLive static markup, whose bars take the text colour.

## Not Covered / Manual

- Confirm each blank is announced with enough surrounding expression context.
- Confirm template navigation and math entry remain usable with screen readers.
