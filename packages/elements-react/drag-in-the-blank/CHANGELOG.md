# @pie-element/drag-in-the-blank

## 10.2.0-next.28

### Minor Changes

- `completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.
  
  Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.

### Patch Changes

- define and enforce packaging contracts PIE-626
- Publish corrected React element next prereleases from stable npm baselines.
- Prepare all PIE element packages for the next prerelease patch wave
- Trigger the next prerelease patch for all PIE element packages.
- Trigger another prerelease patch for all PIE element packages.
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
- Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
- Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- A session without an `id` or `element` keeps its shuffled choice order across renders. The order is saved through `updateSession`, which receives both as `undefined`, as in pie-elements.
- The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.
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
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [41deafb]
- Updated dependencies [b6ef8b1]
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-controller-utils@0.1.1-next.6
  - @pie-lib/config-ui@14.0.0-next.46
  - @pie-lib/correct-answer-toggle@5.0.0-next.53
  - @pie-lib/drag@4.1.0-next.51
  - @pie-lib/editable-html-tip-tap@3.0.0-next.46
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3
  - @pie-lib/mask-markup@4.0.0-next.48
  - @pie-element/shared-player-events@0.1.1-next.3
  - @pie-element/shared-configure-events@0.1.1-next.1

## 10.2.0-next.27

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/drag@4.1.0-next.50
  - @pie-lib/editable-html-tip-tap@3.0.0-next.45
  - @pie-lib/mask-markup@4.0.0-next.47
  - @pie-lib/render-ui@6.2.0-next.49
  - @pie-lib/config-ui@14.0.0-next.45
  - @pie-lib/correct-answer-toggle@5.0.0-next.52

## 10.2.0-next.26

### Patch Changes

- Updated dependencies [60ec99e]
  - @pie-lib/editable-html-tip-tap@3.0.0-next.44
  - @pie-lib/config-ui@14.0.0-next.44
  - @pie-lib/mask-markup@4.0.0-next.46

## 10.2.0-next.25

### Patch Changes

- 269257a: Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.

## 10.2.0-next.24

### Patch Changes

- Updated dependencies
  - @pie-lib/drag@4.1.0-next.49
  - @pie-lib/editable-html-tip-tap@3.0.0-next.43
  - @pie-lib/mask-markup@4.0.0-next.45
  - @pie-lib/config-ui@14.0.0-next.43

## 10.2.0-next.23

### Patch Changes

- 76a2592: Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
  - @pie-lib/correct-answer-toggle@5.0.0-next.51

## 10.2.0-next.22

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/drag@4.1.0-next.48
  - @pie-lib/editable-html-tip-tap@3.0.0-next.42
  - @pie-lib/mask-markup@4.0.0-next.44
  - @pie-lib/render-ui@6.2.0-next.48
  - @pie-lib/config-ui@14.0.0-next.42
  - @pie-lib/correct-answer-toggle@5.0.0-next.50

## 10.2.0-next.21

### Patch Changes

- 1ecdcf5: The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- 24caee6: A session without an `id` or `element` keeps its shuffled choice order across renders. The order is saved through `updateSession`, which receives both as `undefined`, as in pie-elements.
- Updated dependencies [1ecdcf5]
- Updated dependencies [24caee6]
- Updated dependencies [24caee6]
  - @pie-element/shared-controller-utils@0.1.1-next.5

## 10.2.0-next.20

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Updated dependencies [6ed08c4]
- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-element/shared-player-events@0.1.1-next.2
  - @pie-lib/drag@4.1.0-next.47
  - @pie-lib/editable-html-tip-tap@3.0.0-next.41
  - @pie-lib/mask-markup@4.0.0-next.43
  - @pie-lib/render-ui@6.2.0-next.47
  - @pie-element/shared-controller-utils@0.1.1-next.4
  - @pie-lib/config-ui@14.0.0-next.41
  - @pie-lib/correct-answer-toggle@5.0.0-next.49

## 10.2.0-next.19

### Patch Changes

- c4e2ba3: Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

## 10.2.0-next.18

### Patch Changes

- 473da8e: Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.
- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-controller-utils@0.1.1-next.3
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.40
  - @pie-lib/correct-answer-toggle@5.0.0-next.48
  - @pie-lib/drag@4.1.0-next.46
  - @pie-lib/editable-html-tip-tap@3.0.0-next.40
  - @pie-lib/mask-markup@4.0.0-next.42
  - @pie-lib/render-ui@6.2.0-next.46

## 10.2.0-next.17

### Minor Changes

- 7077034: `completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.

  Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.

