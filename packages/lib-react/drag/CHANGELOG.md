# @pie-lib/drag

## 5.0.0

### Major Changes

- [#261](https://github.com/pie-framework/pie-elements-ng/pull/261) [`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - First stable release built from pie-elements-ng, which replaces the pie-elements and pie-lib builds of this package.
  
  It is a new major version, above every version those repositories published, so existing `^` ranges on the earlier line keep resolving the earlier builds. Moving to this version is opt-in.

### Minor Changes

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- [#31](https://github.com/pie-framework/pie-elements-ng/pull/31) [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng ESM builds for PIE lib packages

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Paint the empty choice slot on the surface token, so placement-ordering's empty slots follow the theme (PIE-872)

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#219](https://github.com/pie-framework/pie-elements-ng/issues/219) from pie-framework/chore/remove-unused-code

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/render-ui@8.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1

## 4.1.0-next.54

### Patch Changes

- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8
  - @pie-lib/render-ui@6.2.0-next.53

## 4.1.0-next.53

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7
  - @pie-lib/render-ui@6.2.0-next.52

## 4.1.0-next.52

### Patch Changes

- Updated dependencies [c96fae3]
  - @pie-lib/render-ui@6.2.0-next.51

## 4.1.0-next.51

### Minor Changes

- Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Publish ng ESM builds for PIE lib packages
- Paint the empty choice slot on the surface token, so placement-ordering's empty slots follow the theme (PIE-872)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Merge pull request #219 from pie-framework/chore/remove-unused-code
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
- Updated dependencies [b6ef8b1]
- Updated dependencies
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3

## 4.1.0-next.50

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/render-ui@6.2.0-next.49

## 4.1.0-next.49

### Patch Changes

- Merge pull request #219 from pie-framework/chore/remove-unused-code

## 4.1.0-next.48

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/render-ui@6.2.0-next.48

## 4.1.0-next.47

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-lib/render-ui@6.2.0-next.47

## 4.1.0-next.46

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/render-ui@6.2.0-next.46

## 4.1.0-next.45

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-lib/render-ui@6.2.0-next.45

## 4.1.0-next.44

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/render-ui@6.2.0-next.44

## 4.1.0-next.43

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/render-ui@6.2.0-next.43

## 4.1.0-next.42

### Patch Changes

- 4fe8ce6: Paint the empty choice slot on the surface token, so placement-ordering's empty slots follow the theme (PIE-872)
- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42

## 4.1.0-next.41

### Patch Changes

- @pie-lib/render-ui@6.2.0-next.41

## 4.1.0-next.40

### Minor Changes

- 7cae8f9: Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40

## 4.0.3-next.39

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/render-ui@6.1.1-next.39

## 4.0.3-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/render-ui@6.1.1-next.38

## 4.0.3-next.37

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.37

## 4.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 4.0.3-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
