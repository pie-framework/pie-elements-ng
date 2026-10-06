---
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-lib/math-toolbar": patch
---

The math-inline and math-templated authoring Correct Answer card follows the theme: its fill is `--pie-background` and its text, labels and select read `--pie-text`, so under a dark preset the card darkens with the page instead of staying white behind the dark editor and keypad. With no theme the card stays white. Its validation messages take `--pie-incorrect-icon` instead of MUI's fixed red, which fell below 4.5:1 on dark backgrounds. The math-toolbar Done check now takes the theme's correct-icon colour (`--pie-correct-icon`) and clears 3:1 (WCAG 1.4.11) on the card and on the editable-html toolbar fill under every preset and colour scheme.
