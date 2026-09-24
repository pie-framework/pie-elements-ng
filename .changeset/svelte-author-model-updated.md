---
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
"@pie-element/mc-populated-blank": patch
---

Author elements dispatch each edit as a bubbling `model.updated` from the element itself, and venn-classification fills missing fields from its controller defaults. The author element's `onChange` property is gone; listen for `model.updated` instead. mc-populated-blank reports browser-ESM authoring unsupported while its author view is a placeholder.
