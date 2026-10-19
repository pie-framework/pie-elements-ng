---
"@pie-lib/render-ui": patch
"@pie-lib/correct-answer-toggle": patch
"@pie-element/multiple-choice": patch
---

Adds an `nl-NL` locale bundle to each package: one chunk per locale in the
browser build, inlined by webpack consumers through the eager comment, and
absent from IIFE, like every other shipped locale. The set now covers every
locale pie-players ships (`en-US`, `nl-NL`, `th-TH`), so a player publishing
`nl-NL` renders Dutch chrome inside the item as well as around it. The
catalogs are `generated` (unreviewed) in the manifest; register and terminology
follow pie-players' `briefs/nl-NL.md` and its reviewed Dutch catalog —
impersonal infinitive for labels, imperative for learner instructions,
`vraag`/`antwoord`/`leraar`, `weergeven`/`verbergen`.
