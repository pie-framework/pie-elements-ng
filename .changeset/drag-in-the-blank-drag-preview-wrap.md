---
"@pie-lib/mask-markup": patch
"@pie-element/drag-in-the-blank": patch
---

A dragged answer choice keeps its size and its text stays on one line while it is dragged (PIE-1550). The preview under the pointer had 8px less room than the choice, so it wrapped onto two lines and stood taller than the choices left in the pool. The choice left in place could wrap too: the drag held it at its size rounded to the nearest pixel, which could round down, and selecting it thickened its border. A selected choice now keeps its 1px border and draws the second pixel of its ring as an outline inside it, so selecting it by click also no longer shifts the choices beside it.

A response area shows a choice held over it in full and centred, where the choice lands once placed. It showed only the first 60px, about one word, at the area's left. A choice too long for the area ends in an ellipsis, since the area keeps its size until the choice is dropped.

The model schema now declares `emptyResponseAreaWidth` and `emptyResponseAreaHeight`, which the element already reads to size its response areas, so content that sets them validates.
