# @pie-element/venn-classification

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
