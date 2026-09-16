# @pie-element/element-bundler

## 0.1.2-next.0

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.1

### Rename and Scope Notes

- e131840: Prepare the player and bundler packages for the next publish cycle.
  Includes release updates for `element-player`, `print-player`, and `bundler-shared`.

## 0.1.2

### Patch Changes

- Renamed package from `@pie-element/bundler-shared` to `@pie-element/element-bundler`.
- Clarified scope: this package currently produces IIFE bundles and is not required for ESM bundle workflows.
