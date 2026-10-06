# @pie-lib/config-ui

## 14.0.1

### Patch Changes

- [#327](https://github.com/pie-framework/pie-elements-ng/pull/327) [`199ae92`](https://github.com/pie-framework/pie-elements-ng/commit/199ae92c9ca6fda549936306a82036dd770f619a) Thanks [@chillenious](https://github.com/chillenious)! - Each settings-panel toggle's label names its switch, so screen readers announce the setting a switch controls. The switches had no accessible name.

- [#337](https://github.com/pie-framework/pie-elements-ng/pull/337) [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d) Thanks [@chillenious](https://github.com/chillenious)! - An item's authored `extraCSSRules` style only that item: each layout nests them under a class of its own instead of the `extraCSSRules` class every item carries. EBSR's item-level rules now apply when the model arrives after the element connects, and follow model changes.

- [#332](https://github.com/pie-framework/pie-elements-ng/pull/332) [`338861f`](https://github.com/pie-framework/pie-elements-ng/commit/338861f5ff91ec4d46b567cf0c3ecafa8b2ac467) Thanks [@chillenious](https://github.com/chillenious)! - Two items on one page, and the two parts of an EBSR item, now render every DOM id once. The item container and the enable-audio prompt take generated ids and keep their `main-container` and `play-audio-info` classes, which the elements look them up by. EBSR marks its parts with `data-part`, math-templated marks its answer blocks with `data-answer-block`, and a categorize category carries its model id as `data-category-id`. The annotation editor, the multi-trait rubric menus, the choice feedback menu and the hotspot toolbar icons take generated ids. Authored CSS that selects `#main-container`, `#play-audio-info` or an EBSR part by `#a` or `#b` must select the class or `[data-part]` instead.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#349](https://github.com/pie-framework/pie-elements-ng/pull/349) [`621fd93`](https://github.com/pie-framework/pie-elements-ng/commit/621fd9339235fa55e1291f6a65dc1d94abb9abb4) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump assert from 1.5.1 to 2.1.0
- Updated dependencies [[`a7f1bd9`](https://github.com/pie-framework/pie-elements-ng/commit/a7f1bd98f8d9e8ee018aa4b9441158650dd6c2b6), [`8ed81f0`](https://github.com/pie-framework/pie-elements-ng/commit/8ed81f087285f51ac4e4ebbc9a1e14d6cd26233a), [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f), [`2405ee9`](https://github.com/pie-framework/pie-elements-ng/commit/2405ee9b4c97246caf8c8df342b7639fe789de5c), [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975), [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`c9e4781`](https://github.com/pie-framework/pie-elements-ng/commit/c9e47812260dfba8e0b4b0538eab78efad4e86ef), [`7c077c7`](https://github.com/pie-framework/pie-elements-ng/commit/7c077c76a684118cc2b6b9e2482974bab9078b07), [`7dfa941`](https://github.com/pie-framework/pie-elements-ng/commit/7dfa941f4d8ef46c8625157739f72ae0d6d33983), [`a75551f`](https://github.com/pie-framework/pie-elements-ng/commit/a75551fdf3f44957f73f4106097944e43b33253e), [`2e5cb09`](https://github.com/pie-framework/pie-elements-ng/commit/2e5cb09a131875b67cb7b845b141a52ff6597164), [`216ac0f`](https://github.com/pie-framework/pie-elements-ng/commit/216ac0f5591417cd7d1a83fbde0b4b724a97eb44), [`c0d98a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d98a0cb2bf1d8c5e6237d8861aa7c9615b5c01), [`a55702d`](https://github.com/pie-framework/pie-elements-ng/commit/a55702db7c90c59539050699b3799f1e1feac929), [`22b651b`](https://github.com/pie-framework/pie-elements-ng/commit/22b651b8147af690ffa77019665d93048f25b225), [`ebab8a6`](https://github.com/pie-framework/pie-elements-ng/commit/ebab8a69c0d3cea39f83f5d7dcc4818ffc2981e7), [`39d0980`](https://github.com/pie-framework/pie-elements-ng/commit/39d098078ba330bc71c76f453a3b526d3cfab86c), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5)]:
  - @pie-lib/editable-html-tip-tap@3.0.1
  - @pie-lib/render-ui@8.0.1
  - @pie-element/shared-lodash@0.1.2
  - @pie-lib/icons@5.0.1

## 14.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#31](https://github.com/pie-framework/pie-elements-ng/pull/31) [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng ESM builds for PIE lib packages

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.

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

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`f3f1abb`](https://github.com/pie-framework/pie-elements-ng/commit/f3f1abb33aaa1f61ecc028e903a5e2d8135e22f6), [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`60ec99e`](https://github.com/pie-framework/pie-elements-ng/commit/60ec99e38d3b08ae8fd6a2760caad7dfe4c42175), [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27), [`41deafb`](https://github.com/pie-framework/pie-elements-ng/commit/41deafbd79f9b06c930278a13cca26fcefd14635), [`a39cbb6`](https://github.com/pie-framework/pie-elements-ng/commit/a39cbb6a101ee221547480ef3084b7d8bbd986b2), [`23ae7d3`](https://github.com/pie-framework/pie-elements-ng/commit/23ae7d3cc42c48fb0acf9ea51ab25efc58d74468), [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/render-ui@8.0.0
  - @pie-lib/editable-html-tip-tap@3.0.0
  - @pie-lib/icons@5.0.0
  - @pie-element/shared-lodash@0.1.1

## 14.0.0-next.50

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.50
  - @pie-lib/render-ui@6.2.0-next.53

## 14.0.0-next.49

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.49
  - @pie-lib/render-ui@6.2.0-next.52

## 14.0.0-next.48

### Patch Changes

- Updated dependencies
- Updated dependencies [c96fae3]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.48
  - @pie-lib/render-ui@6.2.0-next.51

## 14.0.0-next.47

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.47

## 14.0.0-next.46

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Publish ng ESM builds for PIE lib packages
- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
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
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [41deafb]
- Updated dependencies
- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.46
  - @pie-lib/icons@5.0.0-next.3
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-lodash@0.1.1-next.3

## 14.0.0-next.45

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.45
- @pie-lib/render-ui@6.2.0-next.49

## 14.0.0-next.44

### Patch Changes

- Updated dependencies [60ec99e]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.44

## 14.0.0-next.43

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.43

## 14.0.0-next.42

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.42
- @pie-lib/render-ui@6.2.0-next.48

## 14.0.0-next.41

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.41
- @pie-lib/render-ui@6.2.0-next.47

## 14.0.0-next.40

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.40
  - @pie-lib/icons@5.0.0-next.2
  - @pie-lib/render-ui@6.2.0-next.46

## 14.0.0-next.39

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.39
- @pie-lib/render-ui@6.2.0-next.45

## 14.0.0-next.38

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/editable-html-tip-tap@3.0.0-next.38
  - @pie-lib/render-ui@6.2.0-next.44

## 14.0.0-next.37

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.37
  - @pie-lib/icons@5.0.0-next.1
  - @pie-lib/render-ui@6.2.0-next.43

## 14.0.0-next.36

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36

## 14.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/icons@5.0.0-next.0
  - @pie-lib/render-ui@6.2.0-next.41

## 13.0.4-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34

## 13.0.4-next.33

### Patch Changes

- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33

## 13.0.4-next.32

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
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39

## 13.0.4-next.31

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 13.0.4-next.30

### Patch Changes

- @pie-lib/editable-html-tip-tap@2.1.2-next.30
- @pie-lib/render-ui@6.1.1-next.37

## 13.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 13.0.4-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/icons@4.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0
