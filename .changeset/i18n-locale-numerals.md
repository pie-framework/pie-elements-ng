---
"@pie-element/shared-i18n": patch
---

Numeric placeholder values now render through `Intl.NumberFormat` for the active locale, so digits and grouping follow CLDR locale defaults: `fr` groups with narrow no-break spaces, `en-US` with commas, and a regional Arabic locale such as `ar-SA` renders Arabic-Indic digits (current CLDR resolves bare `ar` to Western digits). Counts under 1,000 in Latin-script locales render exactly as before, and string values are untouched. `registerMessages` overrides are unaffected.
