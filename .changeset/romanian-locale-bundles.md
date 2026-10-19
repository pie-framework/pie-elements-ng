---
"@pie-lib/render-ui": patch
"@pie-lib/correct-answer-toggle": patch
"@pie-element/multiple-choice": patch
---

Adds a Romanian (`ro`) locale bundle to each package, keeping the three in
step with pie-players, whose generated tier gained Romanian the same day. One
chunk per locale in the browser build, inlined by webpack consumers, absent
from IIFE. Register and terminology follow pie-players' `briefs/ro.md`:
imperative on controls (`Afișează răspunsul corect`), comma-below diacritics,
and all three CLDR plural forms — `other` takes `de` before the noun (`Sunt
permise doar 20 de răspunsuri.`). Status `generated`, unreviewed.
