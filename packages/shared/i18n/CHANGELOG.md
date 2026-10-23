# @pie-element/shared-i18n

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
