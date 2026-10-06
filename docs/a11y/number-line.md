# Number Line A11y Coverage

## Intended Use

Students inspect or manipulate points, rays, intervals, or values on a number line.

## Automated Coverage

- `number-line-point-controls`: graph controls, tick labels, point interactions, labels, and keyboard reachability.
- `number-line-inequality-rays`: inequality rays, graph alternatives, tick labels, and keyboard-reachable controls.

The graph is a group named by its range and its tick spacing as drawn, so its draggable points stay exposed. Its description lists each plotted element in the item language: a point's position, a line's two endpoints, a ray's start and direction, and whether each endpoint is open or closed ([PIE-1172](https://illuminate.atlassian.net/browse/PIE-1172)).

## Not Covered / Manual

- Confirm plotted values, endpoint inclusion, and ray direction are exposed textually.
- Confirm point/ray manipulation is possible without pointer input.
- Confirm the evaluate feedback panel and the max-points warning keep text at 4.5:1 in light and dark; no scenario renders either.
