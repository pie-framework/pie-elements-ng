---
"@pie-element/mc-populated-blank": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
"@pie-element/element-player": patch
---

Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.