### Patch Changes

- Updated dependencies
  - @pie-element/shared-configure-events@0.1.1-next.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-element/shared-player-events@0.1.1-next.1
  - @pie-lib/drag@4.1.0-next.45
  - @pie-lib/editable-html-tip-tap@3.0.0-next.39
  - @pie-lib/mask-markup@4.0.0-next.41
  - @pie-lib/render-ui@6.2.0-next.45
  - @pie-lib/config-ui@14.0.0-next.39
  - @pie-lib/correct-answer-toggle@5.0.0-next.47

## 10.1.2-next.16

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.38
  - @pie-lib/correct-answer-toggle@5.0.0-next.46
  - @pie-lib/drag@4.1.0-next.44
  - @pie-lib/editable-html-tip-tap@3.0.0-next.38
  - @pie-lib/mask-markup@4.0.0-next.40
  - @pie-lib/render-ui@6.2.0-next.44

## 10.1.2-next.15

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/config-ui@14.0.0-next.37
  - @pie-lib/correct-answer-toggle@5.0.0-next.45
  - @pie-lib/drag@4.1.0-next.43
  - @pie-lib/editable-html-tip-tap@3.0.0-next.37
  - @pie-lib/mask-markup@4.0.0-next.39
  - @pie-lib/render-ui@6.2.0-next.43

## 10.1.2-next.14

### Patch Changes

- @pie-lib/correct-answer-toggle@5.0.0-next.44

## 10.1.2-next.13

### Patch Changes

- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
  - @pie-lib/correct-answer-toggle@5.0.0-next.43

## 10.1.2-next.12

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36
  - @pie-lib/drag@4.1.0-next.42
  - @pie-lib/config-ui@14.0.0-next.36
  - @pie-lib/correct-answer-toggle@5.0.0-next.42
  - @pie-lib/mask-markup@4.0.0-next.38

## 10.1.2-next.11

### Patch Changes

- Updated dependencies [285c07c]
  - @pie-element/shared-player-events@0.1.1-next.0

## 10.1.2-next.10

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/correct-answer-toggle@5.0.0-next.41
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/mask-markup@4.0.0-next.37
  - @pie-lib/render-ui@6.2.0-next.41
  - @pie-lib/drag@4.1.0-next.41

## 10.1.2-next.9

### Patch Changes

- Updated dependencies [f568994]
- Updated dependencies [7cae8f9]
- Updated dependencies [7cae8f9]
  - @pie-lib/mask-markup@3.0.4-next.36
  - @pie-lib/drag@4.1.0-next.40
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34
  - @pie-lib/config-ui@13.0.4-next.34
  - @pie-lib/correct-answer-toggle@4.0.3-next.40

## 10.1.2-next.8

### Patch Changes

- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33
  - @pie-lib/config-ui@13.0.4-next.33
  - @pie-lib/mask-markup@3.0.4-next.35

## 10.1.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.

## 10.1.2-next.6

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
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-element/shared-controller-utils@0.1.1-next.2
  - @pie-lib/mask-markup@3.0.4-next.34
  - @pie-lib/correct-answer-toggle@4.0.3-next.39
  - @pie-lib/drag@4.0.3-next.39

## 10.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/correct-answer-toggle@4.0.3-next.38
  - @pie-lib/drag@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/mask-markup@3.0.4-next.33
  - @pie-lib/render-ui@6.1.1-next.38

## 10.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 10.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 10.1.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.37
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/mask-markup@3.0.4-next.32
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/correct-answer-toggle@4.0.3-next.37

## 10.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/mask-markup@3.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 10.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 10.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 10.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/mask-markup@3.0.4-next.0

## 10.1.1-next.1

### Patch Changes

- Updated dependencies [5ca8ec1]
  - @pie-element/shared-controller-utils@0.1.1-next.1

## 10.1.1-next.0

### Patch Changes

- Updated dependencies [509caf6]
  - @pie-element/shared-controller-utils@0.1.1-next.0
