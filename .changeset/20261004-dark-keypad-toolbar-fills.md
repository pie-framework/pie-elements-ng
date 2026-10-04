---
"@pie-lib/render-ui": patch
"@pie-lib/math-input": patch
"@pie-lib/editable-html-tip-tap": patch
---

Math keypad keys and the editable-html formatting toolbars mix their fill into the theme background (`--pie-background`), so under a dark theme they darken with it and keep the theme's light text legible, with operator keys still a distinct hue from number keys. A key's press and focus ripple darkens under a dark theme too. Over a white background, or with no theme, the fills are the same colours as before.
