---
"@pie-element/placement-ordering": patch
---

Stop reading "object:" before each unsorted object and "Sort position [x]" before each sorted one (PIE-835). Both sit outside the tile's button, and the button's own label already gives the same information, so the spec drops rows 3 and 6. The `unsortedObjectPrefix` and `sortedObjectPrefix` catalog keys are removed from every locale.
