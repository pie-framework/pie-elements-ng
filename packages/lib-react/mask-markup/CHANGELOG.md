# @pie-lib/mask-markup

## 3.0.4-next.36

### Patch Changes

- f568994: Keep the inline-dropdown menu opaque when the host sets no --pie-background (PIE-1008)
- 7cae8f9: Fix keyboard placement: center the dragged item on its target instead of top-aligning it there, which let the item bleed into a neighbouring target and register the wrong drop; and correct the placement-ordering Tab cycle (PIE-803, PIE-963, PIE-964)
- Updated dependencies [7cae8f9]
  - @pie-lib/drag@4.1.0-next.40
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34

## 3.0.4-next.35

### Patch Changes

- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33

## 3.0.4-next.34

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/drag@4.0.3-next.39

## 3.0.4-next.33

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/drag@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 3.0.4-next.32

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.37
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/render-ui@6.1.1-next.37

## 3.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 3.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
