---
'@pie-element/element-player': patch
---

In delivery, the player hands an element its session only after its model, so elements that read the model in their session setter, such as `graphing-solution-set`, mount under IIFE, where the model is computed once the bundle's controller arrives. Until then it ignores the sessions an element reports, so an element's default session cannot replace a restored one.
