# Matrix A11y Coverage

## Intended Use

Students select answers in a grid where each cell depends on row and column labels.

## Automated Coverage

- `matrix-row-column-relationships`: row labels, column labels, selectable cells, and table-like structure.
- `matrix-evaluate-feedback`: evaluate-mode feedback while preserving row/column context and group labels.

Each radio is named by its row label and column label ([PIE-1160](https://illuminate.atlassian.net/browse/PIE-1160)).

## Open Gaps

- A row's radios share no `name` and sit in no `radiogroup`, so each is its own tab stop and arrow keys do not move the selection within the row.

## Not Covered / Manual

- Confirm every selectable cell announces both row and column context.
- Confirm feedback identifies the affected row/column without relying on visual position.
