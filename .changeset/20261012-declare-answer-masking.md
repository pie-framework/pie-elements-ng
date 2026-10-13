---
"@pie-element/multiple-choice": patch
"@pie-element/ebsr": patch
"@pie-element/select-text": patch
"@pie-lib/text-select": patch
---

Multiple choice, EBSR and select-text declare the AfA PNP 3.0 `answer-masking` support on their class (`static pieSupports`) and supply their choices through `pieSupportTargets('answer-masking')`, so a PIE toolkit offers the answer eliminator from the declaration. An eliminated choice cannot be selected until it is restored. EBSR choice ids carry their part, `a-` or `b-`; select-text supplies its selectable tokens, by their text offsets. `TokenSelect` takes an `eliminated` flag per token, which leaves the token unavailable, and wraps each token in a span carrying its offsets.
