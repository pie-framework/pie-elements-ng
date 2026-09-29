---
  "@pie-lib/charting": patch
  "@pie-lib/render-ui": patch
  "@pie-element/shared-theming": patch
---

Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)

`@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
`#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
themes. Charting's disabled tick labels took two different colors: the MathJax fraction
variant used the `disabled` grey, while the plain-text variant fell through to the
browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
normal text, and fraction numerals render smaller still.
