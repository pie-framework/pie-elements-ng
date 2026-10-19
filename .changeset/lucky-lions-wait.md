---
"@pie-lib/correct-answer-toggle": patch
---

The toggle stamps `lang` and `dir` from its `language` prop on its root, so the label is
announced in the language it renders in — an element's chrome locale — and removes both when no
language is passed, as the elements' content stamping already does.
