# @pie-lib/tools

## 3.0.3

### Patch Changes

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#566](https://github.com/pie-framework/pie-elements-ng/pull/566) [`a760d62`](https://github.com/pie-framework/pie-elements-ng/commit/a760d62cbe133327784d57dd1719292c44452f5e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @vitejs/plugin-react from 6.1.1 to 6.1.2

- [#615](https://github.com/pie-framework/pie-elements-ng/pull/615) [`ca4e017`](https://github.com/pie-framework/pie-elements-ng/commit/ca4e01737d08875caa6b334f0f596332a31be45e) Thanks [@chillenious](https://github.com/chillenious)! - chore: declare the MIT licence in every published manifest

- [#643](https://github.com/pie-framework/pie-elements-ng/pull/643) [`9db0a48`](https://github.com/pie-framework/pie-elements-ng/commit/9db0a48bd03a2d31bdb805d45258700317b6d8b7) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @vitejs/plugin-react from 6.1.2 to 6.2.1

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#684](https://github.com/pie-framework/pie-elements-ng/pull/684) [`e729ead`](https://github.com/pie-framework/pie-elements-ng/commit/e729eadca70c1057ca896f84e5033d72a1fbdcff) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump @vitejs/plugin-react from 6.2.1 to 6.3.0

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850) Thanks [@chillenious](https://github.com/chillenious)! - Ship the license and NOTICE texts of every bundled third-party package in `THIRD_PARTY_LICENSES.txt` files beside the build output that bundles it.
- Updated dependencies [[`6ac2b66`](https://github.com/pie-framework/pie-elements-ng/commit/6ac2b6616b4c49333cf0aee02d08d89b453a73cd), [`5479c19`](https://github.com/pie-framework/pie-elements-ng/commit/5479c19523118e69286e8dc8d142eb183edbdf2b), [`b0cf3ee`](https://github.com/pie-framework/pie-elements-ng/commit/b0cf3ee97bb6bce681b4aa080e5e613d49b0d9b5), [`2867c08`](https://github.com/pie-framework/pie-elements-ng/commit/2867c082419e42a211067959be12d8e310403e2e), [`1f9a93f`](https://github.com/pie-framework/pie-elements-ng/commit/1f9a93f3e43c01c1c30fc811152b87a601888fa3), [`d18d9e7`](https://github.com/pie-framework/pie-elements-ng/commit/d18d9e72bb88dc5911cbbd3dab7d314682536961), [`3317723`](https://github.com/pie-framework/pie-elements-ng/commit/33177237243a29f4bfb8956a9c4fdab336b4a353), [`db48dfd`](https://github.com/pie-framework/pie-elements-ng/commit/db48dfd851ae4385d068a9f94cc092bdd05833d3), [`f408704`](https://github.com/pie-framework/pie-elements-ng/commit/f40870446d77da573bc46584f5ffaf497d255688), [`f6e8801`](https://github.com/pie-framework/pie-elements-ng/commit/f6e880189215966f224b93da5072cfa1e8d1b839), [`82a155d`](https://github.com/pie-framework/pie-elements-ng/commit/82a155d26339a2830b706e154cc11360955f8c77)]:
  - @pie-element/shared-lodash@0.1.4
  - @pie-lib/style-utils@3.0.3

## 3.0.2

### Patch Changes

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

- [#507](https://github.com/pie-framework/pie-elements-ng/pull/507) [`851b0f5`](https://github.com/pie-framework/pie-elements-ng/commit/851b0f5206c8e87ae154ffbfc335f4f1500724e2) Thanks [@chillenious](https://github.com/chillenious)! - Stop using the React APIs that React 19 removes — `findDOMNode`, `ReactDOM.render`, legacy
  context and `defaultProps` on function components — while staying on React 18. `UiLayout` and
  `ConfigLayout` take a `containerRef` for their root element; the elements that measured or
  rendered math into that element through `findDOMNode` got the extraCSSRules `<style>` node
  instead whenever rules were set. `@pie-lib/editable-html-tip-tap` drops its unused `react-jss`
  dependency.
- Updated dependencies [[`0a16eb5`](https://github.com/pie-framework/pie-elements-ng/commit/0a16eb585bd48633b5ec7d81a8cc502a8002d3a9), [`feb4d06`](https://github.com/pie-framework/pie-elements-ng/commit/feb4d060bc1a867bbe524cdf597fb903b0f771ac)]:
  - @pie-element/shared-lodash@0.1.3
  - @pie-lib/style-utils@3.0.2

## 3.0.1

### Patch Changes

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#349](https://github.com/pie-framework/pie-elements-ng/pull/349) [`621fd93`](https://github.com/pie-framework/pie-elements-ng/commit/621fd9339235fa55e1291f6a65dc1d94abb9abb4) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump assert from 1.5.1 to 2.1.0
- Updated dependencies [[`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4)]:
  - @pie-element/shared-lodash@0.1.2
  - @pie-lib/style-utils@3.0.1

## 3.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-element/shared-lodash@0.1.1
  - @pie-lib/style-utils@3.0.0

## 3.0.0-next.6

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.3
  - @pie-lib/style-utils@3.0.0-next.2

## 3.0.0-next.5

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 3.0.0-next.4

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2

## 3.0.0-next.3

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/style-utils@3.0.0-next.1

## 3.0.0-next.2

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/style-utils@3.0.0-next.0

## 2.0.3-next.1

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1

## 2.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
