# @pie-lib/charting

## 7.0.4-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/config-ui@13.0.4-next.34
  - @pie-lib/plot@4.0.4-next.34

## 7.0.4-next.33

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- 425feaf: Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Updated dependencies [425feaf]
- Updated dependencies [425feaf]
  - @pie-lib/plot@4.0.4-next.33
  - @pie-lib/config-ui@13.0.4-next.33

## 7.0.4-next.32

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/translator@4.0.3-next.2
  - @pie-lib/plot@4.0.4-next.32

## 7.0.4-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/plot@4.0.4-next.31
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/translator@4.0.3-next.1

## 7.0.4-next.30

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/plot@4.0.4-next.30

## 7.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/plot@4.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0

## 7.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0
  - @pie-lib/plot@4.0.4-next.0
