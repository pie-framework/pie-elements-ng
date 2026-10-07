---
"@pie-lib/mask-markup": patch
"@pie-element/drag-in-the-blank": patch
---

A blank inside a table cell no longer gets the `.75em` spacers before and after it, restoring the cell spacing from PD-4704. In items that lay out one tile per cell, the spacers widened every cell, the table grew past the legacy layout, and the token tray shifted further when a tile was dropped.
