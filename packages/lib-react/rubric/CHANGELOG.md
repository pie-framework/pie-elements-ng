# @pie-lib/rubric

## 3.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`f3f1abb`](https://github.com/pie-framework/pie-elements-ng/commit/f3f1abb33aaa1f61ecc028e903a5e2d8135e22f6), [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`60ec99e`](https://github.com/pie-framework/pie-elements-ng/commit/60ec99e38d3b08ae8fd6a2760caad7dfe4c42175), [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27), [`41deafb`](https://github.com/pie-framework/pie-elements-ng/commit/41deafbd79f9b06c930278a13cca26fcefd14635), [`a39cbb6`](https://github.com/pie-framework/pie-elements-ng/commit/a39cbb6a101ee221547480ef3084b7d8bbd986b2), [`23ae7d3`](https://github.com/pie-framework/pie-elements-ng/commit/23ae7d3cc42c48fb0acf9ea51ab25efc58d74468), [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/render-ui@8.0.0
  - @pie-lib/config-ui@14.0.0
  - @pie-lib/editable-html-tip-tap@3.0.0
  - @pie-element/shared-lodash@0.1.1

## 3.0.0-next.50

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.50
  - @pie-lib/render-ui@6.2.0-next.53
  - @pie-lib/config-ui@14.0.0-next.50

## 3.0.0-next.49

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.49
  - @pie-lib/render-ui@6.2.0-next.52
  - @pie-lib/config-ui@14.0.0-next.49

## 3.0.0-next.48

### Patch Changes

- Updated dependencies
- Updated dependencies [c96fae3]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.48
  - @pie-lib/render-ui@6.2.0-next.51
  - @pie-lib/config-ui@14.0.0-next.48

## 3.0.0-next.47

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.47
  - @pie-lib/config-ui@14.0.0-next.47

## 3.0.0-next.46

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
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
  - @pie-lib/config-ui@14.0.0-next.46
  - @pie-lib/editable-html-tip-tap@3.0.0-next.46
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-lodash@0.1.1-next.3

## 3.0.0-next.45

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.45
- @pie-lib/render-ui@6.2.0-next.49
- @pie-lib/config-ui@14.0.0-next.45

## 3.0.0-next.44

### Patch Changes

- Updated dependencies [60ec99e]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.44
  - @pie-lib/config-ui@14.0.0-next.44

## 3.0.0-next.43

### Patch Changes

- Updated dependencies
  - @pie-lib/editable-html-tip-tap@3.0.0-next.43
  - @pie-lib/config-ui@14.0.0-next.43

## 3.0.0-next.42

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.42
- @pie-lib/render-ui@6.2.0-next.48
- @pie-lib/config-ui@14.0.0-next.42

## 3.0.0-next.41

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.41
- @pie-lib/render-ui@6.2.0-next.47
- @pie-lib/config-ui@14.0.0-next.41

## 3.0.0-next.40

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-lib/config-ui@14.0.0-next.40
  - @pie-lib/editable-html-tip-tap@3.0.0-next.40
  - @pie-lib/render-ui@6.2.0-next.46

## 3.0.0-next.39

### Patch Changes

- @pie-lib/editable-html-tip-tap@3.0.0-next.39
- @pie-lib/render-ui@6.2.0-next.45
- @pie-lib/config-ui@14.0.0-next.39

## 3.0.0-next.38

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.38
  - @pie-lib/editable-html-tip-tap@3.0.0-next.38
  - @pie-lib/render-ui@6.2.0-next.44

## 3.0.0-next.37

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/config-ui@14.0.0-next.37
  - @pie-lib/editable-html-tip-tap@3.0.0-next.37
  - @pie-lib/render-ui@6.2.0-next.43

## 3.0.0-next.36

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36
  - @pie-lib/config-ui@14.0.0-next.36

## 3.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/render-ui@6.2.0-next.41

## 2.0.4-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34
  - @pie-lib/config-ui@13.0.4-next.34

## 2.0.4-next.33

### Patch Changes

- 425feaf: Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33
  - @pie-lib/config-ui@13.0.4-next.33

## 2.0.4-next.32

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39

## 2.0.4-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 2.0.4-next.30

### Patch Changes

- @pie-lib/editable-html-tip-tap@2.1.2-next.30
- @pie-lib/render-ui@6.1.1-next.37
- @pie-lib/config-ui@13.0.4-next.30

## 2.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 2.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
