---
"@pie-element/shared-math-rendering-mathjax": patch
"@pie-element/element-player": patch
---

The MathJax speech worker now starts on Safari. WebKit loads a `blob:` worker's script asynchronously, so the URL revocation that MathJax's adaptor and the adapter's browser build performed synchronously after `new Worker` killed the worker before it could load: speech, braille and the explorer stayed off for every Safari student. Both paths now hold the revocation until the worker signals that it started or failed, and release after a grace period otherwise. The element loader keeps the local-ESM dynamic import free of `@vite-ignore`, restoring the intent of 2611a1fe that 2e73a457 had clobbered, so Vite dev servers keep resolving workspace element specifiers.
