---
'@pie-lib/math-input-mathlive': patch
'@pie-lib/math-toolbar': patch
---

Turn off MathLive's autocomplete for a latex command typed after `\`, in the math entry area and in answer blocks: no suggestion popover, and no completion shown inline. With a math keypad button focused, a latex command typed after `\` now goes to the field, and Space, Enter or Escape finishes it there instead of pressing the button. Option characters on macOS (π, ≠) typed with a keypad button focused are now sent to the field. In the math toolbar, typing with the "+ Response Area" button focused, or with a keypad button reached through it, now goes to the editor, as it does from the keypad.
