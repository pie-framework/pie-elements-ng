---
"@pie-element/shared-i18n": patch
"@pie-lib/correct-answer-toggle": patch
"@pie-element/simple-cloze": patch
"@pie-element/mc-populated-blank": patch
"@pie-element/venn-classification": patch
"@pie-element/video-stimulus": patch
"@pie-element/math-templated": patch
---

A host plural override of one category no longer throws or hides the shipped categories: each category resolves through host messages and catalogs in lookup order. Host messages registered for a regional or differently-cased tag (`es-MX`, `ES`) layer over the shipped catalog the request resolves to, which still loads and gates `isLocaleReady`. The last `setLocale` call wins over a slower earlier one, and `loadLocale`, `isLocaleReady` and `forLocale` treat a non-string argument as no locale.

A translator's `getLocale()` and `getDirection()` name the locale its strings are served in, English for a locale nothing ships or whose catalog failed, and chrome roots stamp that locale through the new `chromeLanguageAttributes`. video-stimulus stamps its content `lang` canonicalized, and math-templated follows a switch back to a locale already loaded.
