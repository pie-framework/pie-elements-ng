---
"@pie-element/element-bundler": patch
---

Subpath imports of `@pie-lib/math-rendering` and `@pie-lib/pie-toolbox`, and imports of packages whose names begin with theirs, such as `@pie-lib/math-rendering-accessible`, bundle from `node_modules`; the two packages themselves stay external.
