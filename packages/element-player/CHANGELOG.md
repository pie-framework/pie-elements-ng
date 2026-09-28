# @pie-element/element-player

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
