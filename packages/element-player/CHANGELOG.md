# @pie-element/element-player

## 0.1.2

### Patch Changes

- [#156](https://github.com/pie-framework/pie-elements-ng/pull/156) [`d22cfb1`](https://github.com/pie-framework/pie-elements-ng/commit/d22cfb1980fb6ddf444e62e4a67d7e10cfe14e60) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

- [#187](https://github.com/pie-framework/pie-elements-ng/pull/187) [`6e32ff5`](https://github.com/pie-framework/pie-elements-ng/commit/6e32ff5b66b242a515881f0dc45420dd0bb555ab) Thanks [@chillenious](https://github.com/chillenious)! - `<pie-element-player>` dispatches its events from the player, bubbling and composed, so bubble-phase listeners on an ancestor or `document` receive each once, with `target` the player, retargeted to the shadow host when the player sits in a shadow root. Capture-phase listeners above the player also hear the element's own `session-changed`, ahead of the player's copy. A listener that throws no longer becomes `player-error` and the error view: the browser reports it as uncaught and the load completes. `once: true` is honoured, and a listener survives a disconnect and reconnect, can be removed before the player connects, and hears events when it was added before the element upgraded. A player detached mid-load emits nothing more from that load, including once it is re-attached.

- [#190](https://github.com/pie-framework/pie-elements-ng/pull/190) [`37bbe22`](https://github.com/pie-framework/pie-elements-ng/commit/37bbe22c2d85bec3c425456cc9ce56d95dc21cf6) Thanks [@chillenious](https://github.com/chillenious)! - In delivery, the player hands an element its session only after its model, so elements that read the model in their session setter, such as `graphing-solution-set`, mount under IIFE, where the model is computed once the bundle's controller arrives. Until then it ignores the sessions an element reports, so an element's default session cannot replace a restored one.

- [#205](https://github.com/pie-framework/pie-elements-ng/pull/205) [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704) Thanks [@chillenious](https://github.com/chillenious)! - Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.

- [#208](https://github.com/pie-framework/pie-elements-ng/pull/208) [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6) Thanks [@chillenious](https://github.com/chillenious)! - MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

- [#209](https://github.com/pie-framework/pie-elements-ng/pull/209) [`8bd4fe2`](https://github.com/pie-framework/pie-elements-ng/commit/8bd4fe251a62a4a1b7a33b45b22e4fab6d3fb1b1) Thanks [@chillenious](https://github.com/chillenious)! - Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

- [#225](https://github.com/pie-framework/pie-elements-ng/pull/225) [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02) Thanks [@chillenious](https://github.com/chillenious)! - Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

- [#219](https://github.com/pie-framework/pie-elements-ng/pull/219) [`f6d5dd4`](https://github.com/pie-framework/pie-elements-ng/commit/f6d5dd451fb30978c02e949d522ac2f6184e7e3b) Thanks [@chillenious](https://github.com/chillenious)! - `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`ce67393`](https://github.com/pie-framework/pie-elements-ng/commit/ce67393e5fefd8736fca96e7c92a36a129b068f3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#210](https://github.com/pie-framework/pie-elements-ng/issues/210) from pie-framework/dependabot/github_actions/actions/cache-6

- [#232](https://github.com/pie-framework/pie-elements-ng/pull/232) [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50) Thanks [@chillenious](https://github.com/chillenious)! - Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.

- [#248](https://github.com/pie-framework/pie-elements-ng/pull/248) [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651) Thanks [@chillenious](https://github.com/chillenious)! - Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

- [#251](https://github.com/pie-framework/pie-elements-ng/pull/251) [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755) Thanks [@chillenious](https://github.com/chillenious)! - When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

- [#249](https://github.com/pie-framework/pie-elements-ng/pull/249) [`b56d58f`](https://github.com/pie-framework/pie-elements-ng/commit/b56d58f349da84602d6c8f60339bd83f56e574cc) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - `pie-element-player` renders math with a renderer the page installed at `window['@pie-lib/math-rendering']` before the player mounted, such as a MathJax 3 one, and then loads no MathJax 4. Without one, the first player installs its MathJax 4 renderer and later players reuse it. Each render reads the global and calls its `renderMath` as a method.
- Updated dependencies [[`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755)]:
  - @pie-element/shared-math-rendering-mathjax@0.1.1

## 0.1.2-next.15

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.
- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8

## 0.1.2-next.14

### Patch Changes

- b56d58f: `pie-element-player` renders math with a renderer the page installed at `window['@pie-lib/math-rendering']` before the player mounted, such as a MathJax 3 one, and then loads no MathJax 4. Without one, the first player installs its MathJax 4 renderer and later players reuse it. Each render reads the global and calls its `renderMath` as a method.

## 0.1.2-next.13

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.
- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7

## 0.1.2-next.12

### Patch Changes

- Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)
- `<pie-element-player>` dispatches its events from the player, bubbling and composed, so bubble-phase listeners on an ancestor or `document` receive each once, with `target` the player, retargeted to the shadow host when the player sits in a shadow root. Capture-phase listeners above the player also hear the element's own `session-changed`, ahead of the player's copy. A listener that throws no longer becomes `player-error` and the error view: the browser reports it as uncaught and the load completes. `once: true` is honoured, and a listener survives a disconnect and reconnect, can be removed before the player connects, and hears events when it was added before the element upgraded. A player detached mid-load emits nothing more from that load, including once it is re-attached.
- In delivery, the player hands an element its session only after its model, so elements that read the model in their session setter, such as `graphing-solution-set`, mount under IIFE, where the model is computed once the bundle's controller arrives. Until then it ignores the sessions an element reports, so an element's default session cannot replace a restored one.
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.
- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [b6ef8b1]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6

## 0.1.2-next.11

### Patch Changes

- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6

## 0.1.2-next.10

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5

## 0.1.2-next.9

### Patch Changes

- f6d5dd4: `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.

## 0.1.2-next.8

### Patch Changes

- 8bd4fe2: Shipped type declarations resolve for a client that installs only the package: `@pie-lib/delivery-events-svelte`, which the delivery types reference, is now a dependency, and relative declaration imports carry their `.js` extension for `moduleResolution: node16`.

## 0.1.2-next.7

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4

## 0.1.2-next.6

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3

## 0.1.2-next.5

### Patch Changes

- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2

## 0.1.2-next.4

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1

## 0.1.2-next.3

### Patch Changes

- 6e32ff5: `<pie-element-player>` dispatches its events from the player, bubbling and composed, so bubble-phase listeners on an ancestor or `document` receive each once, with `target` the player, retargeted to the shadow host when the player sits in a shadow root. Capture-phase listeners above the player also hear the element's own `session-changed`, ahead of the player's copy. A listener that throws no longer becomes `player-error` and the error view: the browser reports it as uncaught and the load completes. `once: true` is honoured, and a listener survives a disconnect and reconnect, can be removed before the player connects, and hears events when it was added before the element upgraded. A player detached mid-load emits nothing more from that load, including once it is re-attached.

## 0.1.2-next.2

### Patch Changes

- 37bbe22: In delivery, the player hands an element its session only after its model, so elements that read the model in their session setter, such as `graphing-solution-set`, mount under IIFE, where the model is computed once the bundle's controller arrives. Until then it ignores the sessions an element reports, so an element's default session cannot replace a restored one.

## 0.1.2-next.1

### Patch Changes

- d22cfb1: Pin every @tiptap/\* dependency to exactly 3.31.3, so installing more than one PIE element resolves a single @tiptap/core instead of three. tiptap pins its own peers exactly from 3.24.0 on, so a mixed set cannot be satisfied and the duplicate core breaks ProseMirror on schema and plugin identity. Also dedupes prosemirror-model and prosemirror-view, which tiptap was warning about ("wrapping and splitting nodes will fail"). element-player drops its 8 @tiptap/\* dependencies plus lowlight and highlight.js: they were only reachable from an orphaned JsonEditor/ModelInspector pair that nothing imported, so none of them ever reached its bundle (PIE-1042)

## 0.1.2-next.0

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0

## 0.1.1

### Patch Changes

- e131840: Prepare the player and bundler packages for the next publish cycle.
  Includes release updates for `element-player`, `print-player`, and `bundler-shared`.
