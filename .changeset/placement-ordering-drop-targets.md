---
"@pie-element/placement-ordering": patch
---

With a placement area, a choice dragged from the source column is now received by the response area it overlaps, however slightly, rather than by the occupied source slot beside it, which it could never be dropped on. A choice dragged from a response area is received by whichever it overlaps most of the other response areas and its own source slot, the only source slot it can return to (PIE-1102).
