# Drawing Response A11y Coverage

## Intended Use

Students draw or annotate a response on a canvas using toolbar controls. Evaluate mode presents feedback for the submitted drawing.

## Automated Coverage

- `drawing-toolbar-controls`: toolbar control names, keyboard reachability, target size, and media/graphic alternatives.
- `drawing-evaluate-feedback-status`: evaluate-mode feedback, status semantics, and canvas alternative signals.

The fill and outline color selects are named by their visible labels. The drawing canvas is an image named in the item language as a drawing area, saying whether it sits over a background image; the image content is not described, since only an author knows it ([PIE-1162](https://illuminate.atlassian.net/browse/PIE-1162)).

## Not Covered / Manual

- Confirm the drawing task has an equivalent non-pointer response path where required.
- Confirm canvas content and scored drawing feedback are meaningful to screen-reader users.
