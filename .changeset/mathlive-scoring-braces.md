---
"@pie-lib/math-input-mathlive": patch
"@pie-element/math-inline": patch
---

Answers typed in the MathLive editor score again as they did in MathQuill (PIE-1514). MathLive writes a single-digit argument without braces (`\frac12`, `2\frac34`, `\sqrt2`), which the math scorer does not parse, so a correct fraction or root scored 0, and an author's key typed with the fraction key matched nothing else. The editor now stores the braced form MathQuill stored (`\frac{1}{2}`). In Advanced Multi, the complete answer is the expression with the answers in place, as MathQuill gave it (`x=2`), no longer wrapped in `\MathQuillMathField[r1]{2}`, which no key matched.
