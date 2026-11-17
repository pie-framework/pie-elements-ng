---
"@pie-framework/math-validation": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

Symbolic mode no longer takes seconds to minutes to compare high powers and products of sums, such as `(x+1)^{8}` or `(a+b+c+d)^{3}`: past a size limit, `@pie-framework/math-validation` compares the two expressions at sample points instead of multiplying them out (PIE-1532).

Score changes to expect when re-scoring: past that limit, some correct answers that were rejected now match, such as `(x+y)^{2}(x+y)^{3}` for `(x+y)^{5}` and `(x+1)^{7.0}` for `(1+x)^{7}`. The existing fixtures keep their verdicts in both argument orders.
