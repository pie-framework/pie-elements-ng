---
"@pie-lib/editable-html-tip-tap": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

Content pasted or dropped from outside a PIE editor, such as from Word, Google Docs or a web page, keeps its paragraphs and line breaks and the formatting the editor's toolbar offers: bold, italics, underline, strikethrough, superscript and subscript, bulleted and numbered lists with their numbering, and tables with their captions and header scopes. Its fonts, sizes, colours, alignment, headings and links are dropped, and a list or table the toolbar does not offer pastes as lines of text. A host that wants plain-text pastes, as in the Slate editor, sets `pasteFormatting: { disabled: true }` in the React editor's `pluginProps`. Tables keep a `<caption>` and a header cell's `scope` through an edit. A spreadsheet range pasted over selected table cells fills them cell by cell. Content copied from a PIE editor keeps its formatting, math and response areas, and math copied from rendered PIE content stays math (PIE-1145).
