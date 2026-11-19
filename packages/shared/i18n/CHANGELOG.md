# @pie-element/shared-i18n

## 0.1.3

### Patch Changes

- [#635](https://github.com/pie-framework/pie-elements-ng/pull/635) [`dda73a6`](https://github.com/pie-framework/pie-elements-ng/commit/dda73a6124deccb371b9b93ab9c515495e1e7f35) Thanks [@chillenious](https://github.com/chillenious)! - complex-rubric passes the item's `language` to its embedded rubric unless that rubric declares its own. `@pie-element/shared-i18n` exports `authoredOrDefault`, which the alternates notes now share; a stored default with non-breaking spaces also counts as no note. `ConstructedResponse` in `@pie-lib/mask-markup` names its blanks in `language` and marks their text in the new `contentLanguage`, so explicit-constructed-response's blank names follow the interface locale. `@pie-lib/editable-html-tip-tap` labels its toolbar in the published interface locale, else its `language`.

- [#637](https://github.com/pie-framework/pie-elements-ng/pull/637) [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8) Thanks [@chillenious](https://github.com/chillenious)! - A host plural override of one category no longer throws or hides the shipped categories: each category resolves through host messages and catalogs in lookup order. Host messages registered for a regional or differently-cased tag (`es-MX`, `ES`) layer over the shipped catalog the request resolves to, which still loads and gates `isLocaleReady`. The last `setLocale` call wins over a slower earlier one, and `loadLocale`, `isLocaleReady` and `forLocale` treat a non-string argument as no locale.

  A translator's `getLocale()` and `getDirection()` name the locale its strings are served in, English for a locale nothing ships or whose catalog failed, and chrome roots stamp that locale through the new `chromeLanguageAttributes`. video-stimulus stamps its content `lang` canonicalized, and math-templated follows a switch back to a locale already loaded.

- [#548](https://github.com/pie-framework/pie-elements-ng/pull/548) [`c9ddebe`](https://github.com/pie-framework/pie-elements-ng/commit/c9ddebe12ab58d1d1c98a27f09aeca7005464253) Thanks [@chillenious](https://github.com/chillenious)! - Locale resolution stays within the requested script. `zh-TW` and `zh-HK` reach a `zh-Hant` catalog, and render English when only the Simplified `zh` ships; `sr-ME` reaches `sr-Latn` and skips the Cyrillic `sr`. A request whose script matches resolves as before.

- [#564](https://github.com/pie-framework/pie-elements-ng/pull/564) [`3d364e6`](https://github.com/pie-framework/pie-elements-ng/commit/3d364e651386bd5ec5c03c0cbac9800dbed51ea8) Thanks [@chillenious](https://github.com/chillenious)! - `interfaceLocaleContext` and `InterfaceLocaleContextValue` come from `@pie-players/pie-context` 1.0.0-beta.6, which now publishes them, in place of a local copy on the same `Symbol.for` key.

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#570](https://github.com/pie-framework/pie-elements-ng/pull/570) [`0585bc2`](https://github.com/pie-framework/pie-elements-ng/commit/0585bc20bf7669c380e6a30e6f8816152063d514) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vitest from 4.1.11 to 5.0.5

- [#603](https://github.com/pie-framework/pie-elements-ng/pull/603) [`c0d40a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d40a001058f0051e7e557b1f1da8ba217233e5) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump @pie-players/pie-context from 1.0.0-beta.6 to 1.0.0-beta.7

- [#628](https://github.com/pie-framework/pie-elements-ng/pull/628) [`70b7343`](https://github.com/pie-framework/pie-elements-ng/commit/70b7343bb8bae491e1b7219509f203b788915ff4) Thanks [@chillenious](https://github.com/chillenious)! - docs(i18n): keep the declared-language fallback for interface chrome permanently

- [#638](https://github.com/pie-framework/pie-elements-ng/pull/638) [`2d26dea`](https://github.com/pie-framework/pie-elements-ng/commit/2d26dea8459af2c542d4709885565a83d604a9d2) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @biomejs/biome from 2.6.4 to 2.6.6 in the dev-dependencies group across 1 directory

- [#641](https://github.com/pie-framework/pie-elements-ng/pull/641) [`6b3a398`](https://github.com/pie-framework/pie-elements-ng/commit/6b3a3987fe0b11cc885d75168622ccbfa85d5e44) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the test-dependencies group across 1 directory with 2 updates

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#687](https://github.com/pie-framework/pie-elements-ng/pull/687) [`e0e39b7`](https://github.com/pie-framework/pie-elements-ng/commit/e0e39b73edc6cbe89afa07d222bf8db3236e1e38) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump @pie-players/pie-context from 1.0.0-beta.7 to 1.0.0-beta.10

- [#661](https://github.com/pie-framework/pie-elements-ng/pull/661) [`d895fde`](https://github.com/pie-framework/pie-elements-ng/commit/d895fdeb39499be8bfff64d7e6f26e647959e948) Thanks [@chillenious](https://github.com/chillenious)! - The engine imports its language-tag code and the conformance spec from `@pie-players/pie-language-tags`, the package pie-players' engine uses, so a request carrying variant subtags (`de-CH-1996`) now widens only to a sibling catalog with the same variants, as pie-players does, and otherwise renders English.

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850) Thanks [@chillenious](https://github.com/chillenious)! - Ship the license and NOTICE texts of every bundled third-party package in `THIRD_PARTY_LICENSES.txt` files beside the build output that bundles it.

## 0.1.2

### Patch Changes

- [#487](https://github.com/pie-framework/pie-elements-ng/pull/487) [`5566524`](https://github.com/pie-framework/pie-elements-ng/commit/55665241c2ab33e8e7b659801d36edb7b78aa62b) Thanks [@chillenious](https://github.com/chillenious)! - Adds the interface-locale subscriber: `subscribeInterfaceLocale(element, onLocale)` resolves
  `pie.interfaceLocale` — the composition context the item and section players answer from their
  `locale` attribute — with the document-root retry, so an element mounted before its player's
  provider connects is answered when it announces itself. With no player the callback never fires
  and the caller keeps its fallback. The key is built with pie-context's own factory on the shared
  `Symbol.for` registration; the constant becomes the package import when the pinned
  `@pie-players/pie-context` ships `interfaceLocaleContext`.

- [#491](https://github.com/pie-framework/pie-elements-ng/pull/491) [`14e6adc`](https://github.com/pie-framework/pie-elements-ng/commit/14e6adcb7caecb4d746d575927fdeaeb7c84e2f2) Thanks [@chillenious](https://github.com/chillenious)! - test(i18n): the cross-repository conformance spec

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

## 0.1.1

### Patch Changes

- [#475](https://github.com/pie-framework/pie-elements-ng/pull/475) [`d6b12ad`](https://github.com/pie-framework/pie-elements-ng/commit/d6b12ad98e8c9417588803b1cfaaed60dcebd18d) Thanks [@chillenious](https://github.com/chillenious)! - Add `@pie-element/shared-i18n`: per-package interface-string catalogs with `en-US` bundled and every other locale loaded on demand, and `registerMessages`, through which a host renames a string or serves a locale no package ships.

- [#482](https://github.com/pie-framework/pie-elements-ng/pull/482) [`6f14e54`](https://github.com/pie-framework/pie-elements-ng/commit/6f14e54211250dd1180d4c687a0057c7a7e60a20) Thanks [@chillenious](https://github.com/chillenious)! - Numeric placeholder values now render through `Intl.NumberFormat` for the active locale, so digits and grouping follow CLDR locale defaults: `fr` groups with narrow no-break spaces, `en-US` with commas, and a regional Arabic locale such as `ar-SA` renders Arabic-Indic digits (current CLDR resolves bare `ar` to Western digits). Counts under 1,000 in Latin-script locales render exactly as before, and string values are untouched. `registerMessages` overrides are unaffected.
