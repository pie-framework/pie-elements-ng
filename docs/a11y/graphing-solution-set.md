# Graphing Solution Set A11y Coverage

## Intended Use

Students or instructors inspect graphing solution regions, shaded inequalities, and correctness feedback.

## Automated Coverage

- `solution-region-semantics`: shaded regions, graph controls, axis labels, non-text contrast, and graphic alternatives.
- `solution-set-evaluate-feedback`: evaluate-mode feedback, status semantics, and preserved graph alternatives.

## Not Covered / Manual

- Confirm solution regions are understandable without relying only on color, shading, or spatial position.
- Confirm boundary inclusion and inequality direction are exposed textually.
- The graph is named by its title, or as a coordinate graph when it has none, and described by its axis ranges, its lines and its shaded solution regions ([PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156)). Boundary styles and inequality direction are not in the description, and a description of the solution needs authored text and is postponed.
