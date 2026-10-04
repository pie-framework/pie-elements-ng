# Inline Dropdown A11y Coverage

## Intended Use

Students choose responses from dropdown blanks embedded in text.

## Automated Coverage

- `inline-dropdown-combobox-labels`: embedded combobox labels, keyboard reachability, expanded listbox semantics, and input assistance.
- `inline-dropdown-evaluate-feedback`: evaluate-mode feedback, preserved combobox labels, and status semantics.

Each combobox exposes `aria-expanded` open and closed, and while open its `aria-controls` names the listbox ([PIE-1163](https://illuminate.atlassian.net/browse/PIE-1163)). The scenarios scan closed comboboxes only; the open state is covered by the mask-markup unit tests.

## Open Gaps

- The combobox, listbox and label ids derive from the response number alone, so two inline-dropdown items on one page duplicate them and `aria-labelledby` and `aria-controls` resolve into the first item.

## Not Covered / Manual

- Confirm screen readers announce the surrounding sentence context for each blank.
- Confirm option navigation, open/close behavior, and selected state are reliable across browsers.
