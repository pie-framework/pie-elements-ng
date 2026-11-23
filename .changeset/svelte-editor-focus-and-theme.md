---
"@pie-lib/editable-html-tiptap-svelte": patch
"@pie-lib/config-ui-svelte": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

The rich-text editor's toolbar buttons and text box, and the settings panel's switches and radios, draw a 2px keyboard focus ring from the `--pie-*` focus tokens (`#1565c0` with no theme, where the settings panel drew `#1a73e8` and the toolbar none). Enabled toolbar icons take 80% `--pie-text`, which holds 3:1 on the toolbar under every pie-players scheme and is darker than the old grey with no theme, and full `--pie-text` on hover; disabled icons keep `--pie-disabled`. The editor's frame, toolbar, menus, code, tables, cell selection and placeholder follow the colour scheme and keep their colours with no theme; under a theme the frame takes `--pie-border-dark`.
