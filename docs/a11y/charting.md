# Charting A11y Coverage

## Intended Use

Students inspect or edit chart data in bar, line, and histogram forms. The element combines form-like controls with non-text chart graphics.

## Automated Coverage

- `editable-bar-chart-controls`: labelled chart controls, keyboard reachability, target size, non-text contrast.
- `line-chart-add-points`: add-point workflow, visible controls, and chart affordances.
- `histogram-non-text-alternatives`: histogram graphic alternatives and color-independent chart meaning.

## Not Covered / Manual

- Confirm chart values, trends, and bin meanings are available without relying on sight or color alone.
- Confirm pointer-based chart editing has a complete keyboard alternative.
- The chart is named by its title, or by its type when it has none, and described by its type, categories and value range ([PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156)). A description of what the data shows needs authored text and is postponed.
