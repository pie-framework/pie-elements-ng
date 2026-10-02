---
"@pie-lib/editable-html-tip-tap": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

Rich text pasted or dropped from outside a PIE editor, such as from Word or Google Docs, arrives as plain text, as it did in the Slate editor: its fonts, colours, alignment, bold, italics, lists and tables are dropped. A spreadsheet range pasted over selected table cells fills them value by value. Content copied from a PIE editor keeps its formatting, math and response areas, and math copied from rendered PIE content stays math (PIE-1145).
