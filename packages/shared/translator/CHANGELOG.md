# @pie-lib/translator

## 5.0.1

### Patch Changes

- [#308](https://github.com/pie-framework/pie-elements-ng/pull/308) [`eccf20a`](https://github.com/pie-framework/pie-elements-ng/commit/eccf20af3fd0b5b63830ac0ab3b89ee2cecbfaa5) Thanks [@chillenious](https://github.com/chillenious)! - Adds English and Spanish names for drag-in-the-blank blanks, hotspot shapes and image cloze association response areas.

- [#331](https://github.com/pie-framework/pie-elements-ng/pull/331) [`260da48`](https://github.com/pie-framework/pie-elements-ng/commit/260da48c8db25fa0da4380d5bf8f26875c5da87b) Thanks [@chillenious](https://github.com/chillenious)! - Students can select select-text tokens from the keyboard. The text is one tab stop: the arrow keys, Home and End move between tokens, and Space or Enter toggles the focused token, writing the session as a click does. Screen readers hear each token as a toggle button with its pressed state and position, inside a group named "Selectable text" that adds "select up to N" when the item sets a limit; evaluate describes each marked token by its Legend label, in English or Spanish. At the selection limit, unselected tokens stay in the sequence as unavailable tokens instead of becoming plain text, and look as before.

- [#330](https://github.com/pie-framework/pie-elements-ng/pull/330) [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab) Thanks [@chillenious](https://github.com/chillenious)! - Region names, screen-reader headings, the teacher instructions, rationale and rubric toggles, the drawing-response tool names, the inline dropdown names, the math keypad instructions, the editor toolbar buttons and the chart and graph key legends follow the item language, in English and Spanish, and follow a language change after the first render. A two-part question also labels its parts in the item language. The drawing-response background image is decorative, so screen readers skip it.

- [#342](https://github.com/pie-framework/pie-elements-ng/pull/342) [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e) Thanks [@chillenious](https://github.com/chillenious)! - The custom audio play button on a prompt and the chart's Actions control are buttons a keyboard can reach and press with Enter or Space, with a visible focus ring and an accessible name in the item language ("Play audio", "Actions"). The Actions control tells screen readers whether its popover is open.

- [#281](https://github.com/pie-framework/pie-elements-ng/pull/281) [`9d5457e`](https://github.com/pie-framework/pie-elements-ng/commit/9d5457e831bd03e1e77f5cc9b34d004a02363fac) Thanks [@chillenious](https://github.com/chillenious)! - fix(hotspot): describe the image by its hotspot count and hide the shape canvas

- [#284](https://github.com/pie-framework/pie-elements-ng/pull/284) [`7cfd697`](https://github.com/pie-framework/pie-elements-ng/commit/7cfd697e9a74e3e0dba5cea6776a55d28cc706f1) Thanks [@chillenious](https://github.com/chillenious)! - fix(image-cloze-association): generate image alternatives and enlarge answer tiles to 24px

- [#296](https://github.com/pie-framework/pie-elements-ng/pull/296) [`fb0ac81`](https://github.com/pie-framework/pie-elements-ng/commit/fb0ac815b0b0fa3fd44e9986460aaffa8e7f3504) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting, graphing): name the category and mark label inputs

- [#301](https://github.com/pie-framework/pie-elements-ng/pull/301) [`9b72376`](https://github.com/pie-framework/pie-elements-ng/commit/9b72376f6055ba629a913c9a0739623aa6f45e49) Thanks [@chillenious](https://github.com/chillenious)! - fix(plot): name and describe the chart and graph svg

- [#303](https://github.com/pie-framework/pie-elements-ng/pull/303) [`78f05ca`](https://github.com/pie-framework/pie-elements-ng/commit/78f05ca7479e27cb42e5b3ec182a5141e55e131c) Thanks [@chillenious](https://github.com/chillenious)! - fix(math-input): name each response field's textarea in the item language

- [#304](https://github.com/pie-framework/pie-elements-ng/pull/304) [`9fb74e3`](https://github.com/pie-framework/pie-elements-ng/commit/9fb74e35c92368732712f5752be4af7cd62525ec) Thanks [@chillenious](https://github.com/chillenious)! - fix(editable-html-tip-tap): name the text box in explicit-constructed-response and extended-text-entry

- [#305](https://github.com/pie-framework/pie-elements-ng/pull/305) [`41bebc6`](https://github.com/pie-framework/pie-elements-ng/commit/41bebc60b82bcf3f142d73aa359ac08bece0aff5) Thanks [@chillenious](https://github.com/chillenious)! - fix(number-line): describe the graph from its range, ticks and plotted elements

- [#307](https://github.com/pie-framework/pie-elements-ng/pull/307) [`2e5f44d`](https://github.com/pie-framework/pie-elements-ng/commit/2e5f44d95495eacf75ef5f7db7b8f3e69731732f) Thanks [@chillenious](https://github.com/chillenious)! - fix(drawing-response): name the color selects and the drawing canvas

- [#312](https://github.com/pie-framework/pie-elements-ng/pull/312) [`931cbae`](https://github.com/pie-framework/pie-elements-ng/commit/931cbaef25b10d1d5b68b35f51883b544f939c17) Thanks [@chillenious](https://github.com/chillenious)! - fix(fraction-model): name each model from its parts and selection

- [#317](https://github.com/pie-framework/pie-elements-ng/pull/317) [`69f45cd`](https://github.com/pie-framework/pie-elements-ng/commit/69f45cd6e1b08ca92164583b03ffdc150ca8dedc) Thanks [@chillenious](https://github.com/chillenious)! - fix(editable-html-tip-tap): make the toolbar a named toolbar, inert while hidden

- [#320](https://github.com/pie-framework/pie-elements-ng/pull/320) [`f367c5c`](https://github.com/pie-framework/pie-elements-ng/commit/f367c5c24bec97e4513106cb9d58af614226b77d) Thanks [@chillenious](https://github.com/chillenious)! - fix(hotspot): describe each evaluated shape by its correctness

- [#373](https://github.com/pie-framework/pie-elements-ng/pull/373) [`c64a668`](https://github.com/pie-framework/pie-elements-ng/commit/c64a668127a4165e708a28c2475659624b8f65fd) Thanks [@chillenious](https://github.com/chillenious)! - fix(number-line): show and announce each evaluated element's correctness

- [#375](https://github.com/pie-framework/pie-elements-ng/pull/375) [`da07902`](https://github.com/pie-framework/pie-elements-ng/commit/da07902fc5db2179a8911ce67df0b8eba2ca5c88) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting): make bars, columns and drag handles keyboard-operable sliders

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
