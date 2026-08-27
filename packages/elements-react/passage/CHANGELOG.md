# @pie-element/passage

## 7.1.2-next.6

### Patch Changes

- 2b06575: The paired-passage tabs follow the active theme and color scheme. Tab fill, tab ink and the
  selection indicator resolve through `--pie-background` / `--pie-text` instead of MUI's
  palette, so they no longer stay white with black ink over a dark passage body, and the tab
  outline and the strip's bottom rule move to `--pie-border-gray`, which holds the 3:1
  non-text minimum on every scheme where the previous `#D9DADA` measured about 1.2:1. A host
  that sets `--pie-passage-header-background` keeps its own strip colour unchanged; only the
  default, previously a white literal, now follows the theme.
- Updated dependencies [d6e12a5]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39

## 7.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 7.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 7.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 7.1.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30

## 7.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 7.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 7.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 7.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
