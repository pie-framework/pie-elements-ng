---
"@pie-element/categorize": minor
"@pie-element/charting": minor
"@pie-element/complex-rubric": minor
"@pie-element/drag-in-the-blank": minor
"@pie-element/drawing-response": minor
"@pie-element/ebsr": minor
"@pie-element/explicit-constructed-response": minor
"@pie-element/extended-text-entry": minor
"@pie-element/fraction-model": minor
"@pie-element/graphing": minor
"@pie-element/graphing-solution-set": minor
"@pie-element/hotspot": minor
"@pie-element/image-cloze-association": minor
"@pie-element/inline-dropdown": minor
"@pie-element/likert": minor
"@pie-element/match": minor
"@pie-element/match-list": minor
"@pie-element/math-inline": minor
"@pie-element/math-templated": minor
"@pie-element/matrix": minor
"@pie-element/mc-populated-blank": minor
"@pie-element/multi-trait-rubric": minor
"@pie-element/multiple-choice": minor
"@pie-element/number-line": minor
"@pie-element/passage": minor
"@pie-element/placement-ordering": minor
"@pie-element/rubric": minor
"@pie-element/select-text": minor
"@pie-element/simple-cloze": minor
"@pie-element/venn-classification": minor
"@pie-element/video-stimulus": minor
---

Every `./browser/*` module exports `piePackage`, a frozen `{ name, version }` naming the package it was built from, so a host that bundles the module registers it with `registerPreloadedElements` without restating the package and version it installed.
