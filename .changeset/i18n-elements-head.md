---
"@pie-element/extended-text-entry": patch
"@pie-element/rubric": patch
"@pie-element/explicit-constructed-response": patch
"@pie-element/inline-dropdown": patch
"@pie-element/math-inline": patch
"@pie-element/ebsr": patch
"@pie-element/drag-in-the-blank": patch
---

These elements' interface text follows the interface locale a player publishes, else the item's `language`, in fourteen languages, and an element stamps `lang` and `dir` only when the item declares a language. ebsr reads the declared language from part A when the item sets none, and both parts, including a part that declares no language, follow the same locale. Text that rendered in English whatever the language now translates: rubric's point counts and sample-answer heading, the editor's accessible name and the annotation buttons in extended-text-entry, and math-inline's note label. The alternates note in explicit-constructed-response and math-inline shows in the interface locale unless the item carries an authored note; a stored copy of the default note counts as no note, and math-inline no longer shows its note label twice.
