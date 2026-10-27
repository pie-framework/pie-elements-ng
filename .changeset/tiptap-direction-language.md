---
"@pie-lib/editable-html-tip-tap": patch
"@pie-lib/translator": patch
---

The TipTap editor writes paragraph `dir` and span `lang`, and its text box carries the `lang` and `dir` of the `language` prop. A paragraph the author edits whose script runs against that direction, such as an Arabic sentence in an English field, is saved with its own `dir`; content in one direction saves as before. Alignment offers start, center, end and justify, reads saved `left` and `right` by the block's direction, and its toolbar labels are localized. `languageCharacters: [{ language: 'arabic' }]` adds an Arabic character set with Arabic-Indic digits and the RLM, LRM and ALM marks.

When the field's `language` and the interface locale a player publishes are different written languages, the toolbar offers a text-language control that marks the selection with either one as a `lang` span. The paragraph direction buttons are opt-in through `activePlugins` or `pluginProps.textDirection.disabled: false`, and right-to-left fields show them unless `pluginProps.textDirection.disabled` is set.
