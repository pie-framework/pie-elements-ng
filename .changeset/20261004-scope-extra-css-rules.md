---
"@pie-lib/render-ui": patch
"@pie-lib/config-ui": patch
"@pie-element/ebsr": patch
---

An item's authored `extraCSSRules` style only that item: each layout nests them under a class of its own instead of the `extraCSSRules` class every item carries. EBSR's item-level rules now apply when the model arrives after the element connects, and follow model changes.
