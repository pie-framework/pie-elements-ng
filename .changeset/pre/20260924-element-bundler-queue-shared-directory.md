---
"@pie-element/element-bundler": patch
---

Builds of the same dependencies for different bundles, such as separate `editor` and `client-player` requests, run one after another, because they install into and write to the same directory.
