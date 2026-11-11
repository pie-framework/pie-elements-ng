---
"@pie-framework/math-validation": patch
---

Symbolic mode compares answers made only of numbers and arithmetic exactly, however many digits they have, so `123456789.00001` no longer matches `123456789` and `12345678901234567` no longer matches `12345678901234568` (PIE-905, PIE-1418). The small tolerance for floating-point noise now applies only to answers with a function, π, an angle or a variable, so `\sin(30°)` still matches `0.5`.
