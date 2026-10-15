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
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/matrix": patch
"@pie-element/mc-populated-blank": patch
"@pie-element/multi-trait-rubric": patch
"@pie-element/multiple-choice": patch
"@pie-element/number-line": patch
"@pie-element/passage": patch
"@pie-element/placement-ordering": patch
"@pie-element/rubric": patch
"@pie-element/select-text": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
"@pie-element/video-stimulus": patch
---

Every `./browser/*` module exports `piePackage`, a frozen `{ name, version }` naming the package it was built from, so a host that bundles the module registers it with `registerPreloadedElements` without restating the package and version it installed.
