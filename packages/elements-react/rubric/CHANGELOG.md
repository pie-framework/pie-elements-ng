# @pie-element/rubric

## 8.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/rubric@2.0.4-next.31

## 8.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 8.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 8.1.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/rubric@2.0.4-next.30

## 8.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/rubric@2.0.4-next.0

## 8.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 8.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 8.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/rubric@2.0.4-next.0
