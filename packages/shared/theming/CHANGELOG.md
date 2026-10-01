# @pie-element/shared-theming

## 0.2.0-next.10

### Patch Changes

- Updated dependencies [3e49e88]
  - @pie-element/shared-types@0.2.0-next.5

## 0.2.0-next.9

### Patch Changes

- c96fae3: Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.

## 0.2.0-next.8

### Patch Changes

- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4

## 0.2.0-next.7

### Minor Changes

- Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Fix: republish to replace workspace:* with resolved versions in published manifests
- Republish shared packages with resolved workspace:* dependencies (fixes broken 0.1.0 manifests on npm)
- Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-types@0.2.0-next.3

## 0.2.0-next.6

### Patch Changes

- Updated dependencies [e3aa4f8]
  - @pie-element/shared-types@0.2.0-next.2

## 0.2.0-next.5

### Patch Changes

- Updated dependencies [7abcbd2]
  - @pie-element/shared-types@0.2.0-next.1

## 0.2.0-next.4

### Patch Changes

- 2f26122: Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)

  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

## 0.2.0-next.3

### Minor Changes

- 7cae8f9: Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

## 0.1.1-next.2

### Patch Changes

- Updated dependencies [1d74cc2]
  - @pie-element/shared-types@0.2.0-next.0

## 0.1.1-next.1

### Patch Changes

- 5ca8ec1: Republish shared packages with resolved workspace:\* dependencies (fixes broken 0.1.0 manifests on npm)

## 0.1.1-next.0

### Patch Changes

- 509caf6: Fix: republish to replace workspace:\* with resolved versions in published manifests
