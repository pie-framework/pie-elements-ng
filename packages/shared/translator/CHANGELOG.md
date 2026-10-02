# @pie-lib/translator

## 5.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#31](https://github.com/pie-framework/pie-elements-ng/pull/31) [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng ESM builds for PIE lib packages

- [#94](https://github.com/pie-framework/pie-elements-ng/pull/94) [`991b31a`](https://github.com/pie-framework/pie-elements-ng/commit/991b31ac954c87c5064f757277edcf8804c072fb) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng builds of translator, categorize and graphing-utils so published elements pin ng-built lib tarballs instead of legacy ones

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`0f1b96e`](https://github.com/pie-framework/pie-elements-ng/commit/0f1b96e33ead1c1f47a87b291692880991c53a3e) Thanks [@chillenious](https://github.com/chillenious)! - Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`b2d3248`](https://github.com/pie-framework/pie-elements-ng/commit/b2d3248a488d850e6afd3f6fa1263eb8d1779ba2) Thanks [@chillenious](https://github.com/chillenious)! - The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).

- [#172](https://github.com/pie-framework/pie-elements-ng/pull/172) [`a0ee0d5`](https://github.com/pie-framework/pie-elements-ng/commit/a0ee0d51370f2f412501957f8ddf0fd108810a3e) Thanks [@chillenious](https://github.com/chillenious)! - Translate the Spanish `common.correct` and `common.incorrect` strings, which were still in English.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66) Thanks [@chillenious](https://github.com/chillenious)! - Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.

- [#178](https://github.com/pie-framework/pie-elements-ng/pull/178) [`dad31dc`](https://github.com/pie-framework/pie-elements-ng/commit/dad31dcc718bf7f5438ac1ee1fb2e2cae89c650b) Thanks [@chillenious](https://github.com/chillenious)! - Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.

- [#209](https://github.com/pie-framework/pie-elements-ng/pull/209) [`619ea67`](https://github.com/pie-framework/pie-elements-ng/commit/619ea67e7e5668408b1f3a1d6a3abb2dd06af1cd) Thanks [@chillenious](https://github.com/chillenious)! - The shipped `Translator` type no longer fails to extend i18next's `i18n` when a client type-checks with `skipLibCheck` off.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

## 5.0.0-next.7

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Publish ng ESM builds for PIE lib packages
- Publish ng builds of translator, categorize and graphing-utils so published elements pin ng-built lib tarballs instead of legacy ones
- Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)
- The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
- Translate the Spanish `common.correct` and `common.incorrect` strings, which were still in English.
- Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.
- Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.
- The shipped `Translator` type no longer fails to extend i18next's `i18n` when a client type-checks with `skipLibCheck` off.
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

## 5.0.0-next.6

### Patch Changes

- 619ea67: The shipped `Translator` type no longer fails to extend i18next's `i18n` when a client type-checks with `skipLibCheck` off.

## 5.0.0-next.5

### Patch Changes

- dad31dc: Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.

## 5.0.0-next.4

### Patch Changes

- 0f1b96e: Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)
- b2d3248: The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
- a0ee0d5: Translate the Spanish `common.correct` and `common.incorrect` strings, which were still in English.
- 2bb02ad: Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.

## 5.0.0-next.3

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

## 4.0.3-next.2

### Patch Changes

- 991b31a: Publish ng builds of translator, categorize and graphing-utils so published elements pin ng-built lib tarballs instead of legacy ones

## 4.0.3-next.1

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1

## 4.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0

## 4.0.3-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
