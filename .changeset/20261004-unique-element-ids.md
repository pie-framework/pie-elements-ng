---
"@pie-element/categorize": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/ebsr": patch
"@pie-element/extended-text-entry": patch
"@pie-element/hotspot": patch
"@pie-element/image-cloze-association": patch
"@pie-element/math-templated": patch
"@pie-element/multi-trait-rubric": patch
"@pie-element/multiple-choice": patch
"@pie-lib/config-ui": patch
---

Two items on one page, and the two parts of an EBSR item, now render every DOM id once. The item container and the enable-audio prompt take generated ids and keep their `main-container` and `play-audio-info` classes, which the elements look them up by. EBSR marks its parts with `data-part`, math-templated marks its answer blocks with `data-answer-block`, and a categorize category carries its model id as `data-category-id`. The annotation editor, the multi-trait rubric menus, the choice feedback menu and the hotspot toolbar icons take generated ids. Authored CSS that selects `#main-container`, `#play-audio-info` or an EBSR part by `#a` or `#b` must select the class or `[data-part]` instead.
