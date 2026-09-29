---
'@pie-element/shared-controller-utils': patch
'@pie-element/categorize': patch
'@pie-element/drag-in-the-blank': patch
'@pie-element/match': patch
'@pie-element/multiple-choice': patch
---

A session without an `id` or `element` keeps its shuffled choice order across renders. The order is saved through `updateSession`, which receives both as `undefined`, as in pie-elements.
