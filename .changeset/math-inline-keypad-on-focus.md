---
"@pie-element/math-inline": patch
---

The math keypad opens when the learner focuses the answer field, by Tab or a click, as in math-templated. It follows the caret between answer blocks and closes on Escape. ArrowDown moves focus into the open keypad, and reopens it after Escape. `focusFirstInput()`, and with it the item player's `focus()`, still leaves the keypad closed, as the element contract's focus hook requires (WCAG 3.2.1) (PIE-1512).
