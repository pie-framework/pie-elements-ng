# @pie-lib/charting

## 8.0.2

### Patch Changes

- [#392](https://github.com/pie-framework/pie-elements-ng/pull/392) [`600bb62`](https://github.com/pie-framework/pie-elements-ng/commit/600bb62bb6913a232361372b84352e7623b08102) Thanks [@chillenious](https://github.com/chillenious)! - fix: sanitize element model HTML before it reaches the DOM
- Updated dependencies [[`e06ec61`](https://github.com/pie-framework/pie-elements-ng/commit/e06ec6184b64e0355763dcdb6256d77cc7cc1351), [`336223e`](https://github.com/pie-framework/pie-elements-ng/commit/336223e9efda67723a644b007cf5aad7dd72e221), [`7fc3257`](https://github.com/pie-framework/pie-elements-ng/commit/7fc32575d09e7ed3aa6252ad0a0bc21a4b7f6437), [`dbcfb0a`](https://github.com/pie-framework/pie-elements-ng/commit/dbcfb0a07ae275e865d035961c7ebfe176f26ad1), [`0804268`](https://github.com/pie-framework/pie-elements-ng/commit/080426876dda8057c150dd4b2e08f5e0f00c45ec)]:
  - @pie-lib/render-ui@8.0.2
  - @pie-element/shared-math-rendering-mathjax@0.1.3
  - @pie-lib/plot@5.0.2
  - @pie-element/shared-utils@0.1.2
  - @pie-lib/config-ui@14.0.2

## 8.0.1

### Patch Changes

- [#330](https://github.com/pie-framework/pie-elements-ng/pull/330) [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab) Thanks [@chillenious](https://github.com/chillenious)! - Region names, screen-reader headings, the teacher instructions, rationale and rubric toggles, the drawing-response tool names, the inline dropdown names, the math keypad instructions, the editor toolbar buttons and the chart and graph key legends follow the item language, in English and Spanish, and follow a language change after the first render. A two-part question also labels its parts in the item language. The drawing-response background image is decorative, so screen readers skip it.

- [#342](https://github.com/pie-framework/pie-elements-ng/pull/342) [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e) Thanks [@chillenious](https://github.com/chillenious)! - The custom audio play button on a prompt and the chart's Actions control are buttons a keyboard can reach and press with Enter or Space, with a visible focus ring and an accessible name in the item language ("Play audio", "Actions"). The Actions control tells screen readers whether its popover is open.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#296](https://github.com/pie-framework/pie-elements-ng/pull/296) [`fb0ac81`](https://github.com/pie-framework/pie-elements-ng/commit/fb0ac815b0b0fa3fd44e9986460aaffa8e7f3504) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting, graphing): name the category and mark label inputs

- [#301](https://github.com/pie-framework/pie-elements-ng/pull/301) [`9b72376`](https://github.com/pie-framework/pie-elements-ng/commit/9b72376f6055ba629a913c9a0739623aa6f45e49) Thanks [@chillenious](https://github.com/chillenious)! - fix(plot): name and describe the chart and graph svg

- [#316](https://github.com/pie-framework/pie-elements-ng/pull/316) [`c1ce388`](https://github.com/pie-framework/pie-elements-ng/commit/c1ce388d0736ba88302157936f7808783d6f0ced) Thanks [@chillenious](https://github.com/chillenious)! - fix(theming): follow the theme background on answer slots, legends and media buttons

- [#323](https://github.com/pie-framework/pie-elements-ng/pull/323) [`0ce4b1a`](https://github.com/pie-framework/pie-elements-ng/commit/0ce4b1af649e861783d0c0f27a2a77a1c4570abd) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting): rotate long category labels on first render

- [#325](https://github.com/pie-framework/pie-elements-ng/pull/325) [`56a9e32`](https://github.com/pie-framework/pie-elements-ng/commit/56a9e32e5852cc23929369da487ee250084c2d89) Thanks [@chillenious](https://github.com/chillenious)! - fix: take the remaining element DOM ids from the shared unique-id helper

- [#339](https://github.com/pie-framework/pie-elements-ng/pull/339) [`9b4377a`](https://github.com/pie-framework/pie-elements-ng/commit/9b4377a7be1620f2121120b08406cd3037d083a4) Thanks [@andreeimiron](https://github.com/andreeimiron)! - fix(charting): make marks read-only in evaluate mode on touch devices PIE-1074

- [#375](https://github.com/pie-framework/pie-elements-ng/pull/375) [`da07902`](https://github.com/pie-framework/pie-elements-ng/commit/da07902fc5db2179a8911ce67df0b8eba2ca5c88) Thanks [@chillenious](https://github.com/chillenious)! - fix(charting): make bars, columns and drag handles keyboard-operable sliders
- Updated dependencies [[`89241c4`](https://github.com/pie-framework/pie-elements-ng/commit/89241c4bfbc91b4d53ec9c6652990d046350bbf7), [`022488e`](https://github.com/pie-framework/pie-elements-ng/commit/022488e4766ef96ffdfdb73840235d6acc5a439f), [`eccf20a`](https://github.com/pie-framework/pie-elements-ng/commit/eccf20af3fd0b5b63830ac0ab3b89ee2cecbfaa5), [`199ae92`](https://github.com/pie-framework/pie-elements-ng/commit/199ae92c9ca6fda549936306a82036dd770f619a), [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f), [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975), [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d), [`260da48`](https://github.com/pie-framework/pie-elements-ng/commit/260da48c8db25fa0da4380d5bf8f26875c5da87b), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`338861f`](https://github.com/pie-framework/pie-elements-ng/commit/338861f5ff91ec4d46b567cf0c3ecafa8b2ac467), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`b7ddb94`](https://github.com/pie-framework/pie-elements-ng/commit/b7ddb943f1b3191e1c42e138b7e4b25a1423f4ef), [`204385a`](https://github.com/pie-framework/pie-elements-ng/commit/204385af8ff6ca3511a06b0011c9917f615c9cec), [`fa8466c`](https://github.com/pie-framework/pie-elements-ng/commit/fa8466cae6f9b8aa91cfae36dc37ebb5a1c5684b), [`3294b83`](https://github.com/pie-framework/pie-elements-ng/commit/3294b83b6893501c0ca16fd27e6995845fa2fb73), [`c9e4781`](https://github.com/pie-framework/pie-elements-ng/commit/c9e47812260dfba8e0b4b0538eab78efad4e86ef), [`cffcecc`](https://github.com/pie-framework/pie-elements-ng/commit/cffcecccd7d2b33c31bf14ea1c90ba6688ccd13d), [`8b9c697`](https://github.com/pie-framework/pie-elements-ng/commit/8b9c697b36265441141c130c20ed2b71cd502990), [`2cdbdcb`](https://github.com/pie-framework/pie-elements-ng/commit/2cdbdcb2317c8fa81d9935674765d69941894c54), [`7c077c7`](https://github.com/pie-framework/pie-elements-ng/commit/7c077c76a684118cc2b6b9e2482974bab9078b07), [`d79762a`](https://github.com/pie-framework/pie-elements-ng/commit/d79762aacec2694e537e37eabfc6aa20983a6ae3), [`178c397`](https://github.com/pie-framework/pie-elements-ng/commit/178c397756c98fad9f9f49d216bed6eadd4a32e9), [`7dfa941`](https://github.com/pie-framework/pie-elements-ng/commit/7dfa941f4d8ef46c8625157739f72ae0d6d33983), [`2aa9344`](https://github.com/pie-framework/pie-elements-ng/commit/2aa9344a5de85cd2909c35f6d5d3218342662278), [`4d24c81`](https://github.com/pie-framework/pie-elements-ng/commit/4d24c81f2d1d6438e71960c8df5b5eb10489c2c0), [`2e5cb09`](https://github.com/pie-framework/pie-elements-ng/commit/2e5cb09a131875b67cb7b845b141a52ff6597164), [`216ac0f`](https://github.com/pie-framework/pie-elements-ng/commit/216ac0f5591417cd7d1a83fbde0b4b724a97eb44), [`0848bf3`](https://github.com/pie-framework/pie-elements-ng/commit/0848bf3d5de0489c0a46eb04e87dcb9c94889b45), [`c0d98a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d98a0cb2bf1d8c5e6237d8861aa7c9615b5c01), [`32b1c5b`](https://github.com/pie-framework/pie-elements-ng/commit/32b1c5b5997002eb7c7909c22f21bdaf67a268db), [`ebab8a6`](https://github.com/pie-framework/pie-elements-ng/commit/ebab8a69c0d3cea39f83f5d7dcc4818ffc2981e7), [`ee44175`](https://github.com/pie-framework/pie-elements-ng/commit/ee44175c4c019c6320bf3611a6bcd48c78d036a0), [`39d0980`](https://github.com/pie-framework/pie-elements-ng/commit/39d098078ba330bc71c76f453a3b526d3cfab86c), [`bb4dd44`](https://github.com/pie-framework/pie-elements-ng/commit/bb4dd449ad943440cb869a868534edce8dc1e402), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5), [`2f66905`](https://github.com/pie-framework/pie-elements-ng/commit/2f6690526248104b3ffe83fe77b61c723f35ca9d)]:
  - @pie-element/shared-math-rendering-mathjax@0.1.2
  - @pie-lib/translator@5.0.1
  - @pie-lib/config-ui@14.0.1
  - @pie-lib/render-ui@8.0.1
  - @pie-element/shared-lodash@0.1.2
  - @pie-lib/plot@5.0.1

## 8.0.0

### Major Changes

- [#145](https://github.com/pie-framework/pie-elements-ng/pull/145) [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Sync upstream drag fixes, visx v4, tiptap and number-line math changes

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser

- [#126](https://github.com/pie-framework/pie-elements-ng/pull/126) [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `[#545454](https://github.com/pie-framework/pie-elements-ng/issues/545454)`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#219](https://github.com/pie-framework/pie-elements-ng/issues/219) from pie-framework/chore/remove-unused-code

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`991b31a`](https://github.com/pie-framework/pie-elements-ng/commit/991b31ac954c87c5064f757277edcf8804c072fb), [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8), [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`0f1b96e`](https://github.com/pie-framework/pie-elements-ng/commit/0f1b96e33ead1c1f47a87b291692880991c53a3e), [`b2d3248`](https://github.com/pie-framework/pie-elements-ng/commit/b2d3248a488d850e6afd3f6fa1263eb8d1779ba2), [`a0ee0d5`](https://github.com/pie-framework/pie-elements-ng/commit/a0ee0d51370f2f412501957f8ddf0fd108810a3e), [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`dad31dc`](https://github.com/pie-framework/pie-elements-ng/commit/dad31dcc718bf7f5438ac1ee1fb2e2cae89c650b), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`b73382f`](https://github.com/pie-framework/pie-elements-ng/commit/b73382fe97ee296bf06a0b0a45012649afc4b4e6), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`619ea67`](https://github.com/pie-framework/pie-elements-ng/commit/619ea67e7e5668408b1f3a1d6a3abb2dd06af1cd), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/render-ui@8.0.0
  - @pie-lib/config-ui@14.0.0
  - @pie-lib/translator@5.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1
  - @pie-lib/plot@5.0.0

## 8.0.0-next.54

### Patch Changes

- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8
  - @pie-lib/render-ui@6.2.0-next.53
  - @pie-lib/config-ui@14.0.0-next.50
  - @pie-lib/plot@5.0.0-next.51

## 8.0.0-next.53

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7
  - @pie-lib/render-ui@6.2.0-next.52
  - @pie-lib/config-ui@14.0.0-next.49
  - @pie-lib/plot@5.0.0-next.50

## 8.0.0-next.52

### Patch Changes

- Updated dependencies [c96fae3]
  - @pie-lib/render-ui@6.2.0-next.51
  - @pie-lib/config-ui@14.0.0-next.48
  - @pie-lib/plot@5.0.0-next.49

## 8.0.0-next.51

### Patch Changes

- @pie-lib/config-ui@14.0.0-next.47
  - @pie-lib/plot@5.0.0-next.48

## 8.0.0-next.50

### Major Changes

- Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).
  
  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.
  
  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.
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
  - @pie-lib/config-ui@14.0.0-next.46
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-lib/translator@5.0.0-next.7
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3
  - @pie-lib/plot@5.0.0-next.47

## 8.0.0-next.49

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/render-ui@6.2.0-next.49
  - @pie-lib/config-ui@14.0.0-next.45
  - @pie-lib/plot@5.0.0-next.46

## 8.0.0-next.48

### Patch Changes

- @pie-lib/config-ui@14.0.0-next.44
- @pie-lib/plot@5.0.0-next.45

## 8.0.0-next.47

### Patch Changes

- Merge pull request #219 from pie-framework/chore/remove-unused-code
  - @pie-lib/config-ui@14.0.0-next.43
  - @pie-lib/plot@5.0.0-next.44

## 8.0.0-next.46

### Patch Changes

- Updated dependencies [619ea67]
  - @pie-lib/translator@5.0.0-next.6

## 8.0.0-next.45

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/render-ui@6.2.0-next.48
  - @pie-lib/config-ui@14.0.0-next.42
  - @pie-lib/plot@5.0.0-next.43

## 8.0.0-next.44

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-lib/render-ui@6.2.0-next.47
  - @pie-lib/config-ui@14.0.0-next.41
  - @pie-lib/plot@5.0.0-next.42

## 8.0.0-next.43

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.40
  - @pie-lib/plot@5.0.0-next.41
  - @pie-lib/render-ui@6.2.0-next.46

## 8.0.0-next.42

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-lib/render-ui@6.2.0-next.45
  - @pie-lib/config-ui@14.0.0-next.39
  - @pie-lib/plot@5.0.0-next.40

## 8.0.0-next.41

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.38
  - @pie-lib/plot@5.0.0-next.39
  - @pie-lib/render-ui@6.2.0-next.44

## 8.0.0-next.40

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/config-ui@14.0.0-next.37
  - @pie-lib/plot@5.0.0-next.38
  - @pie-lib/render-ui@6.2.0-next.43

## 8.0.0-next.39

### Patch Changes

- Updated dependencies
  - @pie-lib/plot@5.0.0-next.37

## 8.0.0-next.38

### Patch Changes

- Updated dependencies [dad31dc]
  - @pie-lib/translator@5.0.0-next.5

## 8.0.0-next.37

### Patch Changes

- Updated dependencies [0f1b96e]
- Updated dependencies [b2d3248]
- Updated dependencies [a0ee0d5]
- Updated dependencies [2bb02ad]
  - @pie-lib/translator@5.0.0-next.4

## 8.0.0-next.36

### Patch Changes

- 2f26122: Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)

  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/config-ui@14.0.0-next.36
  - @pie-lib/plot@5.0.0-next.36

## 8.0.0-next.35

### Major Changes

- ed2cbd6: Move the `@pie-lib` packages onto version bases the legacy pie-lib lineage does not publish into, so a bump can no longer land on a version number npm already holds (PIE-1041).

  Both repos publish these names and both increment the same `<base>-next.N` series, with legacy's counter far ahead of this repo's. When a bump lands on a number legacy already published, npm refuses the overwrite, the package is never published from here, and every element that pins it silently resolves the legacy build instead — which is how `next.9` shipped elements linked against June 2026 lib code, failed 25 of 172 bundle combinations, and left the inline-dropdown, keyboard-placement, selected-choice, drag-placeholder and graphing-palette fixes out of the bundles despite them being on develop.

  A major takes each package to a base legacy has never used, which removes both the collision on publish and the caret eviction that follows it: legacy packages stop entering the dependency graph, so their `^` ranges — which exclude this repo's prereleases and resolve to legacy stables — stop being consulted at all. This is a version-coordination change only; no runtime behaviour changes.

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/plot@5.0.0-next.35
  - @pie-lib/translator@5.0.0-next.3
  - @pie-lib/render-ui@6.2.0-next.41

## 7.0.4-next.34

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/config-ui@13.0.4-next.34
  - @pie-lib/plot@4.0.4-next.34

## 7.0.4-next.33

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- 425feaf: Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
- Updated dependencies [425feaf]
- Updated dependencies [425feaf]
  - @pie-lib/plot@4.0.4-next.33
  - @pie-lib/config-ui@13.0.4-next.33

## 7.0.4-next.32

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/translator@4.0.3-next.2
  - @pie-lib/plot@4.0.4-next.32

## 7.0.4-next.31

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/plot@4.0.4-next.31
  - @pie-lib/render-ui@6.1.1-next.38
  - @pie-lib/translator@4.0.3-next.1

## 7.0.4-next.30

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/plot@4.0.4-next.30

## 7.0.4-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/plot@4.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0

## 7.0.4-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/translator@4.0.3-next.0
  - @pie-lib/plot@4.0.4-next.0
