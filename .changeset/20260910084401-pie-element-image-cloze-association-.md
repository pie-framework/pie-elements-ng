---
  "@pie-element/image-cloze-association": patch
  "@pie-element/match-list": patch
  "@pie-element/placement-ordering": patch
  "@pie-lib/mask-markup": patch
---

Fix keyboard placement: center the dragged item on its target instead of top-aligning it there, which let the item bleed into a neighbouring target and register the wrong drop; and correct the placement-ordering Tab cycle (PIE-803, PIE-963, PIE-964)
