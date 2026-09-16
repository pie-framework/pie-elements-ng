---
'@pie-lib/categorize': major
'@pie-lib/charting': major
'@pie-lib/config-ui': major
'@pie-lib/controller-utils': major
'@pie-lib/correct-answer-toggle': major
'@pie-lib/editable-html-tip-tap': major
'@pie-lib/graphing': major
'@pie-lib/graphing-solution-set': major
'@pie-lib/graphing-utils': major
'@pie-lib/icons': major
'@pie-lib/mask-markup': major
'@pie-lib/math-input': major
'@pie-lib/math-rendering': major
'@pie-lib/math-toolbar': major
'@pie-lib/plot': major
'@pie-lib/rubric': major
'@pie-lib/style-utils': major
'@pie-lib/test-utils': major
'@pie-lib/text-select': major
'@pie-lib/tools': major
'@pie-lib/translator': major
---

Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.
