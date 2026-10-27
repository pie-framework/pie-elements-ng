---
"@pie-element/shared-utils": patch
"@pie-lib/editable-html-tip-tap": patch
---

In right-to-left fields the arrow key that steps back over a math node is ArrowRight, the math toolbar opens from the right edge of the math node, and blockquotes, drag-in-the-blank choices, inline dropdowns and math-templated response boxes lay out from the inline start.

`@pie-element/shared-utils` adds `inlineSideOfArrow` and `isRightToLeft`, which map a horizontal arrow key to the inline start or end from the element's computed direction when the key is pressed.
