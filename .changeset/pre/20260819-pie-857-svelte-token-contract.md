---
"@pie-element/mc-populated-blank": patch
"@pie-element/venn-classification": patch
---

Fix: bring the Svelte elements' `--pie-*` reads back inside the pie-players theming contract (PIE-857)

The `--pie-correct-answer-*` family was invented by these packages, so the
`pie-players` token registry could not see it and no color scheme overrode it.
The 13 names are retired; `mc-populated-blank` now reads the canonical tokens
they indirected through (`--pie-correct-secondary`, `--pie-incorrect-icon`,
`--pie-tertiary-light`, and so on) with the canonical defaults as fallbacks.
Resolved colors are unchanged under a themed host.

Focus outlines no longer hardcode a blue. `mc-populated-blank` read
`--pie-focus`, which nothing defines, and `venn-classification` used a literal
`#2563eb` in four places; both now chain through `--pie-focus-outline`,
`--pie-button-focus-outline`, and `--pie-focus-checked-border`, so the outline
follows the active color scheme.
