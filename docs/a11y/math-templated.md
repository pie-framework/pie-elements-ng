# Math Templated A11y Coverage

## Intended Use

Students fill math response fields embedded in a math template.

## Automated Coverage

- `templated-math-response-fields`: response field labels, focus order, equation-editor affordances, and math alternatives.
- `templated-math-evaluate-feedback`: evaluate-mode feedback, preserved field labels, math alternatives, and status semantics.

Each response field's textarea is named "Enter answer" in the item language by `@pie-lib/math-input` ([PIE-1164](https://illuminate.atlassian.net/browse/PIE-1164)).

The keypad and the MathQuill response fields take math-inline's focus ring, key ink and field ink ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)); submitted answers keep MathQuill's black and `#4d4d4d` bars.

## Not Covered / Manual

- Confirm each blank is announced with enough surrounding expression context.
- Confirm template navigation and math entry remain usable with screen readers.
