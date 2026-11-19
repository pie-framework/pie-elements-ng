---
"@pie-element/multiple-choice": patch
---

Keep math out of answer-choice names for every student (PIE-1244). A choice holding math or a table is named by its key and a note, "A. Pick the answer below", and its formula stays in the choice as MathML, which the screen reader reads and explores and a braille display shows as math. A choice with no key is named by its position, "2. Pick the answer below". The comparison switches, the `mathOutsideNames` accessibility support and the `mathNames=outside` URL parameter, are removed.
