# @pie-lib/config-ui

## 13.0.5

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- 0e9882f: Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [b34750c]
- Updated dependencies [0e9882f]
- Updated dependencies [a4c6279]
  - @pie-lib/editable-html-tip-tap@2.1.3
  - @pie-lib/icons@4.0.3
  - @pie-lib/render-ui@6.1.2
  - @pie-element/shared-lodash@0.1.2

## 13.0.4-next.31

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 13.0.4-next.30

### Patch Changes

- @pie-lib/editable-html-tip-tap@2.1.2-next.30
- @pie-lib/render-ui@6.1.1-next.37

## 13.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 13.0.4-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/icons@4.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0
