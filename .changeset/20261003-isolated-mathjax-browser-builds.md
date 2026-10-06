---
"@pie-element/shared-math-rendering-mathjax": patch
---

Element browser builds typeset math on a MathJax 4.1.3 of their own, bundled through the new `pie-browser-esm` export condition, and leave `window.MathJax` to the host page, so a host's MathJax of any version runs beside them. Their menu leaves out SVG output and collapsible math, `\require` is unsupported, and `srcUrl` is ignored. Element npm entries keep loading MathJax into the page.
