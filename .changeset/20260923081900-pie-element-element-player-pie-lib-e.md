---
  "@pie-element/element-player": patch
  "@pie-lib/editable-html-tip-tap": patch
  "@pie-element/simple-cloze": patch
  "@pie-element/venn-classification": patch
---

Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"), and drops the unused @tiptap/starter-kit from element-player, which was the entry point for the extra core copy (PIE-1042)
