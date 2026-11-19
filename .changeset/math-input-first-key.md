---
"@pie-lib/math-input-mathlive": patch
---

Keep the first keypad key pressed in a math field. A re-render right after the key landed wrote the field's starting value back over it, so in the editor's math toolbar the first tap after "Insert math" was often lost (PIE-1509).
