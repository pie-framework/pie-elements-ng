---
"@pie-lib/math-input-mathlive": patch
---

Keep a steady, visible cursor in the math entry area, and in a math answer block, while a keypad button has keyboard focus, and remove it when focus moves anywhere else. Tab and Shift+Tab in the math entry area now move focus on straight away and leave the cursor where it was, instead of first moving it through the expression to its end; Tab still accepts a suggestion while a latex command is typed.
