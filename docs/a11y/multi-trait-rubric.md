# Multi Trait Rubric A11y Coverage

## Intended Use

Instructors review and score multiple rubric traits, each with score points and long descriptors.

## Automated Coverage

- `multi-trait-rubric-table-structure`: trait headings, score point descriptors, scoring controls, and programmatic relationships.
- `multi-trait-rubric-evaluate-feedback`: evaluate-mode trait feedback, score controls, and status semantics.

The Show Rubric toggle is a native button that reports its state through `aria-expanded` ([PIE-1166](https://illuminate.atlassian.net/browse/PIE-1166)).

## Not Covered / Manual

- Confirm trait, score point, and descriptor relationships are announced clearly.
- Confirm long descriptors remain navigable and do not create excessive cognitive load.
