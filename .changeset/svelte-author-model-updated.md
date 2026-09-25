---
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
"@pie-element/mc-populated-blank": patch
---

Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
