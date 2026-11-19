---
"@pie-element/multiple-choice": patch
---

Fill the whole choice with its authored selected or hover background. The row, the input holder and the label painted `--pie-background` over it, which is opaque under every PIE theme, so the colour showed only as a frame around a white box, or a black one under white-on-black. Under a colour scheme the authored fill now folds into the scheme's recessed surface and the authored stroke into its text colour, through `--pie-fixed-hue-collapse`; under a Base Theme both render as authored.
