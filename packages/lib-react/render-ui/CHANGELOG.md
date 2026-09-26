# @pie-lib/render-ui

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
