# @pie-element/mc-populated-blank

## 0.3.0-next.4

### Minor Changes

- 392bfcf: stop rendering the audio transcript in delivery; the toolkit renders it PIE-855

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

## 0.2.13-next.3

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 0.2.13-next.2

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 0.2.13-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave

## 0.2.13-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 0.2.12

### Patch Changes

- Publish a dist-only package surface so hosts can consume the Svelte element without source files, Svelte peer dependencies, or unpublished workspace runtime dependencies.

## 0.2.11

### Patch Changes

- dcd5aa2: Added parity tests between McPopulatedBlank and Learnosity CQTs. McPopulatedBlank now looks and acts much more like the CQTs. Ready for review by others.

## 0.2.10

### Patch Changes

- Prepare a patch release for mc-populated-blank

## 0.2.9

### Patch Changes

- Add published root `controller.js` shim for `pie-api-aws` alias-based controller resolution compatibility.

## 0.2.8

### Patch Changes

- Publish latest mc-populated-blank delivery and demo updates.

## 0.2.7

### Patch Changes

- Add explicit pie.controller metadata for Svelte elements so client-player bundles include controllers

## 0.2.6

### Patch Changes

- Expose controller in package entry for client-player bundles so evaluate mode computes correctness

## 0.2.5

### Patch Changes

- Align evaluate correctness contract and scorer parity for mc-populated-blank

## 0.2.4

### Patch Changes

- Publish Svelte styling under a publishable npm scope and update dependent packages to consume the published library.
- Updated dependencies
  - @pie-lib/styling-svelte@0.1.2

## 0.2.3

### Patch Changes

- Publish @pie-lib-svelte/styling and update mc-populated-blank to depend on a published styling package for external installs.
- Updated dependencies
  - @pie-lib-svelte/styling@0.1.1

## 0.2.2

### Patch Changes

- Release mc-populated-blank with unanswered evaluate correctness feedback parity and regression coverage.

## 0.2.1

### Patch Changes

- Prepare a patch release for mc-populated-blank.

## 0.2.0

### Minor Changes

- 46e30e2: Initial publish of `@pie-element/mc-populated-blank`: Svelte 5 element for multiple-choice answers that populate a `{{blank}}` slot in an HTML template, with optional audio/transcript, author UI, controller, and print surface. Synthetic demos in element-demo and pie-players item-demos.
