---
"@pie-element/categorize": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/extended-text-entry": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/multiple-choice": patch
"@pie-element/passage": patch
"@pie-element/rubric": patch
"@pie-element/select-text": patch
---

Removing an element no longer leaves it holding an unmounted React root, so a
later model or session write, or reinserting the element, no longer throws React
error #409. A render still pending from before removal is cancelled, and a
reinserted element renders again.
