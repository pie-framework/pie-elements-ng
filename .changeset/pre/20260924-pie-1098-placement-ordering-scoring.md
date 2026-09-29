---
'@pie-element/placement-ordering': patch
'@pie-element/shared-lodash': patch
'@pie-element/cli': patch
---

The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.

`uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.
