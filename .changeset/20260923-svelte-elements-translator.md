---
"@pie-element/mc-populated-blank": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.
