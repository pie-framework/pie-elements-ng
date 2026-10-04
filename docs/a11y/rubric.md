# Rubric A11y Coverage

## Intended Use

Instructors review rubric score levels and descriptors for scoring or reporting.

## Automated Coverage

- `rubric-score-structure`: score levels, descriptors, labels, headings, and programmatic structure.
- `rubric-descriptor-reading-order`: descriptor reading order, group labels, and table-like relationships.

The Show Rubric toggle is at least 24px tall ([PIE-1169](https://illuminate.atlassian.net/browse/PIE-1169)), and its id is unique per rubric on the page ([PIE-1188](https://illuminate.atlassian.net/browse/PIE-1188)).

The toggle is a native button following the APG disclosure pattern: `aria-expanded` gives its state, `aria-controls` names the rubric content, and Space toggles it without scrolling the page. The visually hidden "Rubric" `h2` keeps the rubric in heading navigation ([PIE-1185](https://illuminate.atlassian.net/browse/PIE-1185)).

## Not Covered / Manual

- Confirm long descriptors are read in a meaningful order.
- Confirm score point relationships are clear without relying on layout alone.
