---
"@pie-element/placement-ordering": patch
---

Stop reading "object:" before each unsorted object, and "Sort position [x]" before each sorted one while the item is being answered (PIE-835). Both sit outside the tile's button, and the button's own label already gives the same information, so the spec drops rows 3 and 6. A view-only or evaluated item has no tile labels, so there each sorted object still reads its sort position first. The `unsortedObjectPrefix` catalog key is removed from every locale.
