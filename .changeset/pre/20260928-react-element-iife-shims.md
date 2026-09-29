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
"@pie-element/graphing-solution-set": patch
"@pie-element/graphing": patch
"@pie-element/hotspot": patch
"@pie-element/image-cloze-association": patch
"@pie-element/inline-dropdown": patch
"@pie-element/likert": patch
"@pie-element/match-list": patch
"@pie-element/match": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/matrix": patch
"@pie-element/multi-trait-rubric": patch
"@pie-element/multiple-choice": patch
"@pie-element/number-line": patch
"@pie-element/passage": patch
"@pie-element/placement-ordering": patch
"@pie-element/rubric": patch
"@pie-element/select-text": patch
---

Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
