# Image Cloze Association A11y Coverage

## Intended Use

Students associate draggable or selectable responses with image-based targets.

## Automated Coverage

- `image-drop-target-alternatives`: image alternatives, named drop targets, response labels, and keyboard reachability.

## Not Covered / Manual

- Confirm image targets have text alternatives that support the task without revealing answers. The background image's `alt` is generated from the number of response areas ("Image with 2 response areas"), and an answer choice whose content has no text alternative, such as an image with an empty `alt`, is named by its position ("Answer choice 1 of 4"). Neither says what the image shows; authored descriptions are postponed.
- Confirm the association workflow is possible without drag gestures.
- Confirm placement feedback is announced clearly.
