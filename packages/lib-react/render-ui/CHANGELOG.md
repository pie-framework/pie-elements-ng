# @pie-lib/render-ui

## 8.0.0

### Major Changes

- [#261](https://github.com/pie-framework/pie-elements-ng/pull/261) [`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - First stable release built from pie-elements-ng, which replaces the pie-elements and pie-lib builds of this package.
  
  It is a new major version, above every version those repositories published, so existing `^` ranges on the earlier line keep resolving the earlier builds. Moving to this version is opt-in.

### Minor Changes

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- [#31](https://github.com/pie-framework/pie-elements-ng/pull/31) [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng ESM builds for PIE lib packages

- [#88](https://github.com/pie-framework/pie-elements-ng/pull/88) [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229) Thanks [@chillenious](https://github.com/chillenious)! - React element colours drawn from MUI's grey palette now follow the active colour scheme.
  
  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.
  
  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.
  
  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.
  
  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.
  
  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.

- [#126](https://github.com/pie-framework/pie-elements-ng/pull/126) [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `[#545454](https://github.com/pie-framework/pie-elements-ng/issues/545454)`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Let the custom audio button start playback when autoplay is off (PIE-1068)

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#240](https://github.com/pie-framework/pie-elements-ng/pull/240) [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/icons@5.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1

## 6.2.0-next.53

### Patch Changes

- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8

## 6.2.0-next.52

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7

## 6.2.0-next.51

### Patch Changes

- c96fae3: Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.

## 6.2.0-next.50

### Minor Changes

- Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Publish ng ESM builds for PIE lib packages
- React element colours drawn from MUI's grey palette now follow the active colour scheme.
  
  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.
  
  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.
  
  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.
  
  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.
  
  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.
- Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.
- Let the custom audio button start playback when autoplay is off (PIE-1068)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [b6ef8b1]
- Updated dependencies
- Updated dependencies
  - @pie-lib/icons@5.0.0-next.3
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3

## 6.2.0-next.49

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5

## 6.2.0-next.48

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4

## 6.2.0-next.47

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3

## 6.2.0-next.46

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/icons@5.0.0-next.2

## 6.2.0-next.45

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1

## 6.2.0-next.44

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2

## 6.2.0-next.43

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/icons@5.0.0-next.1
  - @pie-lib/test-utils@3.0.0-next.2

## 6.2.0-next.42

### Patch Changes

- 2f26122: Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)

  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- 4fe8ce6: Let the custom audio button start playback when autoplay is off (PIE-1068)
- Updated dependencies [4fe8ce6]
  - @pie-lib/test-utils@3.0.0-next.1

## 6.2.0-next.41

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/icons@5.0.0-next.0
  - @pie-lib/test-utils@3.0.0-next.0

## 6.2.0-next.40

### Minor Changes

- 7cae8f9: Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

## 6.1.1-next.39

### Patch Changes

- d6e12a5: React element colours drawn from MUI's grey palette now follow the active colour scheme.

  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.

  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.

  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.

  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.

  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.

## 6.1.1-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1

## 6.1.1-next.37

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0

## 6.1.1-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0

## 6.1.1-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/icons@4.0.3-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/test-utils@2.0.3-next.0
