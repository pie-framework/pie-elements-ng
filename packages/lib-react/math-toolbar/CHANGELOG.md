# @pie-lib/math-toolbar

## 3.0.4

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [b34750c]
- Updated dependencies [0e9882f]
- Updated dependencies [a4c6279]
  - @pie-lib/math-input@8.1.2
  - @pie-lib/render-ui@6.1.2
  - @pie-element/shared-lodash@0.1.2

## 3.0.3-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/math-input@8.1.1-next.3
  - @pie-lib/render-ui@6.1.1-next.38

## 3.0.3-next.37

### Patch Changes

- @pie-lib/math-input@8.1.1-next.2
- @pie-lib/render-ui@6.1.1-next.37

## 3.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/math-input@0.1.1-next.1
  - @pie-lib/render-ui@6.1.1-next.0

## 3.0.3-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/math-input@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
