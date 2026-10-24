---
"@pie-element/shared-controller-utils": patch
"@pie-element/shared-types": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/simple-cloze": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/charting": patch
---

Typed responses compare through a shared normalizer: digits in any Unicode digit system match their ASCII form, `٫` and `٬` read as the content language's decimal and group marks, and bidi controls, tatweel and presentation forms no longer break a match. Simple-cloze and charting labels fold Turkish and Azerbaijani İ/ı correctly. ASCII responses score as before, except in Turkish and Azerbaijani content, where `I` folds to `ı` and so no longer matches `i`. `PieEnvironment` gains an optional `locale`, the item's content language, which an element's `model.language` overrides.
