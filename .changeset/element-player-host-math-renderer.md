---
"@pie-element/element-player": patch
---

`pie-element-player` renders math with a renderer the page installed at `window['@pie-lib/math-rendering']` before the player mounted, such as a MathJax 3 one, and then loads no MathJax 4. Without one it installs its MathJax 4 renderer as before.
