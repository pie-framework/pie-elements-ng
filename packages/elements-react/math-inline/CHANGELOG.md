# @pie-element/math-inline

## 12.1.1-next.16

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

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/math-toolbar@3.0.3-next.39
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/translator@4.0.3-next.2
  - @pie-lib/correct-answer-toggle@4.0.3-next.39
  - @pie-lib/math-input@8.1.1-next.4

## 12.1.1-next.15

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/correct-answer-toggle@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/math-input@8.1.1-next.3
  - @pie-lib/math-toolbar@3.0.3-next.38
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/translator@4.0.3-next.1

## 12.1.1-next.14

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 12.1.1-next.13

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 12.1.1-next.12

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/math-input@8.1.1-next.2
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/math-toolbar@3.0.3-next.37
  - @pie-lib/correct-answer-toggle@4.0.3-next.37

## 12.1.1-next.0

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/math-input@0.1.1-next.1
  - @pie-lib/math-toolbar@3.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0
