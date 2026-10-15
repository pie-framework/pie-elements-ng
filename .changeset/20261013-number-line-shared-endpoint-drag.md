---
"@pie-element/number-line": patch
---

Dragging a point on the number line moves only that point. Before, the endpoints of lines and rays at the same value on different rows all moved together, because they shared one drag id.
