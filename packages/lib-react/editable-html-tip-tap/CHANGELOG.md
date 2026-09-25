# @pie-lib/editable-html-tip-tap

## 3.0.0-next.39

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-lib/drag@4.1.0-next.45
  - @pie-lib/render-ui@6.2.0-next.45
  - @pie-lib/math-input@9.0.0-next.10
  - @pie-lib/math-toolbar@4.0.0-next.45

## 3.0.0-next.38

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/drag@4.1.0-next.44
  - @pie-lib/math-input@9.0.0-next.9
  - @pie-lib/math-toolbar@4.0.0-next.44
  - @pie-lib/render-ui@6.2.0-next.44

## 3.0.0-next.37

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/drag@4.1.0-next.43
  - @pie-lib/math-input@9.0.0-next.8
  - @pie-lib/math-toolbar@4.0.0-next.43
  - @pie-lib/render-ui@6.2.0-next.43

## 3.0.0-next.36

### Patch Changes

- f3f1abb: Upload pasted images instead of inlining them as base64. The tiptap paste handler read the clipboard file into a data URL and inserted it as the node's `src` without ever calling `imageSupport.add`, so a pasted image was persisted inline - inflating the item by roughly a third of the file size and failing to save with a 413 for large images - while the toolbar button stored a short uploaded URL. Paste now inserts the data URL only as a preview and hands the file to the host through `insertImageRequested` with `isPasted` and `getChosenFile`, the same contract the toolbar path uses, so the stored markup carries the uploaded URL. `InsertImageHandler` also resolves its target node by `nodeKey` rather than by the position captured when the upload started, because nothing stops the author from typing while a pasted image uploads and a stale position wrote the uploaded URL onto the wrong node (PIE-1017)
- d22cfb1: Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)
- 4fe8ce6: Keep the toolbar background under buttons that overflow the editor (PIE-1057)
- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/drag@4.1.0-next.42
  - @pie-lib/math-input@9.0.0-next.7
  - @pie-lib/math-toolbar@4.0.0-next.42

## 3.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/math-input@9.0.0-next.6
  - @pie-lib/math-toolbar@4.0.0-next.41
  - @pie-lib/render-ui@6.2.0-next.41
  - @pie-lib/drag@4.1.0-next.41

## 2.1.2-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/drag@4.1.0-next.40
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/math-input@8.1.1-next.5
  - @pie-lib/math-toolbar@3.0.3-next.40

## 2.1.2-next.33

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes

## 2.1.2-next.32

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
  - @pie-lib/math-toolbar@3.0.3-next.39
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/drag@4.0.3-next.39
  - @pie-lib/math-input@8.1.1-next.4

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
