---
"@pie-lib/text-select": patch
"@pie-lib/render-ui": patch
"@pie-element/shared-theming": patch
---

Draw hovered, selected and scored select-text tokens in the page's own ink
(`--pie-text`) instead of black. pie-theme chooses the hover fill
(`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
(`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.

The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
own ink stays over 4.5:1 on the hover fill.
