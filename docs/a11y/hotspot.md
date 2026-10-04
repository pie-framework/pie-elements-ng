# Hotspot A11y Coverage

## Intended Use

Students select interactive regions on an image or diagram.

## Automated Coverage

- `hotspot-region-names`: hotspot region labels, keyboard reachability, image alternatives, and graphic semantics.

## Not Covered / Manual

- Confirm hotspot labels are descriptive without revealing the correct answer.
- Confirm region position and size are usable for keyboard and touch users.
- Confirm the underlying image has enough alternative context for the task. Its `alt` is generated from the number of hotspots ("Image with 7 hotspots") and does not say what the image shows; an authored description is postponed. The shape canvas is hidden from assistive technology, because the shape buttons expose its regions.
- Evaluate-mode correctness is a canvas icon with a hover tooltip ("Correctly selected", "Should have been selected"); the shape buttons expose their pressed state and no correctness.
