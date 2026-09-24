# @pie-lib/graphing-solution-set

## 5.0.0-next.38

### Patch Changes

- Updated dependencies [dad31dc]
  - @pie-lib/translator@5.0.0-next.5

## 5.0.0-next.37

### Patch Changes

- Updated dependencies [0f1b96e]
- Updated dependencies [b2d3248]
- Updated dependencies [a0ee0d5]
- Updated dependencies [2bb02ad]
  - @pie-lib/translator@5.0.0-next.4

## 5.0.0-next.36

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36
  - @pie-lib/drag@4.1.0-next.42
  - @pie-lib/config-ui@14.0.0-next.36
  - @pie-lib/plot@5.0.0-next.36

## 5.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/graphing-utils@4.0.0-next.3
  - @pie-lib/plot@5.0.0-next.35
  - @pie-lib/tools@3.0.0-next.2
  - @pie-lib/translator@5.0.0-next.3
  - @pie-lib/render-ui@6.2.0-next.41
  - @pie-lib/drag@4.1.0-next.41

## 4.0.4-next.34

### Patch Changes

- a204d11: Lock the graphing background and disabled mark colors to the palette default instead of letting them follow the host color scheme, so a background mark's stroke, arrowheads and endpoints keep a predictable contrast against the plane. The graph controls and accordion now use the dark background token with a primary-light border. The plot plane itself is still transparent, so this makes the mark color predictable and reviewable rather than WCAG 1.4.11 compliant (PIE-877, PIE-994)
- Updated dependencies [7cae8f9]
  - @pie-lib/drag@4.1.0-next.40
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34
  - @pie-lib/config-ui@13.0.4-next.34
  - @pie-lib/plot@4.0.4-next.34

## 4.0.4-next.33

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- 425feaf: Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Updated dependencies [425feaf]
- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33
  - @pie-lib/plot@4.0.4-next.33
  - @pie-lib/config-ui@13.0.4-next.33

## 4.0.4-next.32

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/graphing-utils@3.0.3-next.2
  - @pie-lib/translator@4.0.3-next.2
  - @pie-lib/plot@4.0.4-next.32
  - @pie-lib/drag@4.0.3-next.39

## 4.0.4-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/drag@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/graphing-utils@3.0.3-next.1
  - @pie-lib/plot@4.0.4-next.31
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/tools@2.0.3-next.1
  - @pie-lib/translator@4.0.3-next.1

## 4.0.4-next.30

### Patch Changes

- @pie-lib/drag@4.0.3-next.37
- @pie-lib/editable-html-tip-tap@2.1.2-next.30
- @pie-lib/render-ui@6.1.1-next.37
- @pie-lib/config-ui@13.0.4-next.30
- @pie-lib/plot@4.0.4-next.30

## 4.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/graphing-utils@3.0.3-next.0
  - @pie-lib/plot@4.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/tools@2.0.3-next.0
  - @pie-lib/translator@4.0.3-next.0

## 4.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0
  - @pie-lib/plot@4.0.4-next.0
