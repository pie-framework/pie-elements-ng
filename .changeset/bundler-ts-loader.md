---
"@pie-element/element-bundler": patch
---

Compile `.ts` files with esbuild's `ts` loader instead of `tsx`, so a generic arrow function such as `<T>(x) => x` no longer fails to parse and break the bundle.
