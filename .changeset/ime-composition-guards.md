---
"@pie-element/shared-utils": patch
"@pie-element/drawing-response": patch
"@pie-element/fraction-model": patch
"@pie-element/math-inline": patch
"@pie-element/multiple-choice": patch
---

Keys that commit or steer an IME composition no longer trigger element shortcuts: Enter and Escape in a drawing-response text box, Escape in math-inline, the arrow keys on fraction-model's count fields, and multiple choice's number and letter shortcuts. Safari's committing Enter, which reports `keyCode` 229 with `isComposing` false, is covered. `@pie-element/shared-utils` exports the check as `isComposingKeyEvent`.
