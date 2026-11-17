---
"@pie-element/math-inline": patch
---

Theme the evaluate-mode tooltip (the show correct answer toggle, teacher instructions, note, rationale and feedback). It now renders inside the element rather than at the end of the page, so it follows the host's color scheme, and it paints the theme's raised surface (`--pie-surface`) with `--pie-text` and a `--pie-border-dark` frame instead of a fixed purple with a pink border. The Show/Hide links keep the `--pie-tertiary` link color, and the toggle no longer sits on a page-background box.
