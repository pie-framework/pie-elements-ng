# Explicit Constructed Response A11y Coverage

## Intended Use

Students enter constructed responses into fields embedded inside rich prompt content. Evaluate mode shows field-level feedback.

## Automated Coverage

- `embedded-response-fields`: embedded field labels, focus order, and input assistance metadata.
- `constructed-response-evaluate-errors`: evaluate-mode feedback, preserved labels, and status-message semantics.

Each response field is named by its position in reading order, such as "Response 2 of 3", in the item's language ([PIE-1154](https://illuminate.atlassian.net/browse/PIE-1154)). The name does not carry the surrounding sentence.

## Not Covered / Manual

- Confirm each blank remains understandable in the surrounding sentence or rich text.
- Confirm error messages are specific enough for remediation and are associated with the affected field.
