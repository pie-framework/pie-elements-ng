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

Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
