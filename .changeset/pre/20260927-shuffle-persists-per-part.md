---
'@pie-element/shared-controller-utils': patch
'@pie-element/inline-dropdown': patch
'@pie-element/ebsr': patch
'@pie-element/match-list': patch
---

The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
