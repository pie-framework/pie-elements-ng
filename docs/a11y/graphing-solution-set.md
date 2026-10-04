# Graphing Solution Set A11y Coverage

## Intended Use

Students or instructors inspect graphing solution regions, shaded inequalities, and correctness feedback.

## Automated Coverage

- `solution-region-semantics`: shaded regions, graph controls, axis labels, non-text contrast, and graphic alternatives.
- `solution-set-evaluate-feedback`: evaluate-mode feedback, status semantics, and preserved graph alternatives.

A line end label input is named by the point it labels, "Label at (2, 3)" ([PIE-1155](https://illuminate.atlassian.net/browse/PIE-1155)). The scenarios render no labels; the package's unit tests cover the name.

Each line-selection radio in the tool menu takes its accessible name from the visible line name beside it ([PIE-1161](https://illuminate.atlassian.net/browse/PIE-1161)).

## Open Gaps

- A label input is never disabled, because its styled wrapper drops the `disabled` prop.
- A polygon label is never rendered: the polygon builds its label portal and discards it.

## Not Covered / Manual

- Confirm solution regions are understandable without relying only on color, shading, or spatial position.
- Confirm boundary inclusion and inequality direction are exposed textually.
