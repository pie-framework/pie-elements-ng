# Explicit Constructed Response A11y Coverage

## Intended Use

Students enter constructed responses into fields embedded inside rich prompt content. Evaluate mode shows field-level feedback.

## Automated Coverage

- `embedded-response-fields`: embedded field labels, focus order, and input assistance metadata.
- `constructed-response-evaluate-errors`: evaluate-mode feedback, preserved labels, and status-message semantics.

Each response field is named by its position in reading order, such as "Response 2 of 3", in the item's language ([PIE-1154](https://illuminate.atlassian.net/browse/PIE-1154)). The name does not carry the surrounding sentence.

Each field's toolbar is a `role="toolbar"` named "Editing tools" in the item's language, and is `inert` while its field lacks focus ([PIE-1180](https://illuminate.atlassian.net/browse/PIE-1180)).

The special-character picker keys draw the [THEMING.md](../THEMING.md) focus chain on keyboard focus ([PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200)).

## Not Covered / Manual

- Confirm each blank remains understandable in the surrounding sentence or rich text.
- Confirm error messages are specific enough for remediation and are associated with the affected field.
