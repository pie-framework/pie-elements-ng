# @pie-element/cli

## 0.1.2-next.0

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- Updated dependencies [8d69fb5]
  - @pie-element/element-bundler@0.1.2-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [e131840]
  - @pie-element/element-bundler@0.1.1
