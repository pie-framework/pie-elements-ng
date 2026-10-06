# @pie-lib/plot

## 5.0.1

### Patch Changes

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#301](https://github.com/pie-framework/pie-elements-ng/pull/301) [`9b72376`](https://github.com/pie-framework/pie-elements-ng/commit/9b72376f6055ba629a913c9a0739623aa6f45e49) Thanks [@chillenious](https://github.com/chillenious)! - fix(plot): name and describe the chart and graph svg

- [#316](https://github.com/pie-framework/pie-elements-ng/pull/316) [`c1ce388`](https://github.com/pie-framework/pie-elements-ng/commit/c1ce388d0736ba88302157936f7808783d6f0ced) Thanks [@chillenious](https://github.com/chillenious)! - fix(theming): follow the theme background on answer slots, legends and media buttons

- [#349](https://github.com/pie-framework/pie-elements-ng/pull/349) [`621fd93`](https://github.com/pie-framework/pie-elements-ng/commit/621fd9339235fa55e1291f6a65dc1d94abb9abb4) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump assert from 1.5.1 to 2.1.0

- [#375](https://github.com/pie-framework/pie-elements-ng/pull/375) [`da07902`](https://github.com/pie-framework/pie-elements-ng/commit/da07902fc5db2179a8911ce67df0b8eba2ca5c88) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting): make bars, columns and drag handles keyboard-operable sliders
- Updated dependencies [[`a7f1bd9`](https://github.com/pie-framework/pie-elements-ng/commit/a7f1bd98f8d9e8ee018aa4b9441158650dd6c2b6), [`8ed81f0`](https://github.com/pie-framework/pie-elements-ng/commit/8ed81f087285f51ac4e4ebbc9a1e14d6cd26233a), [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f), [`2405ee9`](https://github.com/pie-framework/pie-elements-ng/commit/2405ee9b4c97246caf8c8df342b7639fe789de5c), [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975), [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`c9e4781`](https://github.com/pie-framework/pie-elements-ng/commit/c9e47812260dfba8e0b4b0538eab78efad4e86ef), [`7c077c7`](https://github.com/pie-framework/pie-elements-ng/commit/7c077c76a684118cc2b6b9e2482974bab9078b07), [`7dfa941`](https://github.com/pie-framework/pie-elements-ng/commit/7dfa941f4d8ef46c8625157739f72ae0d6d33983), [`2e5cb09`](https://github.com/pie-framework/pie-elements-ng/commit/2e5cb09a131875b67cb7b845b141a52ff6597164), [`216ac0f`](https://github.com/pie-framework/pie-elements-ng/commit/216ac0f5591417cd7d1a83fbde0b4b724a97eb44), [`c0d98a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d98a0cb2bf1d8c5e6237d8861aa7c9615b5c01), [`a55702d`](https://github.com/pie-framework/pie-elements-ng/commit/a55702db7c90c59539050699b3799f1e1feac929), [`22b651b`](https://github.com/pie-framework/pie-elements-ng/commit/22b651b8147af690ffa77019665d93048f25b225), [`ebab8a6`](https://github.com/pie-framework/pie-elements-ng/commit/ebab8a69c0d3cea39f83f5d7dcc4818ffc2981e7), [`39d0980`](https://github.com/pie-framework/pie-elements-ng/commit/39d098078ba330bc71c76f453a3b526d3cfab86c), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5)]:
  - @pie-lib/editable-html-tip-tap@3.0.1
  - @pie-lib/render-ui@8.0.1
  - @pie-element/shared-lodash@0.1.2

## 5.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Sync upstream drag fixes, visx v4, tiptap and number-line math changes

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`b73382f`](https://github.com/pie-framework/pie-elements-ng/commit/b73382fe97ee296bf06a0b0a45012649afc4b4e6) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#186](https://github.com/pie-framework/pie-elements-ng/issues/186) from pie-framework/fix/PIE-1074

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`f3f1abb`](https://github.com/pie-framework/pie-elements-ng/commit/f3f1abb33aaa1f61ecc028e903a5e2d8135e22f6), [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`60ec99e`](https://github.com/pie-framework/pie-elements-ng/commit/60ec99e38d3b08ae8fd6a2760caad7dfe4c42175), [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27), [`41deafb`](https://github.com/pie-framework/pie-elements-ng/commit/41deafbd79f9b06c930278a13cca26fcefd14635), [`a39cbb6`](https://github.com/pie-framework/pie-elements-ng/commit/a39cbb6a101ee221547480ef3084b7d8bbd986b2), [`23ae7d3`](https://github.com/pie-framework/pie-elements-ng/commit/23ae7d3cc42c48fb0acf9ea51ab25efc58d74468), [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/render-ui@8.0.0
  - @pie-lib/editable-html-tip-tap@3.0.0
  - @pie-element/shared-lodash@0.1.1

## 5.0.0-next.51

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.50
  - @pie-lib/render-ui@6.2.0-next.53

## 5.0.0-next.50

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.49
  - @pie-lib/render-ui@6.2.0-next.52

## 5.0.0-next.49

### Patch Changes

- Updated dependencies
- Updated dependencies [c96fae3]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.48
  - @pie-lib/render-ui@6.2.0-next.51

## 5.0.0-next.48

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.47

## 5.0.0-next.47

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #186 from pie-framework/fix/PIE-1074
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
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-lodash@0.1.1-next.3

## 5.0.0-next.46

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.45
- @pie-lib/render-ui@6.2.0-next.49

## 5.0.0-next.45

### Patch Changes

- Updated dependencies [60ec99e]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.44

## 5.0.0-next.44

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.43

## 5.0.0-next.43

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.42
- @pie-lib/render-ui@6.2.0-next.48

## 5.0.0-next.42

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.41
- @pie-lib/render-ui@6.2.0-next.47

## 5.0.0-next.41

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.40
  - @pie-lib/render-ui@6.2.0-next.46

## 5.0.0-next.40

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.39
- @pie-lib/render-ui@6.2.0-next.45

## 5.0.0-next.39

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/editable-html-tip-tap@3.0.0-next.38
  - @pie-lib/render-ui@6.2.0-next.44

## 5.0.0-next.38

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.37
  - @pie-lib/render-ui@6.2.0-next.43

## 5.0.0-next.37

### Patch Changes

- Merge pull request #186 from pie-framework/fix/PIE-1074

## 5.0.0-next.36

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36

## 5.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/render-ui@6.2.0-next.41

## 4.0.4-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34

## 4.0.4-next.33

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- 425feaf: Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33

## 4.0.4-next.32

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39

## 4.0.4-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 4.0.4-next.30

### Patch Changes

- @pie-lib/editable-html-tip-tap@2.1.2-next.30
- @pie-lib/render-ui@6.1.1-next.37

## 4.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 4.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
