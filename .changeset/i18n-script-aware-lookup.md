---
"@pie-element/shared-i18n": patch
---

Locale resolution stays within the requested script. `zh-TW` and `zh-HK` reach a `zh-Hant` catalog, and render English when only the Simplified `zh` ships; `sr-ME` reaches `sr-Latn` and skips the Cyrillic `sr`. A request whose script matches resolves as before.
