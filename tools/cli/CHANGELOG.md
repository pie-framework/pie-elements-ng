# @pie-element/cli

## 0.1.2-next.1

### Patch Changes

- 4fe8ce6: `upstream:sync` now forces every `@tiptap/*` dependency of a synced `@pie-lib` package to one exact version instead of taking the upstream manifest's. tiptap pins its own peers exactly from 3.24.0 on, so the mixed set upstream declares resolves a second `@tiptap/core` and breaks ProseMirror on duplicate schema and plugin identity (PIE-1042)

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
