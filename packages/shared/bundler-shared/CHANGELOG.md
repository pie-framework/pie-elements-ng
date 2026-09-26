# @pie-element/element-bundler

## 0.1.2-next.3

### Patch Changes

- 06c1926: Subpath imports of `@pie-lib/math-rendering` and `@pie-lib/pie-toolbox`, and imports of packages whose names begin with theirs, such as `@pie-lib/math-rendering-accessible`, bundle from `node_modules`; the two packages themselves stay external.

## 0.1.2-next.2

### Patch Changes

- ec4e868: Builds of the same dependencies for different bundles, such as separate `editor` and `client-player` requests, run one after another, because they install into and write to the same directory.
- 0b4b1a9: Svelte rune modules (`.svelte.ts`, `.svelte.js`) are compiled by Svelte, so runes such as `$state` work in a bundle.
- 0611171: Exports `findWorkspacePackages` and `workspaceDependencyClosure`, which give the workspace packages a `workspace-fast` build of given elements reads, so a caller can key its bundle cache on them.
- 67e7141: `workspace-fast` builds bundle every workspace package from its sources, so no element, shared or `@pie-lib` package needs building first and an edited element bundles its current source. Workspace packages are linked by package name, and Svelte components compile with `customElement` as the elements' own builds do.

## 0.1.2-next.1

### Patch Changes

- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles

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
