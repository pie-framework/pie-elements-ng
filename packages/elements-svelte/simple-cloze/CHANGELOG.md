# @pie-element/simple-cloze

## 0.1.4-next.11

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.1.4-next.10

### Patch Changes

- d1e429c: Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.
- 76a901f: Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.

## 0.1.4-next.9

### Patch Changes

- e1b65e6: The authoring view's Correct Answer field styles itself, so it keeps its layout and border in hosts that load no Tailwind or daisyUI.

## 0.1.4-next.8

### Patch Changes

- 53bed4b: `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- 34065a2: The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.

## 0.1.4-next.7

### Patch Changes

- 85910c0: The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).
- 3f989fb: The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).
- a84b6c5: Leave the session's `element` to the player (PIE-1075).
- 41768bf: Scoring, accessibility, styling and authoring fixes.
- b2d3248: The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
- 2bb02ad: Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.

## 0.1.4-next.6

### Patch Changes

- d22cfb1: Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

## 0.1.4-next.5

### Patch Changes

- ea07637: The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

## 0.1.4-next.4

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.4-next.3

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 0.1.4-next.2

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 0.1.4-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave

## 0.1.4-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 0.1.3

### Patch Changes

- Add explicit pie.controller metadata for Svelte elements so client-player bundles include controllers

## 0.1.2

### Patch Changes

- Publish Svelte styling under a publishable npm scope and update dependent packages to consume the published library.
- Updated dependencies
  - @pie-lib/editable-html-tiptap-svelte@0.1.2
  - @pie-lib/styling-svelte@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @pie-lib-svelte/styling@0.1.1
  - @pie-lib/editable-html-tiptap-svelte@0.1.1
