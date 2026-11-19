# @pie-element/simple-cloze

## 0.1.12

### Patch Changes

- [#697](https://github.com/pie-framework/pie-elements-ng/pull/697) [`0a4b2fc`](https://github.com/pie-framework/pie-elements-ng/commit/0a4b2fc8b89bf4929e582824ad196a82561aa1f0) Thanks [@chillenious](https://github.com/chillenious)! - Authors can let a response accept Arabic spelling variants (hamza and madda alef forms, tashkeel, ه for ة, ي for ى): one switch in simple-cloze, a switch plus a per-area toggle in explicit-constructed-response. Off by default. Settings-panel toggles take optional help text.

- [#637](https://github.com/pie-framework/pie-elements-ng/pull/637) [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8) Thanks [@chillenious](https://github.com/chillenious)! - A host plural override of one category no longer throws or hides the shipped categories: each category resolves through host messages and catalogs in lookup order. Host messages registered for a regional or differently-cased tag (`es-MX`, `ES`) layer over the shipped catalog the request resolves to, which still loads and gates `isLocaleReady`. The last `setLocale` call wins over a slower earlier one, and `loadLocale`, `isLocaleReady` and `forLocale` treat a non-string argument as no locale.

  A translator's `getLocale()` and `getDirection()` name the locale its strings are served in, English for a locale nothing ships or whose catalog failed, and chrome roots stamp that locale through the new `chromeLanguageAttributes`. video-stimulus stamps its content `lang` canonicalized, and math-templated follows a switch back to a locale already loaded.

- [#633](https://github.com/pie-framework/pie-elements-ng/pull/633) [`736ad4f`](https://github.com/pie-framework/pie-elements-ng/commit/736ad4fe6edf8a3fb5af17fe0adf0e936d1368ab) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte elements' interface strings ship in fourteen interface languages and follow the interface locale a player publishes, else the item's declared language, else US English: the correct-answer and teacher-instructions toggles, status messages, blank and choice names, the Venn tray, region and tile names with their announcements, and the video's status messages and transcript controls. An element first renders once its language has loaded, so it shows no English frame first. The element keeps the item's declared language as its content `lang`, and stamps none for an item that declares none. A video stimulus with no declared language no longer reads as English, and its authored `uiText` overrides apply in every interface language.

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#597](https://github.com/pie-framework/pie-elements-ng/pull/597) [`7a17552`](https://github.com/pie-framework/pie-elements-ng/commit/7a17552675ba7e0bdac248d342ca795feb59fd8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump the tiptap group across 1 directory with 25 updates

- [#605](https://github.com/pie-framework/pie-elements-ng/pull/605) [`932e3d9`](https://github.com/pie-framework/pie-elements-ng/commit/932e3d92a3485296b95e1068080641f7c578858e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump svelte from 5.57.2 to 5.57.3

- [#615](https://github.com/pie-framework/pie-elements-ng/pull/615) [`ca4e017`](https://github.com/pie-framework/pie-elements-ng/commit/ca4e01737d08875caa6b334f0f596332a31be45e) Thanks [@chillenious](https://github.com/chillenious)! - chore: declare the MIT licence in every published manifest

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#682](https://github.com/pie-framework/pie-elements-ng/pull/682) [`7806af7`](https://github.com/pie-framework/pie-elements-ng/commit/7806af70d09cef106eaa4ba6900ecd2de5c4051f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump the tiptap group across 1 directory with 25 updates

- [#547](https://github.com/pie-framework/pie-elements-ng/pull/547) [`9072e7c`](https://github.com/pie-framework/pie-elements-ng/commit/9072e7cca26f08246c8f85984651f5b3cbad1a93) Thanks [@chillenious](https://github.com/chillenious)! - Typed responses compare through a shared normalizer: digits in any Unicode digit system match their ASCII form, `٫` and `٬` read as the content language's decimal and group marks, and bidi controls, tatweel and presentation forms no longer break a match. Simple-cloze and charting labels fold Turkish and Azerbaijani İ/ı correctly. ASCII responses score as before, except in Turkish and Azerbaijani content, where `I` folds to `ı` and so no longer matches `i`. `PieEnvironment` gains an optional `locale`, the item's content language, which an element's `model.language` overrides.

- [#636](https://github.com/pie-framework/pie-elements-ng/pull/636) [`34c758a`](https://github.com/pie-framework/pie-elements-ng/commit/34c758adb5604f03fa325ef221ac1f0c65766e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Declare `@pie-element/shared-i18n` as a dependency. The published type declarations import it, but it was listed only as a dev dependency.

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850) Thanks [@chillenious](https://github.com/chillenious)! - Ship the license and NOTICE texts of every bundled third-party package in `THIRD_PARTY_LICENSES.txt` files beside the build output that bundles it.
- Updated dependencies [[`0a4b2fc`](https://github.com/pie-framework/pie-elements-ng/commit/0a4b2fc8b89bf4929e582824ad196a82561aa1f0), [`37648bb`](https://github.com/pie-framework/pie-elements-ng/commit/37648bbd3f84acb84b61cc8df5cc32c41bd7f719), [`dda73a6`](https://github.com/pie-framework/pie-elements-ng/commit/dda73a6124deccb371b9b93ab9c515495e1e7f35), [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8), [`c9ddebe`](https://github.com/pie-framework/pie-elements-ng/commit/c9ddebe12ab58d1d1c98a27f09aeca7005464253), [`736ad4f`](https://github.com/pie-framework/pie-elements-ng/commit/736ad4fe6edf8a3fb5af17fe0adf0e936d1368ab), [`8f90c30`](https://github.com/pie-framework/pie-elements-ng/commit/8f90c30d2149d0070c660208729d0cb506ebdc26), [`3d364e6`](https://github.com/pie-framework/pie-elements-ng/commit/3d364e651386bd5ec5c03c0cbac9800dbed51ea8), [`6ac2b66`](https://github.com/pie-framework/pie-elements-ng/commit/6ac2b6616b4c49333cf0aee02d08d89b453a73cd), [`5479c19`](https://github.com/pie-framework/pie-elements-ng/commit/5479c19523118e69286e8dc8d142eb183edbdf2b), [`2867c08`](https://github.com/pie-framework/pie-elements-ng/commit/2867c082419e42a211067959be12d8e310403e2e), [`ba9faca`](https://github.com/pie-framework/pie-elements-ng/commit/ba9facaa40cce2266b5357e137f83108101f346d), [`1f9a93f`](https://github.com/pie-framework/pie-elements-ng/commit/1f9a93f3e43c01c1c30fc811152b87a601888fa3), [`811b988`](https://github.com/pie-framework/pie-elements-ng/commit/811b988459b787adc5efaf9fb020055e67c6dbad), [`5314efa`](https://github.com/pie-framework/pie-elements-ng/commit/5314efacd01cac72358aceaaf157ed60d7c511f0), [`37be6b8`](https://github.com/pie-framework/pie-elements-ng/commit/37be6b84f1a50dcf53f6df9dccce05fd58d54c60), [`d18d9e7`](https://github.com/pie-framework/pie-elements-ng/commit/d18d9e72bb88dc5911cbbd3dab7d314682536961), [`db48dfd`](https://github.com/pie-framework/pie-elements-ng/commit/db48dfd851ae4385d068a9f94cc092bdd05833d3), [`f408704`](https://github.com/pie-framework/pie-elements-ng/commit/f40870446d77da573bc46584f5ffaf497d255688), [`f6e8801`](https://github.com/pie-framework/pie-elements-ng/commit/f6e880189215966f224b93da5072cfa1e8d1b839), [`4689dfa`](https://github.com/pie-framework/pie-elements-ng/commit/4689dfac1e9d83296c77ef001eabfac58ef62d16), [`d895fde`](https://github.com/pie-framework/pie-elements-ng/commit/d895fdeb39499be8bfff64d7e6f26e647959e948), [`9072e7c`](https://github.com/pie-framework/pie-elements-ng/commit/9072e7cca26f08246c8f85984651f5b3cbad1a93), [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850), [`0fcf803`](https://github.com/pie-framework/pie-elements-ng/commit/0fcf8036fc88c44d4cb7b38181e99f7e21e0d2a2)]:
  - @pie-element/shared-controller-utils@0.1.5
  - @pie-element/shared-i18n@0.1.3
  - @pie-lib/delivery-events-svelte@0.2.3
  - @pie-element/shared-utils@0.1.7
  - @pie-element/shared-types@0.2.4

## 0.1.11

### Patch Changes

- [#496](https://github.com/pie-framework/pie-elements-ng/pull/496) [`c1d5a76`](https://github.com/pie-framework/pie-elements-ng/commit/c1d5a766f0af2a5eaa9a32012defce50a3608621) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump the tiptap group across 1 directory with 25 updates

- [#500](https://github.com/pie-framework/pie-elements-ng/pull/500) [`51273e5`](https://github.com/pie-framework/pie-elements-ng/commit/51273e5d86c2cd0729ce19009c642c2429c63b26) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @sveltejs/vite-plugin-svelte from 7.3.0 to 7.3.1

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

- [#511](https://github.com/pie-framework/pie-elements-ng/pull/511) [`4328ad0`](https://github.com/pie-framework/pie-elements-ng/commit/4328ad030d6893467230860b6eae2922b15d231e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump svelte from 5.57.1 to 5.57.2
- Updated dependencies [[`b0ec80f`](https://github.com/pie-framework/pie-elements-ng/commit/b0ec80f12fd27eb84f8622ed31edd5a5b09712a5), [`79d8b17`](https://github.com/pie-framework/pie-elements-ng/commit/79d8b17e6925cd8256a9b76caf99efbcfa53567f), [`0a16eb5`](https://github.com/pie-framework/pie-elements-ng/commit/0a16eb585bd48633b5ec7d81a8cc502a8002d3a9)]:
  - @pie-element/shared-utils@0.1.6
  - @pie-element/shared-types@0.2.3
  - @pie-lib/delivery-events-svelte@0.2.2

## 0.1.10

### Patch Changes

- Updated dependencies [[`306f0fd`](https://github.com/pie-framework/pie-elements-ng/commit/306f0fd281436a318a3c7b7d051e8bb65249b293), [`4d6379c`](https://github.com/pie-framework/pie-elements-ng/commit/4d6379cf5c32a6e89ba923cf167f125307d027e3), [`0ecc727`](https://github.com/pie-framework/pie-elements-ng/commit/0ecc727bcc895e989126c8f0fba4471eb41c0648)]:
  - @pie-element/shared-utils@0.1.5
  - @pie-element/shared-types@0.2.2

## 0.1.9

### Patch Changes

- [#462](https://github.com/pie-framework/pie-elements-ng/pull/462) [`444c24c`](https://github.com/pie-framework/pie-elements-ng/commit/444c24cc4443d6f5a570278a9473cfdf70ee4dfb) Thanks [@chillenious](https://github.com/chillenious)! - Every `./browser/*` module exports `piePackage`, a frozen `{ name, version }` naming the package it was built from, so a host that bundles the module registers it with `registerPreloadedElements` without restating the package and version it installed.
- Updated dependencies []:
  - @pie-lib/delivery-events-svelte@0.2.1

## 0.1.8

### Patch Changes

- [#429](https://github.com/pie-framework/pie-elements-ng/pull/429) [`7ca6fe6`](https://github.com/pie-framework/pie-elements-ng/commit/7ca6fe6735c2b9b95209b39221c6484ac282bbdf) Thanks [@chillenious](https://github.com/chillenious)! - Each element publishes JSON Schemas for its model and session, and for its authoring configuration when it has one, at `@pie-element/<name>/schemas/<kind>.schema.json`. The root entry exports the `<Name>Model`, `<Name>Session` and `<Name>Configuration` types they are generated from. `@pie-element/shared-types` adds the authoring building blocks those types share.

  `docs:generate` in `@pie-element/cli` documents each property from the element's schemas, with its defaults alongside. `@pie-element/shared-types` drops `PieDocsPropertyMetadata`, `PieDocsViewMetadata` and the `description` and `metadata` fields of `PieDocsViewContract`, which no element set.
- Updated dependencies [[`7ca6fe6`](https://github.com/pie-framework/pie-elements-ng/commit/7ca6fe6735c2b9b95209b39221c6484ac282bbdf)]:
  - @pie-element/shared-types@0.2.1
  - @pie-element/shared-utils@0.1.4

## 0.1.7

### Patch Changes

- Updated dependencies [[`b0fd8ee`](https://github.com/pie-framework/pie-elements-ng/commit/b0fd8ee4fd76fd3c3bd4c02276673e05965a5184), [`df25564`](https://github.com/pie-framework/pie-elements-ng/commit/df25564aa0a53f3f47b23a620a5fe4ab91c3f9f5)]:
  - @pie-element/shared-utils@0.1.3

## 0.1.6

### Patch Changes

- [#392](https://github.com/pie-framework/pie-elements-ng/pull/392) [`600bb62`](https://github.com/pie-framework/pie-elements-ng/commit/600bb62bb6913a232361372b84352e7623b08102) Thanks [@chillenious](https://github.com/chillenious)! - fix: sanitize element model HTML before it reaches the DOM
- Updated dependencies [[`0804268`](https://github.com/pie-framework/pie-elements-ng/commit/080426876dda8057c150dd4b2e08f5e0f00c45ec)]:
  - @pie-element/shared-utils@0.1.2

## 0.1.5

### Patch Changes

- [#322](https://github.com/pie-framework/pie-elements-ng/pull/322) [`a7f1bd9`](https://github.com/pie-framework/pie-elements-ng/commit/a7f1bd98f8d9e8ee018aa4b9441158650dd6c2b6) Thanks [@chillenious](https://github.com/chillenious)! - Content pasted or dropped from outside a PIE editor, such as from Word, Google Docs or a web page, keeps its paragraphs and line breaks and the formatting the editor's toolbar offers: bold, italics, underline, strikethrough, superscript and subscript, bulleted and numbered lists with their numbering, and tables with their captions and header scopes. Its fonts, sizes, colours, alignment, headings and links are dropped, and a list or table the toolbar does not offer pastes as lines of text. A host that wants plain-text pastes, as in the Slate editor, sets `pasteFormatting: { disabled: true }` in the React editor's `pluginProps`. Tables keep a `<caption>` and a header cell's `scope` through an edit. A spreadsheet range pasted over selected table cells fills them cell by cell. Content copied from a PIE editor keeps its formatting, math and response areas, and math copied from rendered PIE content stays math (PIE-1145).

- [#341](https://github.com/pie-framework/pie-elements-ng/pull/341) [`4f881e3`](https://github.com/pie-framework/pie-elements-ng/commit/4f881e3247d930284a790b149d01a6c766eeac40) Thanks [@chillenious](https://github.com/chillenious)! - The delivery views of mc-populated-blank, simple-cloze and venn-classification take their surfaces, ink, borders, show-correct-answer icon and feedback glyphs from the `--pie-*` theme, keeping the old colours as fallbacks. With no theme, the venn outside-region divider and tile tray border darken to #64748b and the tray's drop outline to #0284c7 to clear 3:1, and the mc-populated-blank listen button sits on a fixed white plate so its artwork stays legible on a dark page.

- [#347](https://github.com/pie-framework/pie-elements-ng/pull/347) [`f816178`](https://github.com/pie-framework/pie-elements-ng/commit/f81617840eb3e0d7b86c464df610e02bf834f7c5) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump the tiptap group across 1 directory with 25 updates

## 0.1.4

### Patch Changes

- [#33](https://github.com/pie-framework/pie-elements-ng/pull/33) [`33d27e0`](https://github.com/pie-framework/pie-elements-ng/commit/33d27e0e13954e986a4a7e8a45e7508f1628712b) Thanks [@chillenious](https://github.com/chillenious)! - define and enforce packaging contracts PIE-626

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`b82e87c`](https://github.com/pie-framework/pie-elements-ng/commit/b82e87c1bd6c138b3d88bdb69b12731795ba9297) Thanks [@chillenious](https://github.com/chillenious)! - Prepare all PIE element packages for the next prerelease patch wave

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`fbf3695`](https://github.com/pie-framework/pie-elements-ng/commit/fbf3695636c20afa6a31655c5f1a1d6ed130a374) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger the next prerelease patch for all PIE element packages.

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`d0f8d8e`](https://github.com/pie-framework/pie-elements-ng/commit/d0f8d8ead911f8c6256a4898a2f6b6863b7538ac) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger another prerelease patch for all PIE element packages.

- [#147](https://github.com/pie-framework/pie-elements-ng/pull/147) [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`85910c0`](https://github.com/pie-framework/pie-elements-ng/commit/85910c0c3681f7e1f063bd680dd0171954a62ce9) Thanks [@chillenious](https://github.com/chillenious)! - The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`3f989fb`](https://github.com/pie-framework/pie-elements-ng/commit/3f989fb4833beeddcd5e0aa6067f42b9cd1eb820) Thanks [@chillenious](https://github.com/chillenious)! - The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713) Thanks [@chillenious](https://github.com/chillenious)! - Leave the session's `element` to the player (PIE-1075).

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`41768bf`](https://github.com/pie-framework/pie-elements-ng/commit/41768bf7892ab0718ecde1fec3a43dd3147a90c9) Thanks [@chillenious](https://github.com/chillenious)! - Scoring, accessibility, styling and authoring fixes.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`b2d3248`](https://github.com/pie-framework/pie-elements-ng/commit/b2d3248a488d850e6afd3f6fa1263eb8d1779ba2) Thanks [@chillenious](https://github.com/chillenious)! - The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66) Thanks [@chillenious](https://github.com/chillenious)! - Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.

- [#156](https://github.com/pie-framework/pie-elements-ng/pull/156) [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

- [#179](https://github.com/pie-framework/pie-elements-ng/pull/179) [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52) Thanks [@chillenious](https://github.com/chillenious)! - `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

- [#182](https://github.com/pie-framework/pie-elements-ng/pull/182) [`e1b65e6`](https://github.com/pie-framework/pie-elements-ng/commit/e1b65e63d74f3fe52741fcface53c99e1f9ac0e7) Thanks [@chillenious](https://github.com/chillenious)! - The authoring view's Correct Answer field styles itself, so it keeps its layout and border in hosts that load no Tailwind or daisyUI.

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

- [#142](https://github.com/pie-framework/pie-elements-ng/pull/142) [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9) Thanks [@chillenious](https://github.com/chillenious)! - Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- [#184](https://github.com/pie-framework/pie-elements-ng/pull/184) [`d1e429c`](https://github.com/pie-framework/pie-elements-ng/commit/d1e429c4aaf484511d6ffad02dc5aaf60351fdd9) Thanks [@chillenious](https://github.com/chillenious)! - Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.

- [#184](https://github.com/pie-framework/pie-elements-ng/pull/184) [`76a901f`](https://github.com/pie-framework/pie-elements-ng/commit/76a901f1b32044be59e16b519e058929978c3cc1) Thanks [@chillenious](https://github.com/chillenious)! - Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies [[`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52)]:
  - @pie-lib/delivery-events-svelte@0.2.0

## 0.1.4-next.20

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

## 0.1.4-next.19

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

## 0.1.4-next.18

### Patch Changes

- define and enforce packaging contracts PIE-626
- Prepare all PIE element packages for the next prerelease patch wave
- Trigger the next prerelease patch for all PIE element packages.
- Trigger another prerelease patch for all PIE element packages.
- The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
- The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).
- The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).
- Leave the session's `element` to the player (PIE-1075).
- Scoring, accessibility, styling and authoring fixes.
- The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
- Take learner-facing strings from `@pie-lib/translator` in the item's `language`, as the React elements do. mc-populated-blank no longer reads `uiText`, and uses `locale` when `language` is unset.
- Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)
- `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
- The authoring view's Correct Answer field styles itself, so it keeps its layout and border in hosts that load no Tailwind or daisyUI.
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
- Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.
- Author elements take `configuration` as the React author elements do: an entry's `label` names its field and setting, `settings: true` offers the setting in a settings panel, and `settingsPanelDisabled` hides the panel. simple-cloze and venn-classification gain a teacher-instructions editor, and venn-classification's scoring policy moves into the panel.
- Author elements dispatch each edit as a bubbling `model.updated` from the element itself and keep the edit as the element's `model` across a detach and re-attach. venn-classification fills missing fields from its controller defaults, and mc-populated-blank's placeholder author view declares `model` and `configuration` and reports browser-ESM authoring unsupported.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-lib/delivery-events-svelte@0.2.0-next.5

## 0.1.4-next.17

### Patch Changes

- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6

## 0.1.4-next.16

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

## 0.1.4-next.15

### Patch Changes

- 8bd4fe2: Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

## 0.1.4-next.14

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

## 0.1.4-next.13

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

## 0.1.4-next.12

### Patch Changes

- c4e2ba3: Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

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
