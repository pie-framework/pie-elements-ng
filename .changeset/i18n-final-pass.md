---
"@pie-element/shared-i18n": patch
"@pie-element/complex-rubric": patch
"@pie-element/categorize": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/placement-ordering": patch
"@pie-lib/mask-markup": patch
"@pie-lib/editable-html-tip-tap": patch
---

complex-rubric passes the item's `language` to its embedded rubric unless that rubric declares its own. `@pie-element/shared-i18n` exports `authoredOrDefault`, which the alternates notes now share; a stored default with non-breaking spaces also counts as no note. `ConstructedResponse` in `@pie-lib/mask-markup` names its blanks in `language` and marks their text in the new `contentLanguage`, so explicit-constructed-response's blank names follow the interface locale. `@pie-lib/editable-html-tip-tap` labels its toolbar in the published interface locale, else its `language`.
