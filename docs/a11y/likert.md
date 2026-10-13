# Likert A11y Coverage

## Intended Use

Students select a response on a labelled scale, typically from disagreement to agreement or another ordered set.

## Automated Coverage

- `likert-scale-radio-group`: scale labels, radio values, logical order, and keyboard selection.
- `likert-evaluate-feedback`: evaluate-mode correctness or feedback while preserving scale semantics.

Each radio takes its accessible name from its visible choice label ([PIE-1158](https://illuminate.atlassian.net/browse/PIE-1158)).

The scale is a `radiogroup` named by the prompt, and its radios share a name unique to the item on the page, so the scale is one tab stop and the arrow keys move and record the selection ([PIE-1181](https://illuminate.atlassian.net/browse/PIE-1181)).

## Open Gaps

- A scale authored without a prompt renders an unnamed `radiogroup`.

## Not Covered / Manual

- Confirm a screen reader announces the prompt on entering the scale.
- Confirm endpoints and intermediate values are announced clearly.
- Confirm selected state and feedback do not rely on color or visual position alone.
