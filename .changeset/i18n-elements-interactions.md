---
"@pie-element/select-text": patch
"@pie-element/match": patch
"@pie-element/drawing-response": patch
"@pie-element/hotspot": patch
"@pie-element/placement-ordering": patch
"@pie-element/categorize": patch
"@pie-element/graphing": patch
"@pie-element/image-cloze-association": patch
"@pie-element/charting": patch
---

These elements' interface text follows the interface locale a player publishes, else the item's `language`, in fourteen languages, and an element stamps `lang` and `dir` only when the item declares a language. Text that rendered in English whatever the language now translates: match's empty-grid message, placement-ordering's drag instructions for screen readers, and drawing-response's error message. The alternates note shows in the interface locale unless the item carries an authored note; a stored copy of the default note counts as no note. drawing-response's color selects no longer set a translated color name, which no browser can paint, as the drawing color.
