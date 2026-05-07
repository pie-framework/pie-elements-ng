# Matrix A11y Coverage

## Intended Use

Students select answers in a grid where each cell depends on row and column labels.

## Automated Coverage

- `matrix-row-column-relationships`: row labels, column labels, selectable cells, and table-like structure.
- `matrix-evaluate-feedback`: evaluate-mode feedback while preserving row/column context and group labels.

## Not Covered / Manual

- Confirm every selectable cell announces both row and column context.
- Confirm feedback identifies the affected row/column without relying on visual position.
