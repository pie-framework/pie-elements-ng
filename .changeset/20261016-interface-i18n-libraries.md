---
"@pie-lib/render-ui": patch
"@pie-lib/correct-answer-toggle": patch
---

These libraries render their labels from their own catalogs through `@pie-element/shared-i18n` in place of `@pie-lib/translator`, in the language passed as before. Under an element that has not loaded that language, they render one English frame first. An element's IIFE ships their English only; its host serves another locale through `registerMessages`.
