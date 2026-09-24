# @pie-element/mc-populated-blank

## 0.3.0-next.12

### Patch Changes

- 80b5869: A text answer in a sel_r1-g_plusggg blank sits on its underline, level with the stem word, as in Learnosity; image answers keep the 156px box.

## 0.3.0-next.11

### Patch Changes

- 53bed4b: `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- dad31dc: Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.
- 34065a2: The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.

## 0.3.0-next.10

### Patch Changes

- 0f1b96e: Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)
- 5afe90a: Leave the session's `id` and `element` to the player, so a versioned tag survives a response (PIE-1075). Audio timing now survives the learner's next pick and `waitTime` is recorded, and a reset session clears the selection. An item missing its prompt, template or choices no longer shows demo content.
- 2bb02ad: Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.

## 0.3.0-next.9

### Patch Changes

- ea07637: The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

## 0.3.0-next.8

### Patch Changes

- b59ecfe: Republish with no `devDependencies` in the manifest, so the production bundler can install
  this element.

  `pie-api-aws` extracts each element tarball as a yarn workspace member, and yarn installs
  workspace members' devDependencies. This element's manifest pinned
  `@pie-lib/delivery-events-svelte@0.1.0`, a workspace package that is versioned but never
  published, so the install failed before webpack ran and no bundle containing this element
  could be built.

## 0.3.0-next.7

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.3.0-next.6

### Patch Changes

- 9eaefde: Bottom-anchor a selected answer against the blank's underline and keep the blank out of the stem's shared baseline row, so choosing an option no longer shifts sibling stem tokens in the r1 CQT layouts, and size distractor images embedded as raw markup in labelHtml at 150x150 (CONTOOL-3159)

## 0.3.0-next.5

### Minor Changes

- 7cae8f9: Announce the blank's state and the options available in it to screen readers, so a blank's current value and its choices are reachable without sight (PIE-784)

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
