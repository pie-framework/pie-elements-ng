---
"@pie-element/video-stimulus": patch
---

The video-stimulus author view's header, panels, buttons and text fields take `--pie-background` in place of `--pie-white`, so they turn dark under `pie-element-theme` dark instead of staying white under light text. Text fields are edged in `--pie-border-dark` so their borders hold 3:1 against the field, which renders them darker than before under light themes.
