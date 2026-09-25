# @pie-element/cli

## 0.1.2-next.5

### Patch Changes

- d242e4c: The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.

  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.

## 0.1.2-next.4

### Patch Changes

- Updated dependencies [ec4e868]
- Updated dependencies [0b4b1a9]
- Updated dependencies [0611171]
- Updated dependencies [67e7141]
  - @pie-element/element-bundler@0.1.2-next.2

## 0.1.2-next.3

### Patch Changes

- 2bb02ad: Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.
- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.1

## 0.1.2-next.2

### Patch Changes

- fbc32d5: Read upstream commits from the repository passed in, even when run from a git hook.

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
