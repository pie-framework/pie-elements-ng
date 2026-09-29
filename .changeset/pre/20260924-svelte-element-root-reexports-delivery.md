---
'@pie-element/mc-populated-blank': patch
'@pie-element/simple-cloze': patch
'@pie-element/venn-classification': patch
---

The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.
