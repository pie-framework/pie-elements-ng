# @pie-element/venn-classification

## 0.1.1-next.4

### Patch Changes

- 7634975: Fix: bring the Svelte elements' `--pie-*` reads back inside the pie-players theming contract (PIE-857)

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

  `@pie-lib/styling-svelte` drops `correctAnswerTokens`, `CorrectAnswerTokens`,
  and `correctAnswerTokensToCssVars`, which defined the retired family and had no
  importers.

## 0.1.1-next.3

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 0.1.1-next.2

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 0.1.1-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave

## 0.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626
