---
"@pie-element/shared-math-rendering-mathjax": patch
---

MathJax 4 renders MathML as the legacy renderer did: vertical arithmetic and long division (`mstack`, `mlongdiv`) typeset as tables where they showed "Math input error", prefixed MathML such as `<mml:math>` typesets, and inline MathML fractions, sums and limits keep display size. Displayed math wider than its container breaks across lines, and scrolls inside its own container where MathJax did not break it.
