---
"@pie-lib/mask-markup": patch
"@pie-element/drag-in-the-blank": patch
---

Response areas written with nothing between them, such as drop zones that spell a word one letter each, sit close together, as in Learnosity (PIE-1558). Every response area took a 0.75em spacer on each side, so two that touched in the markup stood 1.5em apart. They are now 0.25em apart, which keeps their borders distinct, and a run of them is still spaced from the text around it. Response areas the markup separates with a space keep their spacing.
