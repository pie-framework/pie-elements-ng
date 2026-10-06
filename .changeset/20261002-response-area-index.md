---
"@pie-lib/editable-html-tip-tap": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/inline-dropdown": patch
"@pie-element/math-templated": patch
---

A response area inserted while authoring an explicit constructed response, drag-in-the-blank, inline dropdown or math templated item takes the next index after the highest one in its own editor. An editor opened after another of the same type on the page, such as the next item in an authoring app, carried on the first editor's count and could give a new area an index already in use, so two response areas shared one set of choices.
