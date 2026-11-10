---
"@pie-framework/math-validation": patch
---

Reads `{,}` and `\,` between digit groups as thousands separators, `\dfrac` and `\tfrac` as fractions, and `2\ \frac{1}{2}` as a mixed number; `1,0000` is no longer read as `1000·0`, nor `00` as not a number. `compareNumbersByValue` compares exact values, beyond double precision.
