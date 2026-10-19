---
"@pie-element/select-text": minor
---

When the `selectionCount` setting is off, the author view now keeps `maxSelections` equal to the number of selections in the correct answer. It decreases when a correct selection is removed and goes to 0 when the correct answer is cleared. Saved models with a stale value are corrected when opened in the editor.
