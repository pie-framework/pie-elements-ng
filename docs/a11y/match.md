# Match A11y Coverage

## Intended Use

Students match row prompts to answers using per-row controls.

## Automated Coverage

- `matching-row-choice-labels`: row headers, answer controls, labels, table-like structure, and keyboard reachability.
- `match-evaluate-feedback`: evaluate-mode row feedback, answer control names, and status-message semantics.

Each radio or checkbox is named by its row title and column header, and each row group by its row title ([PIE-1159](https://illuminate.atlassian.net/browse/PIE-1159)). The scenarios render radio mode only; checkbox mode is covered by the package's unit tests.

In radio mode each row is a `radiogroup` named by its row title, and its radios share a name unique to that row and item on the page, so a row is one tab stop and the arrow keys move and record the selection within it ([PIE-1181](https://illuminate.atlassian.net/browse/PIE-1181)).

## Not Covered / Manual

- Confirm a screen reader announces the row title on entering a row.
- Confirm prompt and answer context remains clear when navigating one control at a time.
- Confirm feedback identifies the row or association being corrected.
