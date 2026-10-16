---
"@pie-element/multiple-choice": patch
---

Multiple-choice renders its interface strings from its own catalogs and no longer bundles i18next. Spanish loads on demand, except in the IIFE, which ships English only; an IIFE host serves Spanish through `registerMessages`. Its host carries `lang` and `dir` for the language the item declares and neither when it declares none, where it used to stamp `lang="en"`.
