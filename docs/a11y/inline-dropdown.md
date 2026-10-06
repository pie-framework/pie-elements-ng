# Inline Dropdown A11y Coverage

## Intended Use

Students choose responses from dropdown blanks embedded in text.

## Automated Coverage

- `inline-dropdown-combobox-labels`: embedded combobox labels, keyboard reachability, expanded listbox semantics, and input assistance.
- `inline-dropdown-evaluate-feedback`: evaluate-mode feedback, preserved combobox labels, and status semantics.

Each combobox exposes `aria-expanded` open and closed, and while open its `aria-controls` names the listbox ([PIE-1163](https://illuminate.atlassian.net/browse/PIE-1163)). The scenarios scan closed comboboxes only; the open state is covered by the mask-markup unit tests.

Each combobox is named by its query followed by its value, "Query 1 Saturn", so the blank stays identified before a choice, after one and in show-correct mode; the listbox is named by the query ([PIE-1179](https://illuminate.atlassian.net/browse/PIE-1179)).

The combobox, listbox, option and label ids are unique per blank instance, so on a page with several inline-dropdown items `aria-labelledby` and `aria-controls` resolve inside their own item ([PIE-1188](https://illuminate.atlassian.net/browse/PIE-1188)).

Keyboard focus draws a 3px `--pie-tertiary` outline on the combobox, and in view mode the selected answer takes `--pie-disabled-text` ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)). The mask-markup unit tests pin both.

## Not Covered / Manual

- Confirm screen readers announce the surrounding sentence context for each blank.
- Confirm option navigation, open/close behavior, and selected state are reliable across browsers.
