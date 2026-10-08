---
"@pie-element/mc-populated-blank": patch
---

The blank holds the size of its largest choice from the start, so filling it no longer moves the stem or the choices; inline-sentence items, whose blank had no set size, grew and shifted on every selection. Picture choices show and fit their tiles: in pie-players an SVG with no width or height of its own left its tile empty, and a 150px picture overflowed its 149px tile into a scroll bar. In the r1 variants a picture choice fills the CQT's 150px box in its tile, as it already did in the blank, where a smaller picture showed at its own size (PIE-1247).
