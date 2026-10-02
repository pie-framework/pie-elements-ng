# @pie-element/venn-classification

## 0.1.1

### Patch Changes

- [#33](https://github.com/pie-framework/pie-elements-ng/pull/33) [`33d27e0`](https://github.com/pie-framework/pie-elements-ng/commit/33d27e0e13954e986a4a7e8a45e7508f1628712b) Thanks [@chillenious](https://github.com/chillenious)! - define and enforce packaging contracts PIE-626

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`b82e87c`](https://github.com/pie-framework/pie-elements-ng/commit/b82e87c1bd6c138b3d88bdb69b12731795ba9297) Thanks [@chillenious](https://github.com/chillenious)! - Prepare all PIE element packages for the next prerelease patch wave

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`fbf3695`](https://github.com/pie-framework/pie-elements-ng/commit/fbf3695636c20afa6a31655c5f1a1d6ed130a374) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger the next prerelease patch for all PIE element packages.

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`d0f8d8e`](https://github.com/pie-framework/pie-elements-ng/commit/d0f8d8ead911f8c6256a4898a2f6b6863b7538ac) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger another prerelease patch for all PIE element packages.

- [#86](https://github.com/pie-framework/pie-elements-ng/pull/86) [`7634975`](https://github.com/pie-framework/pie-elements-ng/commit/763497514babf6377d15b3416f7459fc0c3e5857) Thanks [@chillenious](https://github.com/chillenious)! - Fix: bring the Svelte elements' `--pie-*` reads back inside the pie-players theming contract (PIE-857)
  
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

- [#147](https://github.com/pie-framework/pie-elements-ng/pull/147) [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`85910c0`](https://github.com/pie-framework/pie-elements-ng/commit/85910c0c3681f7e1f063bd680dd0171954a62ce9) Thanks [@chillenious](https://github.com/chillenious)! - The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`3f989fb`](https://github.com/pie-framework/pie-elements-ng/commit/3f989fb4833beeddcd5e0aa6067f42b9cd1eb820) Thanks [@chillenious](https://github.com/chillenious)! - The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713) Thanks [@chillenious](https://github.com/chillenious)! - Leave the session's `element` to the player (PIE-1075).

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66) Thanks [@chillenious](https://github.com/chillenious)! - Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`cee9377`](https://github.com/pie-framework/pie-elements-ng/commit/cee9377bc7f3bb9b7156927a3d0cb340615da985) Thanks [@chillenious](https://github.com/chillenious)! - Session, scoring, accessibility and authoring fixes.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`681c694`](https://github.com/pie-framework/pie-elements-ng/commit/681c6941b8671609c628c56bc073cf176b5e1905) Thanks [@chillenious](https://github.com/chillenious)! - Placed tiles stay inside their region, with the diagram growing when a region fills, and every drop zone is at least 120×120 px. Screen-reader activation picks up and drops tiles, the author preview uses region-label overrides, and a restored complete session reports `complete: true` on load. Instructors see teacher instructions, collapsed, including when `teacherInstructionsEnabled` is unset (PIE-1075).

- [#156](https://github.com/pie-framework/pie-elements-ng/pull/156) [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

- [#179](https://github.com/pie-framework/pie-elements-ng/pull/179) [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52) Thanks [@chillenious](https://github.com/chillenious)! - `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

- [#180](https://github.com/pie-framework/pie-elements-ng/pull/180) [`34065a2`](https://github.com/pie-framework/pie-elements-ng/commit/34065a2fbad1edb51c145dcbdae4d80106c180ca) Thanks [@chillenious](https://github.com/chillenious)! - The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#199](https://github.com/pie-framework/pie-elements-ng/pull/199) [`c4e2ba3`](https://github.com/pie-framework/pie-elements-ng/commit/c4e2ba313d3137c90af800715606e3f372e4beac) Thanks [@chillenious](https://github.com/chillenious)! - Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

- [#205](https://github.com/pie-framework/pie-elements-ng/pull/205) [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704) Thanks [@chillenious](https://github.com/chillenious)! - Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.

- [#208](https://github.com/pie-framework/pie-elements-ng/pull/208) [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6) Thanks [@chillenious](https://github.com/chillenious)! - MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

- [#204](https://github.com/pie-framework/pie-elements-ng/pull/204) [`f64aeac`](https://github.com/pie-framework/pie-elements-ng/commit/f64aeac84eef164000a855e6ac2842d0067e26aa) Thanks [@chillenious](https://github.com/chillenious)! - The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

- [#209](https://github.com/pie-framework/pie-elements-ng/pull/209) [`8bd4fe2`](https://github.com/pie-framework/pie-elements-ng/commit/8bd4fe251a62a4a1b7a33b45b22e4fab6d3fb1b1) Thanks [@chillenious](https://github.com/chillenious)! - Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

- [#225](https://github.com/pie-framework/pie-elements-ng/pull/225) [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02) Thanks [@chillenious](https://github.com/chillenious)! - Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`ce67393`](https://github.com/pie-framework/pie-elements-ng/commit/ce67393e5fefd8736fca96e7c92a36a129b068f3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#210](https://github.com/pie-framework/pie-elements-ng/issues/210) from pie-framework/dependabot/github_actions/actions/cache-6

- [#232](https://github.com/pie-framework/pie-elements-ng/pull/232) [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50) Thanks [@chillenious](https://github.com/chillenious)! - Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.

- [#248](https://github.com/pie-framework/pie-elements-ng/pull/248) [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651) Thanks [@chillenious](https://github.com/chillenious)! - Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

- [#251](https://github.com/pie-framework/pie-elements-ng/pull/251) [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755) Thanks [@chillenious](https://github.com/chillenious)! - When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

- [#184](https://github.com/pie-framework/pie-elements-ng/pull/184) [`d1e429c`](https://github.com/pie-framework/pie-elements-ng/commit/d1e429c4aaf484511d6ffad02dc5aaf60351fdd9) Thanks [@chillenious](https://github.com/chillenious)! - Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.

- [#184](https://github.com/pie-framework/pie-elements-ng/pull/184) [`76a901f`](https://github.com/pie-framework/pie-elements-ng/commit/76a901f1b32044be59e16b519e058929978c3cc1) Thanks [@chillenious](https://github.com/chillenious)! - Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies [[`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52)]:
  - @pie-lib/delivery-events-svelte@0.2.0

## 0.1.1-next.19

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

## 0.1.1-next.18

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

## 0.1.1-next.17

### Patch Changes

- define and enforce packaging contracts PIE-626
- Prepare all PIE element packages for the next prerelease patch wave
- Trigger the next prerelease patch for all PIE element packages.
- Trigger another prerelease patch for all PIE element packages.
- Fix: bring the Svelte elements' `--pie-*` reads back inside the pie-players theming contract (PIE-857)
  
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
- The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
- The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).
- The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).
- Leave the session's `element` to the player (PIE-1075).
- Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.
- Session, scoring, accessibility and authoring fixes.
- Placed tiles stay inside their region, with the diagram growing when a region fills, and every drop zone is at least 120×120 px. Screen-reader activation picks up and drops tiles, the author preview uses region-label overrides, and a restored complete session reports `complete: true` on load. Instructors see teacher instructions, collapsed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
- Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)
- `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.
- Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.
- Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-lib/delivery-events-svelte@0.2.0-next.5

## 0.1.1-next.16

### Patch Changes

- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6

## 0.1.1-next.15

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

## 0.1.1-next.14

### Patch Changes

- 8bd4fe2: Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

## 0.1.1-next.13

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

## 0.1.1-next.12

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

## 0.1.1-next.11

### Patch Changes

- c4e2ba3: Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

## 0.1.1-next.10

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.1.1-next.9

### Patch Changes

- d1e429c: Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.
- 76a901f: Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.

## 0.1.1-next.8

### Patch Changes

- 53bed4b: `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- 34065a2: The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.

## 0.1.1-next.7

### Patch Changes

- 85910c0: The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).
- 3f989fb: The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).
- a84b6c5: Leave the session's `element` to the player (PIE-1075).
- 2bb02ad: Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.
- cee9377: Session, scoring, accessibility and authoring fixes.
- 681c694: Placed tiles stay inside their region, with the diagram growing when a region fills, and every drop zone is at least 120×120 px. Screen-reader activation picks up and drops tiles, the author preview uses region-label overrides, and a restored complete session reports `complete: true` on load. Instructors see teacher instructions, collapsed, including when `teacherInstructionsEnabled` is unset (PIE-1075).

## 0.1.1-next.6

### Patch Changes

- d22cfb1: Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

## 0.1.1-next.5

### Patch Changes

- ea07637: The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

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
