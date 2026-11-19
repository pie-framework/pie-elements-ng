---
  "@pie-lib/math-input-mathlive": patch
---

Exports `deepActiveElement`, which returns the focused element, looking through shadow roots. math-inline's `focusFirstInput()` uses it (PIE-1503).

pr: 670
