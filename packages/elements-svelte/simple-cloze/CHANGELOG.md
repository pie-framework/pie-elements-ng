# @pie-element/simple-cloze

## 0.1.4-next.4

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.4-next.3

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 0.1.4-next.2

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 0.1.4-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave

## 0.1.4-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 0.1.3

### Patch Changes

- Add explicit pie.controller metadata for Svelte elements so client-player bundles include controllers

## 0.1.2

### Patch Changes

- Publish Svelte styling under a publishable npm scope and update dependent packages to consume the published library.
- Updated dependencies
  - @pie-lib/editable-html-tiptap-svelte@0.1.2
  - @pie-lib/styling-svelte@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @pie-lib-svelte/styling@0.1.1
  - @pie-lib/editable-html-tiptap-svelte@0.1.1
