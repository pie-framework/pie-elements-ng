# @pie-element/video-stimulus

## 0.1.8

### Patch Changes

- [#718](https://github.com/pie-framework/pie-elements-ng/pull/718) [`32d8334`](https://github.com/pie-framework/pie-elements-ng/commit/32d83340a0939d588bea7ab6297964ac68665821) Thanks [@chillenious](https://github.com/chillenious)! - chore: bump Kit, DaisyUI and Vite, share the IIFE and resolver configs, fix the dev:demo port lock
- Updated dependencies [[`5d5d6ab`](https://github.com/pie-framework/pie-elements-ng/commit/5d5d6abcdf7d12a03700d47d6744b404bd6187d3)]:
  - @pie-element/shared-i18n@0.1.4
  - @pie-element/shared-types@0.2.5
  - @pie-lib/delivery-events-svelte@0.2.4

## 0.1.7

### Patch Changes

- [#637](https://github.com/pie-framework/pie-elements-ng/pull/637) [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8) Thanks [@chillenious](https://github.com/chillenious)! - A host plural override of one category no longer throws or hides the shipped categories: each category resolves through host messages and catalogs in lookup order. Host messages registered for a regional or differently-cased tag (`es-MX`, `ES`) layer over the shipped catalog the request resolves to, which still loads and gates `isLocaleReady`. The last `setLocale` call wins over a slower earlier one, and `loadLocale`, `isLocaleReady` and `forLocale` treat a non-string argument as no locale.

  A translator's `getLocale()` and `getDirection()` name the locale its strings are served in, English for a locale nothing ships or whose catalog failed, and chrome roots stamp that locale through the new `chromeLanguageAttributes`. video-stimulus stamps its content `lang` canonicalized, and math-templated follows a switch back to a locale already loaded.

- [#633](https://github.com/pie-framework/pie-elements-ng/pull/633) [`736ad4f`](https://github.com/pie-framework/pie-elements-ng/commit/736ad4fe6edf8a3fb5af17fe0adf0e936d1368ab) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte elements' interface strings ship in fourteen interface languages and follow the interface locale a player publishes, else the item's declared language, else US English: the correct-answer and teacher-instructions toggles, status messages, blank and choice names, the Venn tray, region and tile names with their announcements, and the video's status messages and transcript controls. An element first renders once its language has loaded, so it shows no English frame first. The element keeps the item's declared language as its content `lang`, and stamps none for an item that declares none. A video stimulus with no declared language no longer reads as English, and its authored `uiText` overrides apply in every interface language.

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#570](https://github.com/pie-framework/pie-elements-ng/pull/570) [`0585bc2`](https://github.com/pie-framework/pie-elements-ng/commit/0585bc20bf7669c380e6a30e6f8816152063d514) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vitest from 4.1.11 to 5.0.5

- [#605](https://github.com/pie-framework/pie-elements-ng/pull/605) [`932e3d9`](https://github.com/pie-framework/pie-elements-ng/commit/932e3d92a3485296b95e1068080641f7c578858e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump svelte from 5.57.2 to 5.57.3

- [#641](https://github.com/pie-framework/pie-elements-ng/pull/641) [`6b3a398`](https://github.com/pie-framework/pie-elements-ng/commit/6b3a3987fe0b11cc885d75168622ccbfa85d5e44) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the test-dependencies group across 1 directory with 2 updates

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#636](https://github.com/pie-framework/pie-elements-ng/pull/636) [`34c758a`](https://github.com/pie-framework/pie-elements-ng/commit/34c758adb5604f03fa325ef221ac1f0c65766e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Declare `@pie-element/shared-i18n` as a dependency. The published type declarations import it, but it was listed only as a dev dependency.

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850) Thanks [@chillenious](https://github.com/chillenious)! - Ship the license and NOTICE texts of every bundled third-party package in `THIRD_PARTY_LICENSES.txt` files beside the build output that bundles it.
- Updated dependencies [[`dda73a6`](https://github.com/pie-framework/pie-elements-ng/commit/dda73a6124deccb371b9b93ab9c515495e1e7f35), [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8), [`c9ddebe`](https://github.com/pie-framework/pie-elements-ng/commit/c9ddebe12ab58d1d1c98a27f09aeca7005464253), [`736ad4f`](https://github.com/pie-framework/pie-elements-ng/commit/736ad4fe6edf8a3fb5af17fe0adf0e936d1368ab), [`3d364e6`](https://github.com/pie-framework/pie-elements-ng/commit/3d364e651386bd5ec5c03c0cbac9800dbed51ea8), [`6ac2b66`](https://github.com/pie-framework/pie-elements-ng/commit/6ac2b6616b4c49333cf0aee02d08d89b453a73cd), [`5479c19`](https://github.com/pie-framework/pie-elements-ng/commit/5479c19523118e69286e8dc8d142eb183edbdf2b), [`2867c08`](https://github.com/pie-framework/pie-elements-ng/commit/2867c082419e42a211067959be12d8e310403e2e), [`ba9faca`](https://github.com/pie-framework/pie-elements-ng/commit/ba9facaa40cce2266b5357e137f83108101f346d), [`1f9a93f`](https://github.com/pie-framework/pie-elements-ng/commit/1f9a93f3e43c01c1c30fc811152b87a601888fa3), [`5314efa`](https://github.com/pie-framework/pie-elements-ng/commit/5314efacd01cac72358aceaaf157ed60d7c511f0), [`37be6b8`](https://github.com/pie-framework/pie-elements-ng/commit/37be6b84f1a50dcf53f6df9dccce05fd58d54c60), [`d18d9e7`](https://github.com/pie-framework/pie-elements-ng/commit/d18d9e72bb88dc5911cbbd3dab7d314682536961), [`db48dfd`](https://github.com/pie-framework/pie-elements-ng/commit/db48dfd851ae4385d068a9f94cc092bdd05833d3), [`f408704`](https://github.com/pie-framework/pie-elements-ng/commit/f40870446d77da573bc46584f5ffaf497d255688), [`f6e8801`](https://github.com/pie-framework/pie-elements-ng/commit/f6e880189215966f224b93da5072cfa1e8d1b839), [`4689dfa`](https://github.com/pie-framework/pie-elements-ng/commit/4689dfac1e9d83296c77ef001eabfac58ef62d16), [`d895fde`](https://github.com/pie-framework/pie-elements-ng/commit/d895fdeb39499be8bfff64d7e6f26e647959e948), [`9072e7c`](https://github.com/pie-framework/pie-elements-ng/commit/9072e7cca26f08246c8f85984651f5b3cbad1a93), [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850)]:
  - @pie-element/shared-i18n@0.1.3
  - @pie-lib/delivery-events-svelte@0.2.3
  - @pie-element/shared-types@0.2.4

## 0.1.6

### Patch Changes

- [#500](https://github.com/pie-framework/pie-elements-ng/pull/500) [`51273e5`](https://github.com/pie-framework/pie-elements-ng/commit/51273e5d86c2cd0729ce19009c642c2429c63b26) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @sveltejs/vite-plugin-svelte from 7.3.0 to 7.3.1

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

- [#511](https://github.com/pie-framework/pie-elements-ng/pull/511) [`4328ad0`](https://github.com/pie-framework/pie-elements-ng/commit/4328ad030d6893467230860b6eae2922b15d231e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump svelte from 5.57.1 to 5.57.2
- Updated dependencies [[`0a16eb5`](https://github.com/pie-framework/pie-elements-ng/commit/0a16eb585bd48633b5ec7d81a8cc502a8002d3a9)]:
  - @pie-element/shared-types@0.2.3
  - @pie-lib/delivery-events-svelte@0.2.2

## 0.1.5

### Patch Changes

- Updated dependencies [[`4d6379c`](https://github.com/pie-framework/pie-elements-ng/commit/4d6379cf5c32a6e89ba923cf167f125307d027e3)]:
  - @pie-element/shared-types@0.2.2

## 0.1.4

### Patch Changes

- [#462](https://github.com/pie-framework/pie-elements-ng/pull/462) [`444c24c`](https://github.com/pie-framework/pie-elements-ng/commit/444c24cc4443d6f5a570278a9473cfdf70ee4dfb) Thanks [@chillenious](https://github.com/chillenious)! - Every `./browser/*` module exports `piePackage`, a frozen `{ name, version }` naming the package it was built from, so a host that bundles the module registers it with `registerPreloadedElements` without restating the package and version it installed.
- Updated dependencies []:
  - @pie-lib/delivery-events-svelte@0.2.1

## 0.1.3

### Patch Changes

- [#429](https://github.com/pie-framework/pie-elements-ng/pull/429) [`7ca6fe6`](https://github.com/pie-framework/pie-elements-ng/commit/7ca6fe6735c2b9b95209b39221c6484ac282bbdf) Thanks [@chillenious](https://github.com/chillenious)! - Each element publishes JSON Schemas for its model and session, and for its authoring configuration when it has one, at `@pie-element/<name>/schemas/<kind>.schema.json`. The root entry exports the `<Name>Model`, `<Name>Session` and `<Name>Configuration` types they are generated from. `@pie-element/shared-types` adds the authoring building blocks those types share.

  `docs:generate` in `@pie-element/cli` documents each property from the element's schemas, with its defaults alongside. `@pie-element/shared-types` drops `PieDocsPropertyMetadata`, `PieDocsViewMetadata` and the `description` and `metadata` fields of `PieDocsViewContract`, which no element set.
- Updated dependencies [[`7ca6fe6`](https://github.com/pie-framework/pie-elements-ng/commit/7ca6fe6735c2b9b95209b39221c6484ac282bbdf)]:
  - @pie-element/shared-types@0.2.1

## 0.1.2

### Patch Changes

- [#328](https://github.com/pie-framework/pie-elements-ng/pull/328) [`2405ee9`](https://github.com/pie-framework/pie-elements-ng/commit/2405ee9b4c97246caf8c8df342b7639fe789de5c) Thanks [@chillenious](https://github.com/chillenious)! - The extended-text-entry annotation menu has a [#757575](https://github.com/pie-framework/pie-elements-ng/issues/757575) outline and pointer, and the freeform annotation editor keeps its green or pink band between two [#757575](https://github.com/pie-framework/pie-elements-ng/issues/757575) rings, so both meet 3:1 against the annotation colours, the page and the menu in every theme. The math toolbar's Done check is a darker green (#388E3C) that meets 3:1 on the toolbar, on white and under the dark theme, and the editor toolbar's Done check takes the same green unless a host sets `--editable-html-toolbar-check`. The video transcript toggle's border takes the text colour, and with no theme applied the toggle and the video retry button now show a border in the surrounding text colour.

- [#272](https://github.com/pie-framework/pie-elements-ng/pull/272) [`5a2ad38`](https://github.com/pie-framework/pie-elements-ng/commit/5a2ad382a7e1b91be55210bb607488c01d6bb840) Thanks [@chillenious](https://github.com/chillenious)! - fix(video-stimulus): drop the assessment toolkit dependency

- [#316](https://github.com/pie-framework/pie-elements-ng/pull/316) [`c1ce388`](https://github.com/pie-framework/pie-elements-ng/commit/c1ce388d0736ba88302157936f7808783d6f0ced) Thanks [@chillenious](https://github.com/chillenious)! - fix(theming): follow the theme background on answer slots, legends and media buttons

## 0.1.1

### Patch Changes

- [#169](https://github.com/pie-framework/pie-elements-ng/pull/169) [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735) Thanks [@chillenious](https://github.com/chillenious)! - Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.
- Updated dependencies [[`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43), [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021), [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c), [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735)]:
  - @pie-element/shared-types@0.2.0
  - @pie-lib/delivery-events-svelte@0.2.0

## 0.1.1-next.1

### Patch Changes

- Updated dependencies [3e49e88]
  - @pie-element/shared-types@0.2.0-next.5

## 0.1.1-next.0

### Patch Changes

- 4ffda53: Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.
- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4
