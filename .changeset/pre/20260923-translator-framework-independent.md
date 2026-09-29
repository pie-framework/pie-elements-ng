---
"@pie-lib/translator": patch
"@pie-element/cli": patch
---

Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.
