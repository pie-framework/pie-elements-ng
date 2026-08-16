---
"@pie-element/passage": patch
---

The paired-passage tabs follow the active theme and color scheme. Tab fill, tab ink and the
selection indicator resolve through `--pie-background` / `--pie-text` instead of MUI's
palette, so they no longer stay white with black ink over a dark passage body, and the tab
outline and the strip's bottom rule move to `--pie-border-gray`, which holds the 3:1
non-text minimum on every scheme where the previous `#D9DADA` measured about 1.2:1. A host
that sets `--pie-passage-header-background` keeps its own strip colour unchanged; only the
default, previously a white literal, now follows the theme.
