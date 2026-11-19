---
"@pie-lib/editable-html-tip-tap": patch
---

With `mmlEditing` on, read saved MathML as the LaTeX it shows. Exponents keep their caret (`x^{2}`, not `x2`); absolute values, braces, matrices, cases and degrees no longer come out as LaTeX MathJax cannot read; arrows stay between what they join instead of over the next symbol; and binomial coefficients, prescripts and function names such as `\sin` and `\log` read as they render.
