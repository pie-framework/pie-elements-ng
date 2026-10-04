# Hotspot A11y Coverage

## Intended Use

Students select interactive regions on an image or diagram.

## Automated Coverage

- `hotspot-region-names`: hotspot region labels, keyboard reachability, image alternatives, and graphic semantics.

## Not Covered / Manual

- Confirm hotspot labels are descriptive without revealing the correct answer.
- Confirm region position and size are usable for keyboard and touch users.
- Confirm the underlying image has enough alternative context for the task. Its `alt` is generated from the number of hotspots ("Image with 7 hotspots") and does not say what the image shows; an authored description is postponed. The shape canvas is hidden from assistive technology, because the shape buttons expose its regions.
- Evaluate-mode correctness is a canvas icon with a hover tooltip, and each shape button carries the tooltip's text ("Correctly selected", "Should not have been selected", "Should have been selected") as its description, in the item language ([PIE-1182](https://illuminate.atlassian.net/browse/PIE-1182)). No scenario scans evaluate mode. The shape buttons leave the tab order once the item is disabled, so the tooltip itself still needs a pointer.
