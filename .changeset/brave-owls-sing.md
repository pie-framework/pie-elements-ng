---
"@pie-element/passage": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/extended-text-entry": patch
"@pie-element/inline-dropdown": patch
"@pie-element/math-inline": patch
---

These five elements stop stamping `lang="en"` over items that declare no
language — on production that is most items, Spanish ones included, and the
claim makes a screen reader take English voice rules for content that names no
language (WCAG 3.1.2). An element now asserts the language the item declares,
canonicalized (`es_MX` stamps `es-MX`) with its direction, and removes the
stamp when the item declares none or declares a non-tag such as `Spanish` —
the rule `multiple-choice` and the shared `stampElementLanguage` already
follow. math-inline's `.player-container` stamp (PD-2483) applies the same
declared-only rule.
