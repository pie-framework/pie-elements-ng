# @pie-element/multiple-choice

## 13.3.5-ng.0

### Patch Changes

- Add a legacy-compatible `module/print.js` print artifact (self-contained,
  React inlined, zero externals) so print works through the unmodified
  `@pie-framework/pie-print` client loader used in production today, in
  addition to the existing `dist/browser/print/index.js` artifact for the
  new `pie-print-player`. Manual ng-tagged release for verification ahead of
  a standard prerelease. PIE-839.

## 13.2.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/correct-answer-toggle@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/translator@4.0.3-next.1

## 13.2.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 13.2.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 13.2.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/correct-answer-toggle@4.0.3-next.37

## 13.2.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0

## 13.2.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 13.2.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 13.2.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0

## 13.2.1-next.2

### Patch Changes

- 42e1684: Include changes and fix dependency issues

## 13.2.1-next.1

### Patch Changes

- Updated dependencies [5ca8ec1]
  - @pie-element/shared-controller-utils@0.1.1-next.1

## 13.2.1-next.0

### Patch Changes

- Updated dependencies [509caf6]
  - @pie-element/shared-controller-utils@0.1.1-next.0

## 13.1.1-next.0

### Patch Changes

- b083e3a: test multiple-choice release flow

## 13.1.1-next.1

### Patch Changes

- e32415a: test release flow

## 13.1.1-next.0

### Patch Changes

- 259eb4d: multiple-choice release flow test
- 7bd4a51: test multiple-choice release flow
