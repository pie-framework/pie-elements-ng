# @pie-element/shared-theming

## 0.2.1

### Patch Changes

- [#285](https://github.com/pie-framework/pie-elements-ng/pull/285) [`484e54d`](https://github.com/pie-framework/pie-elements-ng/commit/484e54db45cd13778de739cbc293e4f43f7cf938) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui): render the Collapsible header as a disclosure button

- [#344](https://github.com/pie-framework/pie-elements-ng/pull/344) [`925bef9`](https://github.com/pie-framework/pie-elements-ng/commit/925bef92b459dbb0a9932501e1ddfb7cb07f2cca) Thanks [@andreeimiron](https://github.com/andreeimiron)! - fix(render-ui): update color-contrast especially for placement-ordering PIE-821

- [#374](https://github.com/pie-framework/pie-elements-ng/pull/374) [`c71aac6`](https://github.com/pie-framework/pie-elements-ng/commit/c71aac64875677926e30a7c4271c33b2ded5606f) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui, theming): make feedback and correctness colours readable under every scheme

## 0.2.0

### Minor Changes

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- [#23](https://github.com/pie-framework/pie-elements-ng/pull/23) [`509caf6`](https://github.com/pie-framework/pie-elements-ng/commit/509caf638617921bb62037b4e0d5d69b5bdca37d) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Fix: republish to replace workspace:* with resolved versions in published manifests

- [#27](https://github.com/pie-framework/pie-elements-ng/pull/27) [`5ca8ec1`](https://github.com/pie-framework/pie-elements-ng/commit/5ca8ec140ac4b115c8d11cb783d856be42f3de7b) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Republish shared packages with resolved workspace:* dependencies (fixes broken 0.1.0 manifests on npm)

- [#126](https://github.com/pie-framework/pie-elements-ng/pull/126) [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `[#545454](https://github.com/pie-framework/pie-elements-ng/issues/545454)`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- [#240](https://github.com/pie-framework/pie-elements-ng/pull/240) [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.
- Updated dependencies [[`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021), [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c), [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735)]:
  - @pie-element/shared-types@0.2.0

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
