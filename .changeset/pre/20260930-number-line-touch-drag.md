---
'@pie-element/number-line': patch
---

Fix number-line points and lines not being draggable by touch by setting `touch-action: none` on the number-line svg so dnd-kit drags start on touch (PIE-1104).
