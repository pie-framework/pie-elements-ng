# Drag In The Blank A11y Coverage

## Intended Use

Students place draggable choices into inline blanks or target areas, sometimes alongside images or math content.

## Automated Coverage

- `blank-drop-keyboard-alternative`: blank targets, draggable choice labels, keyboard reachability, and target size.
- `image-blank-alternatives`: image alternatives, labelled choices, and keyboard-reachable image-based blanks.

## Not Covered / Manual

- Confirm the complete blank-filling workflow works without drag gestures.
- Confirm placement changes are announced through clear live feedback.
- Each blank's named target takes its chip's box, at least 90×32 when empty (WCAG 2.5.8).
- Image choices whose image has an empty `alt` have no accessible name; `image-blank-alternatives` reports them under `interactive-control-name`.
