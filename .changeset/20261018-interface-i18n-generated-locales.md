---
"@pie-element/multiple-choice": patch
"@pie-lib/render-ui": patch
"@pie-lib/correct-answer-toggle": patch
---

Ship eleven generated interface locales alongside the carried `es`: `th-TH`, `en-GB`, `en-AU`, `fr`, `ar`, `pt`, `ko`, `ja`, `zh`, `cy` and `sv`, completing the locale inventory pie-players ships. Each is machine-generated and unreviewed, recorded `generated` against the `en-US` hash in the package's `catalog-manifest.json`; Welsh and Arabic carry their full CLDR plural-category sets. Browser ESM splits each locale into a chunk fetched on first use, the IIFE stays English-only (a host serves any locale through `registerMessages`), and a webpack build of `./delivery` inlines the locale bytes without executing them on an English page. Until the interface-locale channel lands (Phase 2), element chrome reaches these locales only through `model.language`.
