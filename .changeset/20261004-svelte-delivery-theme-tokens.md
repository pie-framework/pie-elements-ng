---
"@pie-element/mc-populated-blank": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

The delivery views of mc-populated-blank, simple-cloze and venn-classification take their surfaces, ink, borders, show-correct-answer icon and feedback glyphs from the `--pie-*` theme, keeping the old colours as fallbacks. With no theme, the venn outside-region divider and tile tray border darken to #64748b and the tray's drop outline to #0284c7 to clear 3:1, and the mc-populated-blank listen button sits on a fixed white plate so its artwork stays legible on a dark page.
