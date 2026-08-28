# @pie-element/ebsr

## 14.2.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Updated dependencies [a644ec3]
  - @pie-element/multiple-choice@13.3.5-next.2

## 14.2.2-next.6

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-element/multiple-choice@13.3.5-next.1
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/translator@4.0.3-next.2
  - @pie-element/shared-controller-utils@0.1.1-next.2

## 14.2.2-next.5

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-element/multiple-choice@13.2.2-next.5
  - @pie-lib/translator@4.0.3-next.1

## 14.2.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.4

## 14.2.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.3

## 14.2.2-next.2

### Patch Changes

- @pie-element/multiple-choice@13.2.2-next.2
- @pie-lib/config-ui@13.0.4-next.30

## 14.2.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies
- Updated dependencies [a4c6279]
  - @pie-element/multiple-choice@13.2.2-next.1
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/translator@4.0.3-next.0

## 14.2.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.0

## 14.2.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626
- Updated dependencies [33d27e0]
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.2.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/translator@4.0.3-next.0
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.2.1-next.2

### Patch Changes

- Updated dependencies [42e1684]
  - @pie-element/multiple-choice@13.2.1-next.2

## 14.2.1-next.1

### Patch Changes

- Updated dependencies [5ca8ec1]
  - @pie-element/shared-controller-utils@0.1.1-next.1
  - @pie-element/multiple-choice@13.2.1-next.1

## 14.2.1-next.0

### Patch Changes

- Updated dependencies [509caf6]
  - @pie-element/shared-controller-utils@0.1.1-next.0
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.1.1-next.2

### Patch Changes

- Updated dependencies [b083e3a]
  - @pie-element/multiple-choice@13.1.1-next.0

## 14.1.1-next.1

### Patch Changes

- Updated dependencies [e32415a]
  - @pie-element/multiple-choice@13.1.1-next.1

## 14.1.1-next.0

### Patch Changes

- Updated dependencies [259eb4d]
- Updated dependencies [7bd4a51]
  - @pie-element/multiple-choice@13.1.1-next.0
