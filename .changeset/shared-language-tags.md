---
"@pie-element/shared-i18n": patch
---

The engine imports its language-tag code and the conformance spec from `@pie-players/pie-language-tags`, the package pie-players' engine uses, so a request carrying variant subtags (`de-CH-1996`) now widens only to a sibling catalog with the same variants, as pie-players does, and otherwise renders English.
