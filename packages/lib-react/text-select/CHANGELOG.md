# @pie-lib/text-select

## 4.0.0-next.43

### Patch Changes

- Updated dependencies [0f1b96e]
- Updated dependencies [b2d3248]
- Updated dependencies [a0ee0d5]
- Updated dependencies [2bb02ad]
  - @pie-lib/translator@5.0.0-next.4

## 4.0.0-next.42

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42

## 4.0.0-next.41

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/style-utils@3.0.0-next.0
  - @pie-lib/translator@5.0.0-next.3
  - @pie-lib/render-ui@6.2.0-next.41

## 3.0.3-next.40

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40

## 3.0.3-next.39

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/translator@4.0.3-next.2

## 3.0.3-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/translator@4.0.3-next.1

## 3.0.3-next.37

### Patch Changes

- @pie-lib/render-ui@6.1.1-next.37

## 3.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0

## 3.0.3-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0
