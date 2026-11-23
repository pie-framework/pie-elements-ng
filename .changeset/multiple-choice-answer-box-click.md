---
"@pie-element/multiple-choice": patch
---

A click anywhere in an answer choice's box selects it, as in LSY, not only a click on its radio button or text (PIE-1549). The padding around the label and the space beside it took no click, which showed most in horizontal choices. Clicks on controls in the box, such as the answer eliminator's toggle, keep their own behaviour, disabled choices ignore them, and keyboard selection is unchanged.
