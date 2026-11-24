---
"@pie-lib/drag": patch
"@pie-lib/mask-markup": patch
"@pie-lib/graphing": patch
"@pie-element/categorize": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/image-cloze-association": patch
"@pie-element/match-list": patch
"@pie-element/placement-ordering": patch
---

Dragged choices drop without animating when the reader's system asks for reduced motion (PIE-1563): every drag overlay takes its drop animation from `motionSafeDropAnimation` in `@pie-lib/drag`. The graphing circle's drawing outline rests at its pulse's peak opacity when the pulse stops.
