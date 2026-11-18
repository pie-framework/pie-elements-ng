---
"@pie-framework/math-validation": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

Symbolic mode no longer takes seconds to minutes to compare high powers and products of sums, such as `(x+1)^{8}` or `(a+b+c+d)^{3}`: past a size limit, `@pie-framework/math-validation` compares the two expressions at sample points instead of multiplying them out (PIE-1532).

Score changes to expect when re-scoring: past that limit, some correct answers that were rejected now match, such as `(x+y)^{2}(x+y)^{3}` for `(x+y)^{5}` and `(x+1)^{7.0}` for `(1+x)^{7}`. A wrong answer that differs from the key by less than about 1e-10 of its value now matches too, such as `(x+100)^{6}+1` for `(x+100)^{6}`. With a variable in a denominator, both sides must also be undefined at the same values, so `(x+1)^{5}x^{-1}` matches `\frac{(x+1)^{5}}{x}` while a form with a removable hole, such as `\frac{x^{6}-1}{x-1}(x+1)^{4}`, still does not match `(x^{5}+x^{4}+x^{3}+x^{2}+x+1)(x+1)^{4}` (PIE-1540). A sum under a variable exponent, such as `(x+1)^{y}`, keeps the verdict it gets without multiplying out. The existing fixtures keep their verdicts in both argument orders.
