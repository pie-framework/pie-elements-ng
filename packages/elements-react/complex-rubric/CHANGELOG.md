# @pie-element/complex-rubric

## 7.1.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Updated dependencies [a644ec3]
  - @pie-element/multi-trait-rubric@8.1.2-next.7
  - @pie-element/rubric@8.1.2-next.7

## 7.1.2-next.6

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-element/multi-trait-rubric@8.1.2-next.6
  - @pie-element/rubric@8.1.2-next.6
  - @pie-lib/rubric@2.0.4-next.32

## 7.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-element/multi-trait-rubric@8.1.2-next.5
  - @pie-element/rubric@8.1.2-next.5
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/rubric@2.0.4-next.31

## 7.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multi-trait-rubric@8.1.2-next.4
  - @pie-element/rubric@8.1.2-next.4

## 7.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multi-trait-rubric@8.1.2-next.3
  - @pie-element/rubric@8.1.2-next.3

## 7.1.2-next.2

### Patch Changes

- @pie-element/multi-trait-rubric@8.1.2-next.2
- @pie-element/rubric@8.1.2-next.2
- @pie-lib/render-ui@6.1.1-next.37
- @pie-lib/config-ui@13.0.4-next.30
- @pie-lib/rubric@2.0.4-next.30

## 7.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies
- Updated dependencies [a4c6279]
  - @pie-element/multi-trait-rubric@8.1.2-next.1
  - @pie-element/rubric@8.1.2-next.1
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/rubric@2.0.4-next.0

## 7.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.
- Updated dependencies
  - @pie-element/multi-trait-rubric@8.1.2-next.0
  - @pie-element/rubric@8.1.2-next.0

## 7.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626
- Updated dependencies [33d27e0]
  - @pie-element/multi-trait-rubric@8.1.1-next.0
  - @pie-element/rubric@8.1.1-next.0

## 7.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-element/multi-trait-rubric@8.1.1-next.0
  - @pie-element/rubric@8.1.1-next.0
  - @pie-lib/rubric@2.0.4-next.0
