---
"@pie-element/categorize": patch
"@pie-element/charting": patch
"@pie-element/complex-rubric": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/drawing-response": patch
"@pie-element/ebsr": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/extended-text-entry": patch
"@pie-element/fraction-model": patch
"@pie-element/graphing": patch
"@pie-element/graphing-solution-set": patch
"@pie-element/hotspot": patch
"@pie-element/image-cloze-association": patch
"@pie-element/inline-dropdown": patch
"@pie-element/likert": patch
"@pie-element/match": patch
"@pie-element/match-list": patch
"@pie-element/matrix": patch
"@pie-element/multi-trait-rubric": patch
"@pie-element/multiple-choice": patch
"@pie-element/number-line": patch
"@pie-element/passage": patch
"@pie-element/placement-ordering": patch
"@pie-element/rubric": patch
"@pie-element/select-text": patch
"@pie-element/shared-lodash": patch
"@pie-lib/categorize": patch
"@pie-lib/charting": patch
"@pie-lib/config-ui": patch
"@pie-lib/controller-utils": patch
"@pie-lib/correct-answer-toggle": patch
"@pie-lib/drag": patch
"@pie-lib/editable-html-tip-tap": patch
"@pie-lib/graphing": patch
"@pie-lib/graphing-solution-set": patch
"@pie-lib/graphing-utils": patch
"@pie-lib/mask-markup": patch
"@pie-lib/math-input": patch
"@pie-lib/math-toolbar": patch
"@pie-lib/plot": patch
"@pie-lib/render-ui": patch
"@pie-lib/rubric": patch
"@pie-lib/text-select": patch
"@pie-lib/tools": patch
"@pie-lib/translator": patch
---

Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
