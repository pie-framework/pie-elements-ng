---
'@pie-element/fraction-model': patch
---

A session without `answers`, as a player sends for an untouched item, is unanswered: `outcome()` returns `{ score: 0, empty: true }` and the evaluate-mode `model()` reports `unanswered`, where both threw.
