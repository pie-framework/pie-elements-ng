# Graphing Solution Set A11y Coverage

## Intended Use

Students or instructors inspect graphing solution regions, shaded inequalities, and correctness feedback.

## Automated Coverage

- `solution-region-semantics`: shaded regions, graph controls, axis labels, non-text contrast, and graphic alternatives.
- `solution-set-evaluate-feedback`: evaluate-mode feedback, status semantics, and preserved graph alternatives.

A line end label input is named by the point it labels, "Label at (2, 3)" ([PIE-1155](https://illuminate.atlassian.net/browse/PIE-1155)). The scenarios render no labels; the package's unit tests cover the name.

Labels are disabled outside label mode, which this element never turns on, and a polygon's label renders, named in the item language. The coordinates shown on hovering a point are read-only text ([PIE-1183](https://illuminate.atlassian.net/browse/PIE-1183)).

Each line-selection radio in the tool menu takes its accessible name from the visible line name beside it ([PIE-1161](https://illuminate.atlassian.net/browse/PIE-1161)).

## Not Covered / Manual

- Confirm solution regions are understandable without relying only on color, shading, or spatial position.
- Confirm boundary inclusion and inequality direction are exposed textually.
- The graph is named by its title, or as a coordinate graph when it has none, and described by its axis ranges, its lines and its shaded solution regions ([PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156)). Boundary styles and inequality direction are not in the description, and a description of the solution needs authored text and is postponed.
