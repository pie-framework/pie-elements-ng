# Number Line A11y Coverage

## Intended Use

Students inspect or manipulate points, rays, intervals, or values on a number line.

## Automated Coverage

- `number-line-point-controls`: graph controls, tick labels, point interactions, labels, and keyboard reachability.
- `number-line-inequality-rays`: inequality rays, graph alternatives, tick labels, and keyboard-reachable controls.

## Not Covered / Manual

- Confirm plotted values, endpoint inclusion, and ray direction are exposed textually.
- Confirm point/ray manipulation is possible without pointer input.
- Confirm the evaluate feedback panel and the max-points warning keep text at 4.5:1 in light and dark; no scenario renders either.
