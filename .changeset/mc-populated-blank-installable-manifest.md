---
'@pie-element/mc-populated-blank': patch
---

Republish with no `devDependencies` in the manifest, so the production bundler can install
this element.

`pie-api-aws` extracts each element tarball as a yarn workspace member, and yarn installs
workspace members' devDependencies. This element's manifest pinned
`@pie-lib/delivery-events-svelte@0.1.0`, a workspace package that is versioned but never
published, so the install failed before webpack ran and no bundle containing this element
could be built.
