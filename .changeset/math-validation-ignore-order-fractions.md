---
"@pie-framework/math-validation": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

In literal mode with `ignoreOrder`, a product of several fractions now matches the same fractions in another order, also with the factors inside them reordered, as `\frac{c}{d}\cdot\frac{bz}{2}` matches `\frac{zb}{2}\cdot\frac{c}{d}` (PIE-1541). Terms and factors are sorted inside out, so the sums of a product may be reordered inside too, as `(b+z)(c+w)` matches `(z+b)(w+c)`. 1.4.3 rejected these, so re-scoring can also turn answers like this from incorrect to correct. Sorting only reorders them: a numerator or denominator moved to another fraction still doesn't match, so neither `\frac{4}{3}\cdot\frac{2}{5}` nor `\frac{2\cdot4}{3\cdot5}` matches `\frac{2}{3}\cdot\frac{4}{5}`. A single fraction still takes the factors beside it into its numerator, as in 1.4.3, so `2\cdot\frac{4}{5}` matches `\frac{2\cdot4}{5}`.
