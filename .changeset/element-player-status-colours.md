---
"@pie-element/element-player": patch
---

The player's loading message and error box take their colours from the `--pie-*` theme in place of DaisyUI 4 variables that DaisyUI 5 no longer defines. With no theme the error box now draws an `#ffebee` fill, an `#a65f00` border and black text, where it drew none.
