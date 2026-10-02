---
  "@pie-lib/graphing": patch
  "@pie-lib/graphing-solution-set": patch
---

Lock the graphing background and disabled mark colors to the palette default instead of letting them follow the host color scheme, so a background mark's stroke, arrowheads and endpoints keep a predictable contrast against the plane. The graph controls and accordion now use the dark background token with a primary-light border. The plot plane itself is still transparent, so this makes the mark color predictable and reviewable rather than WCAG 1.4.11 compliant (PIE-877, PIE-994)
