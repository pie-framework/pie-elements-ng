---
'@pie-lib/math-input-mathlive': patch
---

Keep the math field out of LaTeX mode: typing `\` or pressing Escape no longer switches to it, and `\` typed with a keypad button focused is not sent to the field. Option characters on macOS (π, ≠) typed with a keypad button focused are now sent to the field.
