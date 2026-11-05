---
"@pie-element/multi-trait-rubric": patch
---

Fix the editor toolbar being cut off for the right-hand columns, including when the last column is only partly visible. The toolbar is nudged just far enough to stay inside the scrolling area, the score label boxes no longer grow to the toolbar's width, the header row is tall enough for the toolbar, and the columns fill the scale's full width instead of stopping 32px short of the header's right edge.
