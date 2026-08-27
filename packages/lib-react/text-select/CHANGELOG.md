# @pie-lib/text-select

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
