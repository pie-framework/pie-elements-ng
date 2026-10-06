# @pie-element/mc-populated-blank

## 0.3.1

### Patch Changes

- [#341](https://github.com/pie-framework/pie-elements-ng/pull/341) [`4f881e3`](https://github.com/pie-framework/pie-elements-ng/commit/4f881e3247d930284a790b149d01a6c766eeac40) Thanks [@chillenious](https://github.com/chillenious)! - The delivery views of mc-populated-blank, simple-cloze and venn-classification take their surfaces, ink, borders, show-correct-answer icon and feedback glyphs from the `--pie-*` theme, keeping the old colours as fallbacks. With no theme, the venn outside-region divider and tile tray border darken to #64748b and the tray's drop outline to #0284c7 to clear 3:1, and the mc-populated-blank listen button sits on a fixed white plate so its artwork stays legible on a dark page.

- [#377](https://github.com/pie-framework/pie-elements-ng/pull/377) [`60460ab`](https://github.com/pie-framework/pie-elements-ng/commit/60460ab627460c556f0333897a38916f73689456) Thanks [@chillenious](https://github.com/chillenious)! - mc-populated-blank stores the learner's pick as `value`, a one-entry array of choice ids as in multiple-choice, in place of `choiceId` (PIE-1218). Hosts that read the response from `value` now get it. Sessions holding `choiceId` still score and render, and the next pick replaces it.

- [#310](https://github.com/pie-framework/pie-elements-ng/pull/310) [`b717f8f`](https://github.com/pie-framework/pie-elements-ng/commit/b717f8f957eaebcf28238a2ceb8e9dedf21fdbbd) Thanks [@chillenious](https://github.com/chillenious)! - fix(mc-populated-blank): render the radios at 24x24

## 0.3.0

### Minor Changes

- [#75](https://github.com/pie-framework/pie-elements-ng/pull/75) [`392bfcf`](https://github.com/pie-framework/pie-elements-ng/commit/392bfcf44840c2e0f1ec012096a909ffb8665d7e) Thanks [@chillenious](https://github.com/chillenious)! - stop rendering the audio transcript in delivery; the toolkit renders it PIE-855

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Announce the blank's state and the options available in it to screen readers, so a blank's current value and its choices are reachable without sight (PIE-784)

- [#193](https://github.com/pie-framework/pie-elements-ng/pull/193) [`7077034`](https://github.com/pie-framework/pie-elements-ng/commit/7077034c1ab4fdda2e0bd844716aed79e4f02493) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - `completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.
  
  Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.

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

- [#139](https://github.com/pie-framework/pie-elements-ng/pull/139) [`9eaefde`](https://github.com/pie-framework/pie-elements-ng/commit/9eaefdeb7818224f1c77be7d242cabe01e7e1920) Thanks [@chillenious](https://github.com/chillenious)! - Bottom-anchor a selected answer against the blank's underline and keep the blank out of the stem's shared baseline row, so choosing an option no longer shifts sibling stem tokens in the r1 CQT layouts, and size distractor images embedded as raw markup in labelHtml at 150x150 (CONTOOL-3159)

- [#147](https://github.com/pie-framework/pie-elements-ng/pull/147) [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`0f1b96e`](https://github.com/pie-framework/pie-elements-ng/commit/0f1b96e33ead1c1f47a87b291692880991c53a3e) Thanks [@chillenious](https://github.com/chillenious)! - Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`5afe90a`](https://github.com/pie-framework/pie-elements-ng/commit/5afe90ab66b9c620c7f5ee6b8082866ec9bbb668) Thanks [@chillenious](https://github.com/chillenious)! - Leave the session's `id` and `element` to the player, so a versioned tag survives a response (PIE-1075). Audio timing now survives the learner's next pick and `waitTime` is recorded, and a reset session clears the selection. An item missing its prompt, template or choices no longer shows demo content.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66) Thanks [@chillenious](https://github.com/chillenious)! - Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.

- [#179](https://github.com/pie-framework/pie-elements-ng/pull/179) [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52) Thanks [@chillenious](https://github.com/chillenious)! - `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

- [#183](https://github.com/pie-framework/pie-elements-ng/pull/183) [`7ed1380`](https://github.com/pie-framework/pie-elements-ng/commit/7ed1380dc61c0faa72d1ae33e965ea1c5cc48019) Thanks [@chillenious](https://github.com/chillenious)! - The `narrowHorizontalChoiceMaxWidthPx` layout limit is removed: it has had no effect since the choice tiles moved into their own component.

- [#178](https://github.com/pie-framework/pie-elements-ng/pull/178) [`dad31dc`](https://github.com/pie-framework/pie-elements-ng/commit/dad31dcc718bf7f5438ac1ee1fb2e2cae89c650b) Thanks [@chillenious](https://github.com/chillenious)! - Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.

- [#183](https://github.com/pie-framework/pie-elements-ng/pull/183) [`2a4317f`](https://github.com/pie-framework/pie-elements-ng/commit/2a4317f9d4fcbfb0b192ff0b5587d2f7f68bd949) Thanks [@chillenious](https://github.com/chillenious)! - Hovered, selected and scored choices set their text colour along with their background, and the vic variants' red blank answer carries its white surface, so a CQT variant's fixed colours keep AA contrast under a dark colour scheme.

- [#185](https://github.com/pie-framework/pie-elements-ng/pull/185) [`0f34f86`](https://github.com/pie-framework/pie-elements-ng/commit/0f34f867b6088f0c59dc7aab99d3858dcebb36c4) Thanks [@chillenious](https://github.com/chillenious)! - An r1 item on the `inline_sentence` layout keeps its stem on one line: the 150px Learnosity token box now applies only to the r1 token layouts.

- [#149](https://github.com/pie-framework/pie-elements-ng/pull/149) [`80b5869`](https://github.com/pie-framework/pie-elements-ng/commit/80b5869903116541f6c1c95f534072678e1223d9) Thanks [@arimieandreea](https://github.com/arimieandreea)! - A text answer in a sel_r1-g_plusggg blank sits on its underline, level with the stem word, as in Learnosity; image answers keep the 156px box.

- [#180](https://github.com/pie-framework/pie-elements-ng/pull/180) [`34065a2`](https://github.com/pie-framework/pie-elements-ng/commit/34065a2fbad1edb51c145dcbdae4d80106c180ca) Thanks [@chillenious](https://github.com/chillenious)! - The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#203](https://github.com/pie-framework/pie-elements-ng/pull/203) [`59115a7`](https://github.com/pie-framework/pie-elements-ng/commit/59115a71f75b5a763bfb1f2407af440d9351ea45) Thanks [@chillenious](https://github.com/chillenious)! - A stored choice order shows only the choices it lists, as in the other elements. A choice added to the item after the order was saved is left out, where it was appended.

- [#203](https://github.com/pie-framework/pie-elements-ng/pull/203) [`1ecdcf5`](https://github.com/pie-framework/pie-elements-ng/commit/1ecdcf5e66d6f87e4bdfeea54b1228c00bd01ac9) Thanks [@chillenious](https://github.com/chillenious)! - The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)

- [#204](https://github.com/pie-framework/pie-elements-ng/pull/204) [`f64aeac`](https://github.com/pie-framework/pie-elements-ng/commit/f64aeac84eef164000a855e6ac2842d0067e26aa) Thanks [@chillenious](https://github.com/chillenious)! - The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

- [#209](https://github.com/pie-framework/pie-elements-ng/pull/209) [`8bd4fe2`](https://github.com/pie-framework/pie-elements-ng/commit/8bd4fe251a62a4a1b7a33b45b22e4fab6d3fb1b1) Thanks [@chillenious](https://github.com/chillenious)! - Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`ce67393`](https://github.com/pie-framework/pie-elements-ng/commit/ce67393e5fefd8736fca96e7c92a36a129b068f3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#210](https://github.com/pie-framework/pie-elements-ng/issues/210) from pie-framework/dependabot/github_actions/actions/cache-6

- [#237](https://github.com/pie-framework/pie-elements-ng/pull/237) [`bde7249`](https://github.com/pie-framework/pie-elements-ng/commit/bde7249cb7a6248ff71fa47667e4a0a6252a20a8) Thanks [@chillenious](https://github.com/chillenious)! - The show-correct-answer toggle and teacher instructions render above the stem on the grid layouts, together with the prompt in one `pie-header` block; before, they fell below the answer choices.

- [#238](https://github.com/pie-framework/pie-elements-ng/pull/238) [`7180cd3`](https://github.com/pie-framework/pie-elements-ng/commit/7180cd300172528481352ef76a2824b46f57e059) Thanks [@chillenious](https://github.com/chillenious)! - The bundled audio button icons are optimized, bringing the delivery bundle back from 119 KB to about 73 KB gzipped.

- [#237](https://github.com/pie-framework/pie-elements-ng/pull/237) [`bde7249`](https://github.com/pie-framework/pie-elements-ng/commit/bde7249cb7a6248ff71fa47667e4a0a6252a20a8) Thanks [@chillenious](https://github.com/chillenious)! - A prompt now renders above the stem on the grid layouts: `inline_sentence` with the Listen button, `token_sequence` and `stimulus_image_blank`. Before, it fell below the answer choices. An `iat-align-center` block is centred. A prompt that holds no text or media renders nothing, and the choices keep their own label.

- [#231](https://github.com/pie-framework/pie-elements-ng/pull/231) [`5eaa1f7`](https://github.com/pie-framework/pie-elements-ng/commit/5eaa1f745974c11d140e78d414d49def136b03fe) Thanks [@chillenious](https://github.com/chillenious)! - Order choices with `lockChoices` and `getShuffledChoices` from `@pie-element/shared-controller-utils`, as the other elements do. A new shuffle is now saved for a session without an `id` or `element` too.

- [#236](https://github.com/pie-framework/pie-elements-ng/pull/236) [`ff302e2`](https://github.com/pie-framework/pie-elements-ng/commit/ff302e20e17b2b6ae995ad243f5877998d275cf9) Thanks [@JimArgeropoulos](https://github.com/JimArgeropoulos)! - Bundle the default audio play button SVGs instead of loading them from an external CDN

- [#243](https://github.com/pie-framework/pie-elements-ng/pull/243) [`869af7f`](https://github.com/pie-framework/pie-elements-ng/commit/869af7f17807b5c9de9e7a48648d4ebd6457ff92) Thanks [@chillenious](https://github.com/chillenious)! - The CQT variants' blank has no inline padding, as in Learnosity, so a placed answer image fills its 150px box again. The sel_vic and sr_vic distractor radios sit 20px from the row edge and their label, centred on it, at Learnosity's row spacing.

- [#243](https://github.com/pie-framework/pie-elements-ng/pull/243) [`c79d359`](https://github.com/pie-framework/pie-elements-ng/commit/c79d35980b36b4236d17b7b55b60744c2f13ef27) Thanks [@chillenious](https://github.com/chillenious)! - Below 850px the audio-blank, token, stimulus-image and inline-sentence-with-audio layouts stack in one column at the left edge, as the Learnosity CQT templates do: the listen button above the stem, then the stem, blank and answer tiles. Stacked tiles keep their pixel width, and the sel_r1 token stems and the sel_vic sentence follow Learnosity's narrow layout. This breakpoint was 760px.

- [#243](https://github.com/pie-framework/pie-elements-ng/pull/243) [`c8e7701`](https://github.com/pie-framework/pie-elements-ng/commit/c8e77014d35e66c7a5ca4e3e788c82907915c5c7) Thanks [@chillenious](https://github.com/chillenious)! - The sel_r1 token layouts bottom-align stem tokens and the placed answer in their 150px boxes beside a 160px blank, as Learnosity does, so the text sits just above the underline and the blank keeps one height empty and filled. The sel_vic sentence starts at the content's left edge, inset 20px from 850px up.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`986996b`](https://github.com/pie-framework/pie-elements-ng/commit/986996b9231d21dda9ce97957f2100069f46f775) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#247](https://github.com/pie-framework/pie-elements-ng/issues/247) from pie-framework/docs/mc-populated-blank-r1-token-wireframes

- [#257](https://github.com/pie-framework/pie-elements-ng/pull/257) [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c) Thanks [@chillenious](https://github.com/chillenious)! - The variant stylesheets drop their source comments, and the README drops the stylesheet refresh steps that relied on them.

- [#143](https://github.com/pie-framework/pie-elements-ng/pull/143) [`b59ecfe`](https://github.com/pie-framework/pie-elements-ng/commit/b59ecfeb174c333846cc2754ee8f877f12f26ac5) Thanks [@chillenious](https://github.com/chillenious)! - Republish with no `devDependencies` in the manifest, so the production bundler can install
  this element.
  
  `pie-api-aws` extracts each element tarball as a yarn workspace member, and yarn installs
  workspace members' devDependencies. This element's manifest pinned
  `@pie-lib/delivery-events-svelte@0.1.0`, a workspace package that is versioned but never
  published, so the install failed before webpack ran and no bundle containing this element
  could be built.

- [#142](https://github.com/pie-framework/pie-elements-ng/pull/142) [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9) Thanks [@chillenious](https://github.com/chillenious)! - Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- [#184](https://github.com/pie-framework/pie-elements-ng/pull/184) [`76a901f`](https://github.com/pie-framework/pie-elements-ng/commit/76a901f1b32044be59e16b519e058929978c3cc1) Thanks [@chillenious](https://github.com/chillenious)! - Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies [[`509caf6`](https://github.com/pie-framework/pie-elements-ng/commit/509caf638617921bb62037b4e0d5d69b5bdca37d), [`5ca8ec1`](https://github.com/pie-framework/pie-elements-ng/commit/5ca8ec140ac4b115c8d11cb783d856be42f3de7b), [`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43), [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`1ecdcf5`](https://github.com/pie-framework/pie-elements-ng/commit/1ecdcf5e66d6f87e4bdfeea54b1228c00bd01ac9), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021), [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c), [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735)]:
  - @pie-element/shared-controller-utils@0.1.1
  - @pie-element/shared-types@0.2.0
  - @pie-lib/delivery-events-svelte@0.2.0

## 0.3.0-next.29

### Patch Changes

- 3e49e88: The variant stylesheets drop their source comments, and the README drops the stylesheet refresh steps that relied on them.
- Updated dependencies [3e49e88]
  - @pie-element/shared-types@0.2.0-next.5
  - @pie-element/shared-controller-utils@0.1.1-next.8

## 0.3.0-next.28

### Patch Changes

- Merge pull request #247 from pie-framework/docs/mc-populated-blank-r1-token-wireframes

## 0.3.0-next.27

### Patch Changes

- 869af7f: The CQT variants' blank has no inline padding, as in Learnosity, so a placed answer image fills its 150px box again. The sel_vic and sr_vic distractor radios sit 20px from the row edge and their label, centred on it, at Learnosity's row spacing.
- c79d359: Below 850px the audio-blank, token, stimulus-image and inline-sentence-with-audio layouts stack in one column at the left edge, as the Learnosity CQT templates do: the listen button above the stem, then the stem, blank and answer tiles. Stacked tiles keep their pixel width, and the sel_r1 token stems and the sel_vic sentence follow Learnosity's narrow layout. This breakpoint was 760px.
- c8e7701: The sel_r1 token layouts bottom-align stem tokens and the placed answer in their 150px boxes beside a 160px blank, as Learnosity does, so the text sits just above the underline and the blank keeps one height empty and filled. The sel_vic sentence starts at the content's left edge, inset 20px from 850px up.

## 0.3.0-next.26

### Patch Changes

- 7180cd3: The bundled audio button icons are optimized, bringing the delivery bundle back from 119 KB to about 73 KB gzipped.

## 0.3.0-next.25

### Patch Changes

- bde7249: The show-correct-answer toggle and teacher instructions render above the stem on the grid layouts, together with the prompt in one `pie-header` block; before, they fell below the answer choices.
- bde7249: A prompt now renders above the stem on the grid layouts: `inline_sentence` with the Listen button, `token_sequence` and `stimulus_image_blank`. Before, it fell below the answer choices. An `iat-align-center` block is centred. A prompt that holds no text or media renders nothing, and the choices keep their own label.

## 0.3.0-next.24

### Patch Changes

- ff302e2: Bundle the default audio play button SVGs instead of loading them from an external CDN

## 0.3.0-next.23

### Patch Changes

- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4
  - @pie-element/shared-controller-utils@0.1.1-next.7

## 0.3.0-next.22

### Minor Changes

- stop rendering the audio transcript in delivery; the toolkit renders it PIE-855
- Announce the blank's state and the options available in it to screen readers, so a blank's current value and its choices are reachable without sight (PIE-784)
- `completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.
  
  Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.

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
- Bottom-anchor a selected answer against the blank's underline and keep the blank out of the stem's shared baseline row, so choosing an option no longer shifts sibling stem tokens in the r1 CQT layouts, and size distractor images embedded as raw markup in labelHtml at 150x150 (CONTOOL-3159)
- The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
- Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)
- Leave the session's `id` and `element` to the player, so a versioned tag survives a response (PIE-1075). Audio timing now survives the learner's next pick and `waitTime` is recorded, and a reset session clears the selection. An item missing its prompt, template or choices no longer shows demo content.
- Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.
- `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- The `narrowHorizontalChoiceMaxWidthPx` layout limit is removed: it has had no effect since the choice tiles moved into their own component.
- Print renders the delivery component as a player shows the printout's role in `view` mode, so it takes the variant layout and inline-sentence spacing; an instructor's key fills the blank and checks the key's choice, in place of the `(key)` label, which is removed from the translator.
- Hovered, selected and scored choices set their text colour along with their background, and the vic variants' red blank answer carries its white surface, so a CQT variant's fixed colours keep AA contrast under a dark colour scheme.
- An r1 item on the `inline_sentence` layout keeps its stem on one line: the 150px Learnosity token box now applies only to the r1 token layouts.
- A text answer in a sel_r1-g_plusggg blank sits on its underline, level with the stem word, as in Learnosity; image answers keep the 156px box.
- The package root re-exports `./delivery/index.js` instead of bundling a second copy of it, so `@pie-element/<name>` and `@pie-element/<name>/delivery` export the same element class. `dist/index.js.map` is no longer published.
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- A stored choice order shows only the choices it lists, as in the other elements. A choice added to the item after the order was saved is left out, where it was appended.
- The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.
- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6
- 5eaa1f7: Order choices with `lockChoices` and `getShuffledChoices` from `@pie-element/shared-controller-utils`, as the other elements do. A new shuffle is now saved for a session without an `id` or `element` too.
- Republish with no `devDependencies` in the manifest, so the production bundler can install
  this element.
  
  `pie-api-aws` extracts each element tarball as a yarn workspace member, and yarn installs
  workspace members' devDependencies. This element's manifest pinned
  `@pie-lib/delivery-events-svelte@0.1.0`, a workspace package that is versioned but never
  published, so the install failed before webpack ran and no bundle containing this element
  could be built.
- Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.
- Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-controller-utils@0.1.1-next.6
  - @pie-element/shared-types@0.2.0-next.3
  - @pie-lib/delivery-events-svelte@0.2.0-next.5

## 0.3.0-next.21

### Patch Changes

- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6

## 0.3.0-next.20

### Patch Changes

- 8bd4fe2: Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

## 0.3.0-next.19

### Patch Changes

- 59115a7: A stored choice order shows only the choices it lists, as in the other elements. A choice added to the item after the order was saved is left out, where it was appended.
- 1ecdcf5: The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)

## 0.3.0-next.18

### Patch Changes

- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

## 0.3.0-next.17

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.3.0-next.16

### Minor Changes

- 7077034: `completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.

  Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.

## 0.3.0-next.15

### Patch Changes

- 76a901f: Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.

## 0.3.0-next.14

### Patch Changes

- 0f34f86: An r1 item on the `inline_sentence` layout keeps its stem on one line: the 150px Learnosity token box now applies only to the r1 token layouts.

## 0.3.0-next.13

### Patch Changes

- 7ed1380: The `narrowHorizontalChoiceMaxWidthPx` layout limit is removed: it has had no effect since the choice tiles moved into their own component.
- 2a4317f: Hovered, selected and scored choices set their text colour along with their background, and the vic variants' red blank answer carries its white surface, so a CQT variant's fixed colours keep AA contrast under a dark colour scheme.

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
