# Likert A11y Coverage

## Intended Use

Students select a response on a labelled scale, typically from disagreement to agreement or another ordered set.

## Automated Coverage

- `likert-scale-radio-group`: scale labels, radio values, logical order, and keyboard selection.
- `likert-evaluate-feedback`: evaluate-mode correctness or feedback while preserving scale semantics.

Each radio takes its accessible name from its visible choice label ([PIE-1158](https://illuminate.atlassian.net/browse/PIE-1158)).

## Open Gaps

- The radios share no `name` and sit in no `radiogroup`, so each is its own tab stop, arrow keys do not move the selection, and the prompt does not label the scale. The `group-label` check passes because no group is rendered.

## Not Covered / Manual

- Confirm endpoints and intermediate values are announced clearly.
- Confirm selected state and feedback do not rely on color or visual position alone.
