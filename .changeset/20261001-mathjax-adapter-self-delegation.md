---
"@pie-element/shared-math-rendering-mathjax": patch
"@pie-element/categorize": patch
"@pie-element/charting": patch
"@pie-element/complex-rubric": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/drawing-response": patch
"@pie-element/ebsr": patch
"@pie-element/element-player": patch
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
"@pie-element/multi-trait-rubric": patch
"@pie-element/multiple-choice": patch
"@pie-element/number-line": patch
"@pie-element/passage": patch
"@pie-element/placement-ordering": patch
"@pie-element/rubric": patch
"@pie-element/select-text": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.
