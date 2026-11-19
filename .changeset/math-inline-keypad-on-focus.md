---
"@pie-element/math-inline": patch
---

The math keypad opens when the learner focuses the answer field, by Tab or a click, as in math-templated. It follows the caret between answer blocks and closes on Escape. ArrowDown moves focus into the open keypad, and reopens it after Escape. Escape in the keypad now returns focus to the answer field, where it used to drop focus. The keypad instructions read to screen-reader users now say to use the down arrow key to move into the keypad and the tab key to move between its buttons, in every locale. `focusFirstInput()`, and with it the item player's `focus()`, still leaves the keypad closed, as the element contract's focus hook requires (WCAG 3.2.1) (PIE-1512).
