# Graphing A11y Coverage

## Intended Use

Students construct or inspect graphs using graphing tools, coordinate controls, and visual graph output.

Each toolbar tool is one button named by the tool. In the authoring correct-response toolbar, where tools can be reordered, the button is also a dnd-kit draggable: Space or Enter picks it up, the arrow keys move it, and Space or Enter drops it.

## Automated Coverage

- `graph-toolbar-keyboard-reach`: graphing tools, coordinate controls, labels, keyboard reachability, and target size.
- `parabola-graph-alternatives`: graph alternatives, tool labels, and spatial interaction affordances for a parabola sample.

Each mark label input is named by the point it labels, "Label at (2, 3)", and in evaluate mode the correct label beside a wrong one is "Correct label at (2, 3)" ([PIE-1155](https://illuminate.atlassian.net/browse/PIE-1155)).

The coordinates shown on hovering a point are read-only text ([PIE-1183](https://illuminate.atlassian.net/browse/PIE-1183)).

## Not Covered / Manual

- Confirm graph construction can be completed without pointer input.
- The graph is named by its title, or as a coordinate graph when it has none, and described by its axis ranges and the types of the objects plotted ([PIE-1156](https://illuminate.atlassian.net/browse/PIE-1156)). Coordinates are not in the description, and a description of what the graph shows needs authored text and is postponed.
- Confirm plotted objects, axes, and coordinate changes are available in a text-equivalent form.
- Selecting a tool in the reorderable authoring toolbar takes a pointer: Space and Enter pick the tool up for reordering.
