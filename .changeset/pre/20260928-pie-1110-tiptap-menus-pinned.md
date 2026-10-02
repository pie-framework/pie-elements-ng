---
"@pie-lib/editable-html-tip-tap": patch
"@pie-element/cli": patch
---

Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).
