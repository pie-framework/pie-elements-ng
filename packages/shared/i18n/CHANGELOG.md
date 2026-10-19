# @pie-element/shared-i18n

## 0.1.1

### Patch Changes

- [#475](https://github.com/pie-framework/pie-elements-ng/pull/475) [`d6b12ad`](https://github.com/pie-framework/pie-elements-ng/commit/d6b12ad98e8c9417588803b1cfaaed60dcebd18d) Thanks [@chillenious](https://github.com/chillenious)! - Add `@pie-element/shared-i18n`: per-package interface-string catalogs with `en-US` bundled and every other locale loaded on demand, and `registerMessages`, through which a host renames a string or serves a locale no package ships.

- [#482](https://github.com/pie-framework/pie-elements-ng/pull/482) [`6f14e54`](https://github.com/pie-framework/pie-elements-ng/commit/6f14e54211250dd1180d4c687a0057c7a7e60a20) Thanks [@chillenious](https://github.com/chillenious)! - Numeric placeholder values now render through `Intl.NumberFormat` for the active locale, so digits and grouping follow CLDR locale defaults: `fr` groups with narrow no-break spaces, `en-US` with commas, and a regional Arabic locale such as `ar-SA` renders Arabic-Indic digits (current CLDR resolves bare `ar` to Western digits). Counts under 1,000 in Latin-script locales render exactly as before, and string values are untouched. `registerMessages` overrides are unaffected.
