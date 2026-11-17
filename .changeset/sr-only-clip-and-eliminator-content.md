---
"@pie-element/multiple-choice": patch
"@pie-element/ebsr": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/extended-text-entry": patch
"@pie-element/inline-dropdown": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-lib/mask-markup": patch
---

Screen-reader-only text is clipped in place, where it was moved 10,000px to the left, which gave right-to-left pages a horizontal scroll that long. Multiple choice, and EBSR through it, supply the answer eliminator each choice's row as its container and the label text as its content, so the toggle ends the row and the eliminator marks the text, leaving the radio button or checkbox untouched.
