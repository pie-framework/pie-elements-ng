# Matrix A11y Coverage

## Intended Use

Students select answers in a grid where each cell depends on row and column labels.

## Automated Coverage

- `matrix-row-column-relationships`: row labels, column labels, selectable cells, and table-like structure.
- `matrix-evaluate-feedback`: evaluate-mode feedback while preserving row/column context and group labels.

Each radio is named by its row label and column label ([PIE-1160](https://illuminate.atlassian.net/browse/PIE-1160)).

Each row is a `radiogroup` named by its row label, and its radios share a name unique to that row and item on the page, so a row is one tab stop and the arrow keys move and record the selection within it ([PIE-1181](https://illuminate.atlassian.net/browse/PIE-1181)).

## Not Covered / Manual

- Confirm a screen reader announces the row label on entering a row.
- Confirm every selectable cell announces both row and column context.
- Confirm feedback identifies the affected row/column without relying on visual position.
