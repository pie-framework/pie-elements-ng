# Charting A11y Coverage

## Intended Use

Students inspect or edit chart data in bar, line, and histogram forms. The element combines form-like controls with non-text chart graphics.

## Automated Coverage

- `editable-bar-chart-controls`: labelled chart controls, keyboard reachability, target size, non-text contrast.
- `line-chart-add-points`: add-point workflow, visible controls, and chart affordances.
- `histogram-non-text-alternatives`: histogram graphic alternatives and color-independent chart meaning.

Each category label input is named by its position, "Category 2 label" ([PIE-1155](https://illuminate.atlassian.net/browse/PIE-1155)).

When the longest category label is wider than a bar, every label is rotated 25° from the first render, and the chart reserves room below the axis for how far the rotated labels reach, so they overlap neither each other nor the domain axis title ([PIE-1191](https://illuminate.atlassian.net/browse/PIE-1191)).

## Open Gaps

- A category label in fraction form renders as math in a clickable element in place of the input, which has no name and no keyboard path to editing.
- In authoring, the domain axis label editor covers the lower half of horizontal category labels.

## Not Covered / Manual

- Confirm chart values, trends, and bin meanings are available without relying on sight or color alone.
- Confirm pointer-based chart editing has a complete keyboard alternative.
- The chart is named by its title, or by its type when it has none, and described by its type, categories and value range ([PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156)). A description of what the data shows needs authored text and is postponed.
