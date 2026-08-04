# @pie-lib/editable-html-tip-tap

## 2.1.2-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/drag@4.0.3-next.38
  - @pie-lib/math-input@8.1.1-next.3
  - @pie-lib/math-toolbar@3.0.3-next.38
  - @pie-lib/render-ui@6.1.1-next.38

## 2.1.2-next.30

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.37
  - @pie-lib/math-input@8.1.1-next.2
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/math-toolbar@3.0.3-next.37

## 2.1.2-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/math-input@0.1.1-next.1
  - @pie-lib/math-toolbar@3.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 2.1.2-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/math-input@0.1.1-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/math-toolbar@3.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0
