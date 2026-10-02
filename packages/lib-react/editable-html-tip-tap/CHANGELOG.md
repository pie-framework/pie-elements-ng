# @pie-lib/editable-html-tip-tap

## 3.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

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

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Sync upstream drag fixes, visx v4, tiptap and number-line math changes

- [#148](https://github.com/pie-framework/pie-elements-ng/pull/148) [`f3f1abb`](https://github.com/pie-framework/pie-elements-ng/commit/f3f1abb33aaa1f61ecc028e903a5e2d8135e22f6) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Upload pasted images instead of inlining them as base64. The tiptap paste handler read the clipboard file into a data URL and inserted it as the node's `src` without ever calling `imageSupport.add`, so a pasted image was persisted inline - inflating the item by roughly a third of the file size and failing to save with a 413 for large images - while the toolbar button stored a short uploaded URL. Paste now inserts the data URL only as a preview and hands the file to the host through `insertImageRequested` with `isPasted` and `getChosenFile`, the same contract the toolbar path uses, so the stored markup carries the uploaded URL. `InsertImageHandler` also resolves its target node by `nodeKey` rather than by the position captured when the upload started, because nothing stops the author from typing while a pasted image uploads and a stale position wrote the uploaded URL onto the wrong node (PIE-1017)

- [#156](https://github.com/pie-framework/pie-elements-ng/pull/156) [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Keep the toolbar background under buttons that overflow the editor (PIE-1057)

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#223](https://github.com/pie-framework/pie-elements-ng/pull/223) [`60ec99e`](https://github.com/pie-framework/pie-elements-ng/commit/60ec99e38d3b08ae8fd6a2760caad7dfe4c42175) Thanks [@chillenious](https://github.com/chillenious)! - Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#219](https://github.com/pie-framework/pie-elements-ng/issues/219) from pie-framework/chore/remove-unused-code

- [#229](https://github.com/pie-framework/pie-elements-ng/pull/229) [`41deafb`](https://github.com/pie-framework/pie-elements-ng/commit/41deafbd79f9b06c930278a13cca26fcefd14635) Thanks [@chillenious](https://github.com/chillenious)! - Drop the unused `change-case` runtime dependency.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`a39cbb6`](https://github.com/pie-framework/pie-elements-ng/commit/a39cbb6a101ee221547480ef3084b7d8bbd986b2) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#235](https://github.com/pie-framework/pie-elements-ng/issues/235) from pie-framework/fix/PIE-1115-math-toolbar-focus

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`23ae7d3`](https://github.com/pie-framework/pie-elements-ng/commit/23ae7d3cc42c48fb0acf9ea51ab25efc58d74468) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - chore(release): version packages (next)

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#255](https://github.com/pie-framework/pie-elements-ng/issues/255) from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`a39cbb6`](https://github.com/pie-framework/pie-elements-ng/commit/a39cbb6a101ee221547480ef3084b7d8bbd986b2), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/drag@5.0.0
  - @pie-lib/render-ui@8.0.0
  - @pie-lib/math-input@9.0.0
  - @pie-lib/math-toolbar@4.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1

## 3.0.0-next.50

### Patch Changes

- Merge pull request #255 from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers
- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8
  - @pie-lib/drag@4.1.0-next.54
  - @pie-lib/render-ui@6.2.0-next.53
  - @pie-lib/math-input@9.0.0-next.19
  - @pie-lib/math-toolbar@4.0.0-next.55

## 3.0.0-next.49

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7
  - @pie-lib/drag@4.1.0-next.53
  - @pie-lib/render-ui@6.2.0-next.52
  - @pie-lib/math-input@9.0.0-next.18
  - @pie-lib/math-toolbar@4.0.0-next.54

## 3.0.0-next.48

### Patch Changes

- chore(release): version packages (next)
- Updated dependencies [c96fae3]
  - @pie-lib/render-ui@6.2.0-next.51
  - @pie-lib/drag@4.1.0-next.52
  - @pie-lib/math-input@9.0.0-next.17
  - @pie-lib/math-toolbar@4.0.0-next.53

## 3.0.0-next.47

### Patch Changes

- Merge pull request #235 from pie-framework/fix/PIE-1115-math-toolbar-focus
- Updated dependencies
  - @pie-lib/math-toolbar@4.0.0-next.52

## 3.0.0-next.46

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

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
- Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- Upload pasted images instead of inlining them as base64. The tiptap paste handler read the clipboard file into a data URL and inserted it as the node's `src` without ever calling `imageSupport.add`, so a pasted image was persisted inline - inflating the item by roughly a third of the file size and failing to save with a 413 for large images - while the toolbar button stored a short uploaded URL. Paste now inserts the data URL only as a preview and hands the file to the host through `insertImageRequested` with `isPasted` and `getChosenFile`, the same contract the toolbar path uses, so the stored markup carries the uploaded URL. `InsertImageHandler` also resolves its target node by `nodeKey` rather than by the position captured when the upload started, because nothing stops the author from typing while a pasted image uploads and a stale position wrote the uploaded URL onto the wrong node (PIE-1017)
- Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)
- Keep the toolbar background under buttons that overflow the editor (PIE-1057)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).
- Merge pull request #219 from pie-framework/chore/remove-unused-code
- 41deafb: Drop the unused `change-case` runtime dependency.
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
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [b6ef8b1]
- Updated dependencies
- Updated dependencies
  - @pie-lib/drag@4.1.0-next.51
  - @pie-lib/math-input@9.0.0-next.16
  - @pie-lib/math-toolbar@4.0.0-next.51
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3

## 3.0.0-next.45

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/drag@4.1.0-next.50
  - @pie-lib/render-ui@6.2.0-next.49
  - @pie-lib/math-input@9.0.0-next.15
  - @pie-lib/math-toolbar@4.0.0-next.50

## 3.0.0-next.44

### Patch Changes

- 60ec99e: Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).

## 3.0.0-next.43

### Patch Changes

- Merge pull request #219 from pie-framework/chore/remove-unused-code
- Updated dependencies
  - @pie-lib/drag@4.1.0-next.49
  - @pie-lib/math-input@9.0.0-next.14
  - @pie-lib/math-toolbar@4.0.0-next.49

## 3.0.0-next.42

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/drag@4.1.0-next.48
  - @pie-lib/render-ui@6.2.0-next.48
  - @pie-lib/math-input@9.0.0-next.13
  - @pie-lib/math-toolbar@4.0.0-next.48

## 3.0.0-next.41

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-lib/drag@4.1.0-next.47
  - @pie-lib/render-ui@6.2.0-next.47
  - @pie-lib/math-input@9.0.0-next.12
  - @pie-lib/math-toolbar@4.0.0-next.47

## 3.0.0-next.40

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/drag@4.1.0-next.46
  - @pie-lib/math-input@9.0.0-next.11
  - @pie-lib/math-toolbar@4.0.0-next.46
  - @pie-lib/render-ui@6.2.0-next.46

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
