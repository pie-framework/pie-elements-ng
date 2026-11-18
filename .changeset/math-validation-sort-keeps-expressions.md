---
"@pie-framework/math-validation": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

`@pie-framework/math-validation` no longer accepts some wrong answers that sorting made identical to the key (PIE-1541), in symbolic mode and in literal mode with `ignoreOrder`. A product with a fraction or a negative power among its factors kept only the single symbols and numbers beside it, so `(x+2)x^{-1}` matched `(x+1)x^{-1}`. A nested negation, quotient or power was merged into its parent, so `-(-x)` matched `-x`, `\frac{\frac{b}{c}}{a}` matched `\frac{a}{\frac{b}{c}}` and `2^{3^{x}}` matched `(3^{x})^{2}`. 1.4.3 has the same fault, so re-scoring can turn answers like these from correct to incorrect.

In literal mode with `ignoreOrder`, a product of several fractions now matches the same fractions in another order, as `\frac{c}{d}\cdot\frac{a}{b}` matches `\frac{a}{b}\cdot\frac{c}{d}`. 1.4.3 rejected these, so re-scoring can also turn answers like this from incorrect to correct. Sorting only reorders them: a numerator or denominator moved to another fraction still doesn't match, so neither `\frac{4}{3}\cdot\frac{2}{5}` nor `\frac{2\cdot4}{3\cdot5}` matches `\frac{2}{3}\cdot\frac{4}{5}`. A single fraction still takes the factors beside it into its numerator, as in 1.4.3, so `2\cdot\frac{4}{5}` matches `\frac{2\cdot4}{5}`.
