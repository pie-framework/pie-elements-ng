---
"@pie-element/shared-math-rendering-mathjax": patch
---

Each copy of the browser build's MathJax gives its explorer regions stylesheet ids of its own. MathJax ids them by class name, which minifiers rename, so two copies on one page, such as an element's and the item player's, could give different regions one id; with enrichment on, the copy that started second threw as its explorer started and lost its highlighting and speech regions.
