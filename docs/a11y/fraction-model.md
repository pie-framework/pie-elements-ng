# Fraction Model A11y Coverage

## Intended Use

Students inspect or manipulate fraction models represented as bars, pies, or configurable visual segments.

## Automated Coverage

- `fraction-segment-controls`: segment controls, focus reachability, non-text contrast, and graphic alternatives.
- `student-configurable-fraction-model`: student configuration controls, labels, target size, and input assistance.
- `improper-fraction-graphic-alternatives`: improper-fraction visuals and media/graphic alternative signals.

Each bar or pie model is an image named from the model: its position among the models, its number of parts and how many are selected, in the item language. The models take the image role in place of recharts' default application role, since parts are selected by pointer only ([PIE-1173](https://illuminate.atlassian.net/browse/PIE-1173)).

## Not Covered / Manual

- Confirm fraction visuals have equivalent text meaning without giving away answers.
- Confirm students can understand selected segments and totals without relying on color alone.
