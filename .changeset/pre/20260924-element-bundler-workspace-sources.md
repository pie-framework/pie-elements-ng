---
"@pie-element/element-bundler": patch
---

`workspace-fast` builds bundle every workspace package from its sources, so no element, shared or `@pie-lib` package needs building first and an edited element bundles its current source. Workspace packages are linked by package name, and Svelte components compile with `customElement` as the elements' own builds do.
