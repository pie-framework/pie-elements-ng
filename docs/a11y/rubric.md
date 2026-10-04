# Rubric A11y Coverage

## Intended Use

Instructors review rubric score levels and descriptors for scoring or reporting.

## Automated Coverage

- `rubric-score-structure`: score levels, descriptors, labels, headings, and programmatic structure.
- `rubric-descriptor-reading-order`: descriptor reading order, group labels, and table-like relationships.

The Show Rubric toggle is at least 24px tall ([PIE-1169](https://illuminate.atlassian.net/browse/PIE-1169)).

## Open Gaps

- The toggle is an `h2` with `role="button"`, which removes it from heading navigation, and its fixed `id="rubric-toggle"` repeats when a page renders more than one rubric.
- The toggle handles Space on `keypress` without cancelling it, so Space can also scroll the page.

## Not Covered / Manual

- Confirm long descriptors are read in a meaningful order.
- Confirm score point relationships are clear without relying on layout alone.
