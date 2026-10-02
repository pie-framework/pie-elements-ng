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
  "@pie-element/multi-trait-rubric": patch
  "@pie-element/multiple-choice": patch
  "@pie-element/number-line": patch
  "@pie-element/passage": patch
  "@pie-element/placement-ordering": patch
  "@pie-element/rubric": patch
  "@pie-element/select-text": patch
---

Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
